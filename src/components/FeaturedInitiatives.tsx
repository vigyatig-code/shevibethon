import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { initiatives } from '../lib/civicContent'
import { useInView, useReducedMotion, useTilt } from '../lib/hooks'

// InitiativeCard: a rich featured initiative card with gradient
// thumbnail, status badge, progress bar, CTA link, and 3D tilt.
function InitiativeCard({ initiative, index }: { initiative: typeof initiatives[0]; index: number }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.2 })
  const tiltRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const tilt = useTilt(tiltRef, !reducedMotion)

  return (
    <div
      ref={(node) => {
        ref.current = node
        tiltRef.current = node
      }}
      className={`civic-initiative-card ${inView ? 'civic-reveal' : ''}`}
      style={{ transitionDelay: `${index * 0.12}s` }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <div className="civic-initiative-thumb" style={{ background: initiative.gradient }}>
        <div className="civic-initiative-thumb-overlay" />
      </div>
      <div className="civic-initiative-body">
        <div className="civic-initiative-top">
          <span className={`civic-initiative-status status-${initiative.status.toLowerCase().replace(/\s+/g, '-')}`}>
            {initiative.status}
          </span>
          <span className="civic-initiative-location">{initiative.location}</span>
        </div>
        <h3 className="civic-initiative-title">{initiative.title}</h3>
        <p className="civic-initiative-desc">{initiative.description}</p>
        <div className="civic-initiative-progress">
          <div className="civic-progress-track">
            <div className="civic-progress-fill" style={{ width: `${initiative.progress}%` }} />
          </div>
          <span className="civic-progress-label">{initiative.progress}% complete</span>
        </div>
        <Link to={initiative.link} className="civic-initiative-link">
          View initiative <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}

export default function FeaturedInitiatives() {
  return (
    <section className="civic-initiatives" aria-label="Featured initiatives">
      <div className="civic-section-inner">
        <div className="civic-section-header">
          <h2 className="civic-section-title">Featured initiatives</h2>
          <p className="civic-section-subtitle">
            Active projects delivering visible change in our communities.
          </p>
        </div>
        <div className="civic-initiative-grid">
          {initiatives.map((init, i) => (
            <InitiativeCard key={init.id} initiative={init} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
