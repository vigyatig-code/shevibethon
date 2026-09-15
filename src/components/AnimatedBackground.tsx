import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../lib/hooks'

// AnimatedBackground: a fixed-position canvas that renders a subtle
// network-style particle field with warm brown/gold particles and
// very low-opacity connecting lines. Particles respond to scroll
// progress by shifting drift direction, movement intensity, opacity,
// and parallax offset. Pauses when the page is hidden or when
// prefers-reduced-motion is enabled. High-DPI aware. Particle count
// is reduced on smaller screens.

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseAlpha: number
}

const PARTICLE_COLOR = [196, 151, 106] as const // #c4976a muted gold
const LINE_COLOR = [169, 101, 69] as const // #a96545 terracotta
const MAX_LINE_DIST = 130

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let particles: Particle[] = []
    let scrollProgress = 0
    let targetScrollProgress = 0
    let dpr = 1
    let pageVisible = true

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
        ? Math.min(Math.floor(area / 22000), 28)
        : Math.min(Math.floor(area / 14000), 70)

      particles = []
      for (let i = 0; i < baseCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.15,
          radius: Math.random() * 1.6 + 0.5,
          baseAlpha: Math.random() * 0.35 + 0.12,
        })
      }
    }

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      targetScrollProgress = max > 0 ? Math.min(window.scrollY / max, 1) : 0
    }

    const onVisibility = () => {
      pageVisible = !document.hidden
      if (pageVisible && !raf) {
        raf = requestAnimationFrame(draw)
      }
    }

    const draw = () => {
      if (!pageVisible) {
        raf = 0
        return
      }

      // Smooth scroll progress interpolation
      scrollProgress += (targetScrollProgress - scrollProgress) * 0.06

      const w = canvas.width / dpr
      const h = canvas.height / dpr

      ctx.clearRect(0, 0, w, h)

      // Scroll-driven drift modifiers
      const driftX = (scrollProgress - 0.5) * 0.15
      const driftY = scrollProgress * 0.12
      const intensityBoost = 1 + scrollProgress * 0.6
      const opacityMul = 0.7 + scrollProgress * 0.3
      const parallaxY = scrollProgress * 20

      // Update + draw particles
      for (const p of particles) {
        p.x += p.vx * intensityBoost + driftX
        p.y += p.vy * intensityBoost + driftY

        // Wrap edges
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        const alpha = Math.min(p.baseAlpha * opacityMul, 0.55)
        const r = Math.max(0.3, p.radius)

        // Particle glow
        const grad = ctx.createRadialGradient(p.x, p.y - parallaxY * 0.3, 0, p.x, p.y - parallaxY * 0.3, r * 3)
        grad.addColorStop(0, `rgba(${PARTICLE_COLOR[0]}, ${PARTICLE_COLOR[1]}, ${PARTICLE_COLOR[2]}, ${alpha})`)
        grad.addColorStop(1, `rgba(${PARTICLE_COLOR[0]}, ${PARTICLE_COLOR[1]}, ${PARTICLE_COLOR[2]}, 0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y - parallaxY * 0.3, r * 3, 0, Math.PI * 2)
        ctx.fill()

        // Particle core
        ctx.fillStyle = `rgba(${PARTICLE_COLOR[0]}, ${PARTICLE_COLOR[1]}, ${PARTICLE_COLOR[2]}, ${alpha * 1.4})`
        ctx.beginPath()
        ctx.arc(p.x, p.y - parallaxY * 0.3, r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw connecting lines between nearby particles
      const lineAlphaBase = 0.04 + scrollProgress * 0.04
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = (particles[i].y - parallaxY * 0.3) - (particles[j].y - parallaxY * 0.3)
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_LINE_DIST) {
            const fade = 1 - dist / MAX_LINE_DIST
            ctx.strokeStyle = `rgba(${LINE_COLOR[0]}, ${LINE_COLOR[1]}, ${LINE_COLOR[2]}, ${lineAlphaBase * fade})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y - parallaxY * 0.3)
            ctx.lineTo(particles[j].x, particles[j].y - parallaxY * 0.3)
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    onScroll()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    raf = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      cancelAnimationFrame(raf)
    }
  }, [reducedMotion])

  if (reducedMotion) {
    return <div className="civic-bg-static" aria-hidden="true" />
  }

  return (
    <>
      <canvas ref={canvasRef} className="civic-bg-canvas" aria-hidden="true" />
      <div className="civic-bg-aurora" aria-hidden="true">
        <div className="aurora-layer aurora-1" />
        <div className="aurora-layer aurora-2" />
        <div className="aurora-layer aurora-3" />
      </div>
      <div className="civic-bg-gradients" aria-hidden="true" />
    </>
  )
}
