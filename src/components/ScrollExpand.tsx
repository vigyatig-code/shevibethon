import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import './ScrollExpand.css'

interface ScrollExpandProps {
  src?: string
  mediaType?: 'image' | 'video'
  poster?: string
  alt?: string
  title?: string
  scrollHint?: string
  startWidth?: number
  startHeight?: number
  startRadius?: number
  endRadius?: number
  mediaZoom?: number
  scrollDistance?: number
  holdDistance?: number
  smoothing?: number
  overlayScrim?: number
  useWindowScroll?: boolean
  enabled?: boolean
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0 || 0.000001), 0, 1)
  return t * t * (3 - 2 * t)
}

export default function ScrollExpand({
  src = '',
  mediaType = 'image',
  poster = '',
  alt = '',
  title = '',
  scrollHint = '',
  startWidth = 42,
  startHeight = 58,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.35,
  scrollDistance = 1.2,
  holdDistance = 0.35,
  smoothing = 0.1,
  overlayScrim = 0.45,
  useWindowScroll = false,
  enabled = true,
  children,
  className = '',
  style,
}: ScrollExpandProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  const applyProgress = useCallback((progress: number) => {
    const frame = frameRef.current
    const media = mediaRef.current
    if (!frame || !media) return

    const eased = smoothstep(0, 1, progress)
    const width = startWidth + (100 - startWidth) * eased
    const height = startHeight + (100 - startHeight) * eased
    const insetX = Math.max(0, (100 - width) / 2)
    const insetY = Math.max(0, (100 - height) / 2)
    const radius = startRadius + (endRadius - startRadius) * eased

    frame.style.clipPath = `inset(${insetY}% ${insetX}% ${insetY}% ${insetX}% round ${radius}px)`
    media.style.transform = `scale(${mediaZoom + (1 - mediaZoom) * eased})`
    if (scrimRef.current) scrimRef.current.style.opacity = `${overlayScrim * eased}`

    if (titleRef.current) {
      const out = smoothstep(0.4, 0.88, progress)
      titleRef.current.style.opacity = `${1 - out}`
      titleRef.current.style.transform = `translate3d(0, ${-28 * out}px, 0) scale(${1 + 0.06 * out})`
    }
    if (hintRef.current) {
      const gone = smoothstep(0, 0.12, progress)
      hintRef.current.style.opacity = `${1 - gone}`
      hintRef.current.style.transform = `translate3d(0, ${8 * gone}px, 0)`
    }
    if (overlayRef.current) {
      const incoming = smoothstep(0.68, 1, progress)
      overlayRef.current.style.opacity = `${incoming}`
      overlayRef.current.style.transform = `translate3d(0, ${18 * (1 - incoming)}px, 0)`
    }
  }, [endRadius, mediaZoom, overlayScrim, startHeight, startRadius, startWidth])

  useEffect(() => {
    const root = rootRef.current
    const track = trackRef.current
    const stage = stageRef.current
    if (!root || !track || !stage) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let current = 0
    let target = 0
    let stageHeight = 0
    let running = false

    const measure = () => {
      stageHeight = useWindowScroll ? window.innerHeight : root.clientHeight
      if (stageHeight <= 0) return
      stage.style.height = `${stageHeight}px`
      track.style.height = `${stageHeight * (1 + Math.max(0, scrollDistance) + Math.max(0, holdDistance))}px`
      stage.style.setProperty('--se-title-size', `${clamp(root.clientWidth * 0.075, 20, 84)}px`)
    }

    const readProgress = () => {
      if (!enabled) return 1
      const span = stageHeight * Math.max(0.01, scrollDistance)
      if (useWindowScroll) return clamp(-track.getBoundingClientRect().top / span, 0, 1)
      return clamp(root.scrollTop / span, 0, 1)
    }

    const tick = () => {
      const factor = smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * smoothing))
      current += (target - current) * factor
      if (Math.abs(target - current) < 0.0004) {
        current = target
        running = false
      }
      applyProgress(current)
      frame = running ? requestAnimationFrame(tick) : 0
    }

    const onScroll = () => {
      target = readProgress()
      if (smoothing <= 0 || reduceMotion) {
        current = target
        applyProgress(current)
        return
      }
      if (!running) {
        running = true
        if (!frame) frame = requestAnimationFrame(tick)
      }
    }

    const onResize = () => {
      measure()
      target = readProgress()
      current = target
      applyProgress(current)
    }

    measure()
    target = readProgress()
    current = target
    applyProgress(current)

    const scroller = useWindowScroll ? window : root
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(root)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      resizeObserver.disconnect()
    }
  }, [applyProgress, enabled, holdDistance, scrollDistance, smoothing, useWindowScroll])

  const media = mediaType === 'video' ? (
    <video ref={mediaRef as React.RefObject<HTMLVideoElement>} className="scroll-expand__media" src={src} poster={poster} autoPlay muted loop playsInline />
  ) : (
    <img ref={mediaRef as React.RefObject<HTMLImageElement>} className="scroll-expand__media" src={src} alt={alt} draggable={false} />
  )

  return (
    <div ref={rootRef} className={`scroll-expand ${useWindowScroll ? '' : 'scroll-expand--scroller'} ${className}`.trim()} style={style}>
      <div ref={trackRef} className="scroll-expand__track">
        <div ref={stageRef} className="scroll-expand__stage">
          <div ref={frameRef} className="scroll-expand__frame">
            {media}
            <div ref={scrimRef} className="scroll-expand__scrim" />
            {children ? <div ref={overlayRef} className="scroll-expand__overlay">{children}</div> : null}
          </div>
          {title ? <div ref={titleRef} className="scroll-expand__title">{title}</div> : null}
          {scrollHint ? <div ref={hintRef} className="scroll-expand__hint">{scrollHint}</div> : null}
        </div>
      </div>
    </div>
  )
}
