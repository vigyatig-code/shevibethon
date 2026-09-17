import { useState, useRef, useEffect, useCallback } from 'react'

interface SparkleParticle {
  id: number
  dx: number
  dy: number
  rotate: number
}

interface StickyNoteModalProps {
  open: boolean
  onClose: () => void
  triggerRef?: React.RefObject<HTMLAnchorElement | HTMLButtonElement | null>
}

export default function StickyNoteModal({ open, onClose, triggerRef }: StickyNoteModalProps) {
  const [noteTilt, setNoteTilt] = useState(0)
  const [tapeTilt, setTapeTilt] = useState(0)
  const [closing, setClosing] = useState(false)
  const [sparkles, setSparkles] = useState<SparkleParticle[]>([])
  const [squish, setSquish] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const noteRef = useRef<HTMLDivElement>(null)
  const sparkleIdRef = useRef(0)

  const randomizeTilt = useCallback(() => {
    setNoteTilt(Math.random() * 8 - 6)
    setTapeTilt(Math.random() * 10 - 5)
  }, [])

  useEffect(() => {
    if (open) {
      randomizeTilt()
      setClosing(false)
      setSubmitted(false)
      setSparkles([])
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 350)
    }
  }, [open, randomizeTilt])

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      onClose()
      setClosing(false)
      triggerRef?.current?.focus()
    }, 300)
  }, [onClose, triggerRef])

  // Focus trap
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
        return
      }
      if (e.key === 'Tab' && noteRef.current) {
        const focusable = noteRef.current.querySelectorAll<HTMLElement>(
          'button, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleClose])

  const handleSubmit = useCallback(() => {
    setSquish(true)
    setTimeout(() => setSquish(false), 200)

    const particles: SparkleParticle[] = []
    const angles = [0, 60, 120, 180, 240, 300]
    for (let i = 0; i < 6; i++) {
      const rad = (angles[i] * Math.PI) / 180
      particles.push({
        id: sparkleIdRef.current++,
        dx: Math.cos(rad) * 60,
        dy: Math.sin(rad) * 60,
        rotate: Math.random() * 360,
      })
    }
    setSparkles(particles)
    setSubmitted(true)

    setTimeout(() => {
      handleClose()
    }, 750)
  }, [handleClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!open && !closing) return null

  return (
    <div
      className={`sticky-note-backdrop ${closing ? 'closing' : ''}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sticky-note-heading"
    >
      <div
        ref={noteRef}
        className={`sticky-note ${closing ? 'sticky-note-closing' : 'sticky-note-open'}`}
        style={{ '--note-tilt': `${noteTilt}deg`, '--tape-tilt': `${tapeTilt}deg` } as React.CSSProperties}
      >
        {/* Tape strip */}
        <div className="sticky-note-tape" aria-hidden="true" />

        {/* Close button */}
        <button
          className="sticky-note-close"
          onClick={handleClose}
          aria-label="Close"
          tabIndex={0}
        >
          ✕
        </button>

        {/* Heading */}
        <h3 id="sticky-note-heading" className="sticky-note-heading">
          Got an idea?
        </h3>

        {/* Lined textarea */}
        <textarea
          ref={textareaRef}
          className="sticky-note-textarea"
          placeholder="Tell us what's on your mind..."
          rows={5}
          aria-label="Your suggestion"
        />

        {/* Pencil decoration */}
        <span className="sticky-note-pencil" aria-hidden="true">✏️</span>

        {/* Curled corner */}
        <div className="sticky-note-curl" aria-hidden="true" />

        {/* Pin submit button */}
        <button
          className={`sticky-note-pin ${squish ? 'squish' : ''} ${submitted ? 'submitted' : ''}`}
          onClick={handleSubmit}
          aria-label="Pin your idea"
          tabIndex={0}
        >
          📌
          {sparkles.length > 0 && (
            <span className="sticky-note-sparkle-burst" aria-hidden="true">
              {sparkles.map((s) => (
                <span
                  key={s.id}
                  className="sticky-note-sparkle"
                  style={{
                    '--sx': `${s.dx}px`,
                    '--sy': `${s.dy}px`,
                    '--sr': `${s.rotate}deg`,
                  } as React.CSSProperties}
                >
                  ✨
                </span>
              ))}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
