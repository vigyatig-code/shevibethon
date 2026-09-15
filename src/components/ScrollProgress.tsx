import { useScrollProgress } from '../lib/hooks'

// ScrollProgress: a thin fixed bar at the top of the viewport that
// fills as the user scrolls. The gradient transitions from emerald
// to amber as progress increases.
export default function ScrollProgress() {
  const progress = useScrollProgress()
  const pct = Math.round(progress * 100)

  return (
    <div className="scroll-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="scroll-progress-fill"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, #6f4e37 0%, #a96545 ${pct * 0.5}%, #c4976a ${pct}%)`,
        }}
      />
    </div>
  )
}
