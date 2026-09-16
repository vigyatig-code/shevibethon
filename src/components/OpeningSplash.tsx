import { useEffect, useState, useRef, useCallback } from 'react'

const CIVIC_ISSUE_IMAGES = [
  {
    src: 'https://images.pexels.com/photos/20518249/pexels-photo-20518249.jpeg?auto=compress&cs=tinysrgb&w=1200',
    label: 'Potholes',
  },
  {
    src: 'https://images.pexels.com/photos/28447789/pexels-photo-28447789.jpeg?auto=compress&cs=tinysrgb&w=1200',
    label: 'Sewage Overflow',
  },
  {
    src: 'https://images.pexels.com/photos/34158878/pexels-photo-34158878.jpeg?auto=compress&cs=tinysrgb&w=1200',
    label: 'Water Leakage',
  },
  {
    src: 'https://images.pexels.com/photos/34610704/pexels-photo-34610704.jpeg?auto=compress&cs=tinysrgb&w=1200',
    label: 'Power Cuts',
  },
  {
    src: 'https://images.pexels.com/photos/11502452/pexels-photo-11502452.jpeg?auto=compress&cs=tinysrgb&w=1200',
    label: 'Parking Issues',
  },
  {
    src: 'https://images.pexels.com/photos/2382894/pexels-photo-2382894.jpeg?auto=compress&cs=tinysrgb&w=1200',
    label: 'Garbage Piles',
  },
  {
    src: 'https://images.pexels.com/photos/26202091/pexels-photo-26202091.jpeg?auto=compress&cs=tinysrgb&w=1200',
    label: 'Waterlogging',
  },
  {
    src: 'https://images.pexels.com/photos/9953451/pexels-photo-9953451.jpeg?auto=compress&cs=tinysrgb&w=1200',
    label: 'Broken Street Lights',
  },
  {
    src: 'https://images.pexels.com/photos/12326415/pexels-photo-12326415.jpeg?auto=compress&cs=tinysrgb&w=1200',
    label: 'Cracked Infrastructure',
  },
  {
    src: 'https://images.pexels.com/photos/11849379/pexels-photo-11849379.jpeg?auto=compress&cs=tinysrgb&w=1200',
    label: 'Broken Roads',
  },
  {
    src: 'https://images.pexels.com/photos/15954727/pexels-photo-15954727.jpeg?auto=compress&cs=tinysrgb&w=1200',
    label: 'Drainage Problems',
  },
]

const FLASH_DURATION = 900
const FINALE_HOLD = 4200

export default function OpeningSplash({ onComplete }: { onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<'flashing' | 'finale' | 'exiting'>('flashing')
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const startedRef = useRef(false)

  const addTimer = (fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay)
    timersRef.current.push(t)
  }

  const cleanup = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
  }, [])

  const startExit = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    setPhase('exiting')
    addTimer(() => {
      cleanup()
      onComplete()
    }, 700)
  }, [cleanup, onComplete])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      onComplete()
      return
    }

    CIVIC_ISSUE_IMAGES.forEach((_, i) => {
      if (i === 0) return
      addTimer(() => setCurrentIndex(i), i * FLASH_DURATION)
    })

    const flashTotalTime = CIVIC_ISSUE_IMAGES.length * FLASH_DURATION + 100
    addTimer(() => setPhase('finale'), flashTotalTime)

    const exitTime = flashTotalTime + FINALE_HOLD
    addTimer(startExit, exitTime)

    addTimer(startExit, exitTime + 3000)

    return cleanup
  }, [cleanup, startExit, onComplete])

  return (
    <div
      className={`civic-opening-splash phase-${phase}`}
      aria-hidden="true"
    >
      {phase === 'flashing' && (
        <div className="civic-opening-splash-images">
          {CIVIC_ISSUE_IMAGES.map((img, i) => (
            <img
              key={i}
              src={img.src}
              alt=""
              className={i === currentIndex ? 'active' : ''}
              style={{ display: i <= currentIndex ? 'block' : 'none' }}
              loading="eager"
            />
          ))}
        </div>
      )}
      {phase === 'flashing' && (
        <div className="civic-opening-splash-label">
          <span
            key={currentIndex}
            className="civic-opening-splash-label-text"
          >
            {CIVIC_ISSUE_IMAGES[currentIndex]?.label}
          </span>
        </div>
      )}
      {(phase === 'finale' || phase === 'exiting') && (
        <div className="civic-opening-splash-finale">
          <div className="civic-opening-splash-finale-glow" />
          <div className="civic-opening-splash-finale-content">
            <span className="civic-opening-splash-finale-kicker">You see it all.</span>
            <h2 className="civic-opening-splash-finale-title">WE GOT YOU!!</h2>
            <span className="civic-opening-splash-finale-sub">Report. Track. Resolve.</span>
          </div>
        </div>
      )}
      <div className="civic-opening-splash-skip">
        <button onClick={startExit} tabIndex={-1}>Skip</button>
      </div>
    </div>
  )
}
