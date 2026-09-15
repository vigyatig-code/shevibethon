import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../lib/hooks'

// ScrollShapeParticles: a fixed full-screen canvas that renders warm
// brown/gold particles which gradually morph between civic-inspired
// abstract shapes as the user scrolls. Shape types interpolate smoothly:
//   0.0–0.25  circles & dots
//   0.25–0.50 rounded squares & soft fragments
//   0.50–0.75 triangles, diamonds, connected nodes
//   0.75–1.0  arches, stars, simplified building silhouettes
//
// Particles drift with scroll-driven parallax, connect with faint lines
// when nearby, and respond gently to mouse movement. Pauses when the tab
// is hidden or when prefers-reduced-motion is enabled (static render).
// High-DPI aware, particle count scales down on mobile. No React state
// updates during animation — everything runs in a single rAF loop.

interface ShapeParticle {
  x: number
  y: number
  vx: number
  vy: number
  baseSize: number
  baseAlpha: number
  rotation: number
  rotSpeed: number
  morphOffset: number // stagger so particles don't all morph at once
}

// Shape type indices — we interpolate between adjacent types
// 0=circle, 1=rounded-square, 2=triangle, 3=diamond, 4=arch, 5=star
const SHAPE_COUNT = 6

// Each scroll zone maps to a shape index; we lerp between them
const SHAPE_ZONES: [number, number][] = [
  [0.0, 0],   // circles
  [0.25, 1],  // rounded squares
  [0.5, 2],   // triangles
  [0.65, 3],  // diamonds
  [0.8, 4],   // arches
  [0.95, 5],  // stars
]

function shapeIndexAt(progress: number): number {
  for (let i = 0; i < SHAPE_ZONES.length - 1; i++) {
    const [p0, s0] = SHAPE_ZONES[i]
    const [p1, s1] = SHAPE_ZONES[i + 1]
    if (progress >= p0 && progress <= p1) {
      const t = (progress - p0) / (p1 - p0)
      return s0 + t * (s1 - s0)
    }
  }
  if (progress < SHAPE_ZONES[0][0]) return SHAPE_ZONES[0][1]
  return SHAPE_ZONES[SHAPE_ZONES.length - 1][1]
}

const PARTICLE_RGB = [196, 151, 106] as const // muted gold #c4976a
const LINE_RGB = [169, 101, 69] as const      // terracotta #a96545
const ALT_RGB = [111, 78, 55] as const        // warm brown #6f4e37
const MAX_LINE_DIST = 140

// ---- Shape drawing helpers ----

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, _rot: number) {
  ctx.beginPath()
  ctx.arc(x, y, size, 0, Math.PI * 2)
  ctx.fill()
}

function drawRoundedSquare(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number, cornerRadius: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  const r = Math.min(cornerRadius, size * 0.5)
  const s = size * 1.6
  ctx.beginPath()
  if (ctx.roundRect) {
    ctx.roundRect(-s / 2, -s / 2, s, s, r)
  } else {
    ctx.rect(-s / 2, -s / 2, s, s)
  }
  ctx.fill()
  ctx.restore()
}

function drawTriangle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  const s = size * 1.8
  ctx.beginPath()
  ctx.moveTo(0, -s)
  ctx.lineTo(s * 0.866, s * 0.5)
  ctx.lineTo(-s * 0.866, s * 0.5)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  const s = size * 1.5
  ctx.beginPath()
  ctx.moveTo(0, -s)
  ctx.lineTo(s * 0.7, 0)
  ctx.lineTo(0, s)
  ctx.lineTo(-s * 0.7, 0)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawArch(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  const s = size * 1.4
  ctx.beginPath()
  // Arch: rounded top, flat bottom — like a doorway silhouette
  ctx.moveTo(-s, s)
  ctx.lineTo(-s, -s * 0.2)
  ctx.quadraticCurveTo(-s, -s, 0, -s)
  ctx.quadraticCurveTo(s, -s, s, -s * 0.2)
  ctx.lineTo(s, s)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  const outer = size * 1.4
  const inner = outer * 0.45
  const points = 5
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const angle = (i * Math.PI) / points - Math.PI / 2
    const px = Math.cos(angle) * r
    const py = Math.sin(angle) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// Interpolate between two shape types based on fractional shape index
function drawParticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rot: number,
  shapeIdx: number,
  cornerRadius: number,
) {
  const lowerIdx = Math.floor(shapeIdx)
  const upperIdx = Math.min(lowerIdx + 1, SHAPE_COUNT - 1)
  const t = shapeIdx - lowerIdx

  // Draw lower shape at reduced opacity, upper shape at increasing opacity
  // For t=0 we only draw the lower shape; for t=1 only the upper
  const lowerAlpha = 1 - t
  const upperAlpha = t

  const prevGlobalAlpha = ctx.globalAlpha

  if (lowerAlpha > 0.01) {
    ctx.globalAlpha = prevGlobalAlpha * lowerAlpha
    drawSingleShape(ctx, x, y, size, rot, lowerIdx, cornerRadius)
  }
  if (upperAlpha > 0.01 && upperIdx !== lowerIdx) {
    ctx.globalAlpha = prevGlobalAlpha * upperAlpha
    drawSingleShape(ctx, x, y, size * (0.85 + t * 0.15), rot + t * 0.3, upperIdx, cornerRadius)
  }

  ctx.globalAlpha = prevGlobalAlpha
}

function drawSingleShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rot: number,
  idx: number,
  cornerRadius: number,
) {
  switch (idx) {
    case 0: drawCircle(ctx, x, y, size, rot); break
    case 1: drawRoundedSquare(ctx, x, y, size, rot, cornerRadius); break
    case 2: drawTriangle(ctx, x, y, size, rot); break
    case 3: drawDiamond(ctx, x, y, size, rot); break
    case 4: drawArch(ctx, x, y, size, rot); break
    case 5: drawStar(ctx, x, y, size, rot); break
    default: drawCircle(ctx, x, y, size, rot); break
  }
}

export default function ScrollShapeParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let particles: ShapeParticle[] = []
    let scrollProgress = 0
    let targetScrollProgress = 0
    let dpr = 1
    let pageVisible = true

    // Mouse parallax (no React state, just refs in closure)
    let mouseX = 0
    let mouseY = 0
    let targetMouseX = 0
    let targetMouseY = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      initParticles(w, h)
    }

    const initParticles = (w: number, h: number) => {
      const area = w * h
      const isSmall = w < 768
      const baseCount = isSmall
        ? Math.min(Math.floor(area / 26000), 22)
        : Math.min(Math.floor(area / 16000), 55)

      particles = []
      for (let i = 0; i < baseCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.14,
          baseSize: Math.random() * 2.5 + 1.2,
          baseAlpha: Math.random() * 0.3 + 0.1,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.008,
          morphOffset: (Math.random() - 0.5) * 0.12, // stagger morph timing
        })
      }
    }

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      targetScrollProgress = max > 0 ? Math.min(window.scrollY / max, 1) : 0
    }

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 20
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 20
    }

    const onVisibility = () => {
      pageVisible = !document.hidden
      if (pageVisible && !raf) {
        raf = requestAnimationFrame(draw)
      }
    }

    const drawStatic = () => {
      // Reduced-motion: draw one frame of faint static shapes, no animation
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        const alpha = p.baseAlpha * 0.5
        ctx.fillStyle = `rgba(${PARTICLE_RGB[0]}, ${PARTICLE_RGB[1]}, ${PARTICLE_RGB[2]}, ${alpha})`
        ctx.globalAlpha = 1
        drawCircle(ctx, p.x, p.y, p.baseSize, 0)
      }
    }

    const draw = () => {
      if (!pageVisible) {
        raf = 0
        return
      }

      // Smooth interpolation
      scrollProgress += (targetScrollProgress - scrollProgress) * 0.05
      mouseX += (targetMouseX - mouseX) * 0.04
      mouseY += (targetMouseY - mouseY) * 0.04

      const w = canvas.width / dpr
      const h = canvas.height / dpr

      ctx.clearRect(0, 0, w, h)

      // Scroll-driven modifiers
      const driftX = (scrollProgress - 0.5) * 0.12
      const driftY = -scrollProgress * 0.18 // upward drift as user scrolls down
      const intensityBoost = 1 + scrollProgress * 0.5
      const opacityMul = 0.65 + scrollProgress * 0.35
      const parallaxY = scrollProgress * 25

      // Update + draw particles
      for (const p of particles) {
        p.x += p.vx * intensityBoost + driftX
        p.y += p.vy * intensityBoost + driftY
        p.rotation += p.rotSpeed * intensityBoost

        // Wrap edges
        if (p.x < -15) p.x = w + 15
        if (p.x > w + 15) p.x = -15
        if (p.y < -15) p.y = h + 15
        if (p.y > h + 15) p.y = -15

        // Per-particle morph: stagger so they don't all change at once
        const pMorph = Math.max(0, Math.min(1, scrollProgress + p.morphOffset))
        const pShapeIdx = shapeIndexAt(pMorph)

        const alpha = Math.min(p.baseAlpha * opacityMul, 0.5)
        const size = Math.max(0.5, p.baseSize)

        // Render position with mouse + scroll parallax
        const rx = p.x + mouseX * (0.3 + p.baseSize * 0.05)
        const ry = p.y - parallaxY * 0.3 + mouseY * (0.3 + p.baseSize * 0.05)

        // Alternate color slightly based on shape type for variety
        const shapeFloor = Math.floor(pShapeIdx)
        const colorRgb = shapeFloor % 2 === 0 ? PARTICLE_RGB : ALT_RGB

        // Soft glow
        ctx.fillStyle = `rgba(${colorRgb[0]}, ${colorRgb[1]}, ${colorRgb[2]}, ${alpha * 0.3})`
        ctx.beginPath()
        ctx.arc(rx, ry, size * 2.5, 0, Math.PI * 2)
        ctx.fill()

        // Core shape
        ctx.fillStyle = `rgba(${colorRgb[0]}, ${colorRgb[1]}, ${colorRgb[2]}, ${alpha})`
        const cornerRadius = size * (1.2 - pShapeIdx * 0.15) // circles→sharp
        drawParticle(ctx, rx, ry, size, p.rotation, pShapeIdx, cornerRadius)
      }

      // Connecting lines — fade by distance, low opacity
      const lineAlphaBase = 0.03 + scrollProgress * 0.03
      for (let i = 0; i < particles.length; i++) {
        const pi = particles[i]
        const pix = pi.x + mouseX * (0.3 + pi.baseSize * 0.05)
        const piy = pi.y - parallaxY * 0.3 + mouseY * (0.3 + pi.baseSize * 0.05)
        for (let j = i + 1; j < particles.length; j++) {
          const pj = particles[j]
          const pjx = pj.x + mouseX * (0.3 + pj.baseSize * 0.05)
          const pjy = pj.y - parallaxY * 0.3 + mouseY * (0.3 + pj.baseSize * 0.05)
          const dx = pix - pjx
          const dy = piy - pjy
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_LINE_DIST) {
            const fade = 1 - dist / MAX_LINE_DIST
            ctx.strokeStyle = `rgba(${LINE_RGB[0]}, ${LINE_RGB[1]}, ${LINE_RGB[2]}, ${lineAlphaBase * fade})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(pix, piy)
            ctx.lineTo(pjx, pjy)
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    onScroll()

    if (reducedMotion) {
      drawStatic()
    } else {
      window.addEventListener('resize', resize)
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('mousemove', onMouseMove, { passive: true })
      document.addEventListener('visibilitychange', onVisibility)
      raf = requestAnimationFrame(draw)
    }

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('visibilitychange', onVisibility)
      cancelAnimationFrame(raf)
    }
  }, [reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      className="civic-bg-canvas civic-shape-particles"
      aria-hidden="true"
      style={{ willChange: 'transform' }}
    />
  )
}
