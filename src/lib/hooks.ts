import { useEffect, useRef, useState } from 'react'

// Intersection Observer hook for scroll-triggered reveals.
// Returns a ref to attach and a boolean for whether it is visible.
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(entry.target)
        }
      },
      options ?? { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [options])

  return [ref, inView]
}

// Count-up animation hook — animates from 0 to target when active.
export function useCountUp(target: number, active: boolean, duration = 1500): number {
  const [value, setValue] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!active || startedRef.current) return
    startedRef.current = true

    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
      else setValue(target)
    }
    requestAnimationFrame(tick)
  }, [active, target, duration])

  return value
}

// Detects prefers-reduced-motion at mount and on changes.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced
}

// 3D cursor-following tilt effect for interactive cards.
// Returns mouse event handlers to spread onto any element.
// Pass the same ref the element uses so the hook can read its rect.
export function useTilt<T extends HTMLElement>(
  tiltRef: React.RefObject<T | null>,
  enabled: boolean = true
) {
  const onMouseMove = (e: React.MouseEvent<T>) => {
    if (!enabled) return
    const el = tiltRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    const maxTilt = 12
    el.style.transform = `perspective(800px) rotateX(${-py * maxTilt}deg) rotateY(${px * maxTilt}deg) translateY(-6px) scale(1.02)`
  }

  const onMouseLeave = () => {
    const el = tiltRef.current
    if (!el) return
    el.style.transform = ''
  }

  return { onMouseMove, onMouseLeave }
}

// Tracks scroll progress 0–1 for the scroll progress indicator.
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0)
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return progress
}
