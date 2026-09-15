import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { participationContent } from '../lib/civicContent'
import { useInView } from '../lib/hooks'

// ParticipationCTA: a visually strong section with amber-to-emerald
// gradient glow. Includes three action buttons for civic participation.
export default function ParticipationCTA() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.2 })

  return (
    <section className="civic-participation" aria-label="Call to participate">
      <div className="civic-participation-glow" aria-hidden="true" />
      <div
        ref={ref}
        className={`civic-participation-inner ${inView ? 'civic-reveal' : ''}`}
      >
        <h2 className="civic-participation-heading">{participationContent.heading}</h2>
        <p className="civic-participation-desc">{participationContent.description}</p>
        <div className="civic-participation-actions">
          {participationContent.buttons.map((btn) => (
            <Link key={btn.label} to={btn.link} className="civic-btn civic-btn-primary">
              {btn.label}
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
