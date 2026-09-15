import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { testimonials } from '../lib/civicContent'
import { useInView, useReducedMotion } from '../lib/hooks'

// TestimonialCarousel: auto-advancing carousel with manual controls.
// Respects reduced-motion (no autoplay), pauses on focus/hover,
// and provides accessible previous/next buttons.
export default function TestimonialCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 })
  const reduced = useReducedMotion()
  const timerRef = useRef<number>(0)

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % testimonials.length)
  }, [])

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + testimonials.length) % testimonials.length)
  }, [])

  useEffect(() => {
    if (paused || !inView || reduced) return
    timerRef.current = window.setTimeout(next, 6000)
    return () => clearTimeout(timerRef.current)
  }, [index, paused, inView, reduced, next])

  const t = testimonials[index]

  return (
    <section className="civic-testimonials" aria-label="Community voices">
      <div className="civic-section-inner">
        <div className="civic-section-header">
          <h2 className="civic-section-title">Community voices</h2>
          <p className="civic-section-subtitle">
            What residents are saying about civic progress.
          </p>
        </div>
        <div
          ref={ref}
          className="civic-carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <button className="civic-carousel-btn civic-carousel-prev" onClick={prev} aria-label="Previous testimonial">
            <ChevronLeft size={20} />
          </button>

          <div className="civic-carousel-slide" key={t.id} role="group" aria-label={`Testimonial ${index + 1} of ${testimonials.length}`}>
            <blockquote className="civic-carousel-quote">"{t.quote}"</blockquote>
            <div className="civic-carousel-author">
              <span className="civic-carousel-name">{t.name}</span>
              <span className="civic-carousel-role">{t.role}</span>
            </div>
          </div>

          <button className="civic-carousel-btn civic-carousel-next" onClick={next} aria-label="Next testimonial">
            <ChevronRight size={20} />
          </button>

          <div className="civic-carousel-controls">
            {!reduced && (
              <button
                className="civic-carousel-pause"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Play' : 'Pause'}
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            )}
            <div className="civic-carousel-dots">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  className={`civic-carousel-dot ${i === index ? 'active' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
