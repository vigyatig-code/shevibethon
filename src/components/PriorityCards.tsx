import { Sprout, Shield, Building2, Users, ArrowRight } from 'lucide-react'
import { priorityCards } from '../lib/civicContent'
import { useInView } from '../lib/hooks'
import ParticleText from './ParticleText'
import TiltedCard from './TiltedCard'
import GradientWaves from './GradientWaves'

const iconMap: Record<string, typeof Sprout> = {
  sprout: Sprout,
  shield: Shield,
  building: Building2,
  users: Users,
}

const waveConfigs = [
  { horizonColor: '#6f4e37', waveColor: '#a96545', crestColor: '#c4976a', speed: 0.15 },
  { horizonColor: '#7a5a3e', waveColor: '#8a6a4f', crestColor: '#d4c4a8', speed: 0.12 },
  { horizonColor: '#5a3e2a', waveColor: '#a96545', crestColor: '#e7d6be', speed: 0.18 },
  { horizonColor: '#8a6a4f', waveColor: '#c4976a', crestColor: '#f9f4ec', speed: 0.14 },
]

function PriorityCardItem({ card, index }: { card: typeof priorityCards[0]; index: number }) {
  const [ref, inView] = useInView<HTMLAnchorElement>({ threshold: 0.2 })
  const Icon = iconMap[card.icon] ?? Sprout
  const wave = waveConfigs[index % waveConfigs.length]

  return (
    <a
      href={card.externalLink}
      target="_blank"
      rel="noopener noreferrer"
      ref={ref}
      className={`civic-priority-card ${inView ? 'civic-reveal' : ''}`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <TiltedCard
        containerHeight="220px"
        containerWidth="100%"
        imageWidth="100%"
        imageHeight="220px"
        rotateAmplitude={12}
        scaleOnHover={1.15}
        showMobileWarning={false}
        showTooltip={false}
      >
        <div className="civic-priority-content">
          <div className="civic-priority-waves">
            <GradientWaves
              horizonColor={wave.horizonColor}
              waveColor={wave.waveColor}
              crestColor={wave.crestColor}
              speed={wave.speed}
              amplitude={2}
              waveScale={0.5}
              swell={30}
              turbulence={15}
              tilt={1.11}
              zoom={1}
              height={5.5}
              fogDepth={12}
              detail="low"
              brightness={0.85}
              opacity={0.35}
              mouseInteraction={false}
              parallaxStrength={0}
              grain={false}
            />
          </div>
          <div className="civic-priority-icon">
            <Icon size={28} />
          </div>
          <h3 className="civic-priority-title">{card.title}</h3>
          <p className="civic-priority-desc">{card.description}</p>
          <span className="civic-priority-link">
            Learn more <ArrowRight size={14} />
          </span>
        </div>
      </TiltedCard>
    </a>
  )
}

export default function PriorityCards() {
  return (
    <section className="civic-priority" aria-label="What is changing">
      <div className="civic-section-inner">
        <div className="civic-section-header">
          <ParticleText
            text="WHAT IS CHANGING"
            particleSize={2}
            density={4}
            color="#3a2a1a"
            highlightColor="#1a1208"
            scatter={180}
            gatherDuration={3200}
            stagger={800}
            pointerRepel={40}
            repelRadius={120}
            idleDrift={0.4}
            trigger="mount"
            fontSize="clamp(2rem, 6vw, 4rem)"
            fontWeight={800}
            fontFamily="inherit"
            glow
            style={{ height: 200, marginBottom: 8 }}
          />
          <p className="civic-section-subtitle">
            Priority areas shaped by resident feedback and civic goals.
          </p>
        </div>
        <div className="civic-priority-grid">
          {priorityCards.map((card, i) => (
            <PriorityCardItem key={card.id} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
