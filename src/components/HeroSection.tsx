import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { heroVariations, activeHeroVariation, trustIndicators } from '../lib/civicContent'
import MaskedHeading from './MaskedHeading'
import WavyBackground from './WavyBackground'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const SUBTITLE_TEXT = 'NAZAR HATI TO DURGHATNA GHATI'

function AnimatedSubtitle() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const chars = el.querySelectorAll<HTMLSpanElement>('.nazar-subtitle-char')
    if (!chars.length) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      gsap.set(chars, { opacity: 1, y: 0 })
      return
    }

    gsap.set(chars, { opacity: 0, y: 12 })
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          gsap.to(chars, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.04,
            ease: 'power2.out',
            delay: 0.6,
          })
          io.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="nazar-subtitle" aria-label={SUBTITLE_TEXT}>
      {SUBTITLE_TEXT.split('').map((char, i) => (
        <span
          key={i}
          className="nazar-subtitle-char"
          style={{ display: char === ' ' ? 'inline-block' : 'inline-block', width: char === ' ' ? '0.3em' : 'auto' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  )
}

// HeroSection: full-viewport opening with a MaskedHeading headline
// that reveals a civic-problem photo through the letter shapes.
// Content appears immediately and stays readable. Includes headline,
// description, primary/secondary CTAs, trust indicators, and a scroll cue.
export default function HeroSection() {
  const copy = heroVariations[activeHeroVariation]

  return (
    <section className="civic-hero" aria-label="Introduction">
      <WavyBackground
        colors={['#a96545', '#c4976a', '#d4af37', '#8a6a4f', '#6f4e37']}
        backgroundFill="#f4ebdd"
        waveWidth={50}
        blur={10}
        speed="fast"
        waveOpacity={0.3}
        containerClassName="civic-hero-wavy"
      >
        {/* Decorative floating shapes */}
        <div className="civic-hero-shapes" aria-hidden="true">
          <span className="civic-shape civic-shape-circle-1" />
          <span className="civic-shape civic-shape-circle-2" />
          <span className="civic-shape civic-shape-ring-1" />
          <span className="civic-shape civic-shape-ring-2" />
          <span className="civic-shape civic-shape-blob-1" />
          <span className="civic-shape civic-shape-dots-1" />
          <span className="civic-shape civic-shape-grid-1" />
          <span className="civic-shape civic-shape-square-1" />
          <span className="civic-shape civic-shape-half-circle-1" />
        </div>
        <div className="civic-hero-content">
          <span className="civic-hero-eyebrow">{copy.eyebrow}</span>
          <MaskedHeading
            text={copy.headline}
            tag="h1"
            src="https://images.pexels.com/photos/32537514/pexels-photo-32537514.jpeg?auto=compress&cs=tinysrgb&w=1600"
            fillScale={1.35}
            parallax={30}
            drift={14}
            brightness={0.85}
            saturation={1.1}
            reveal="rise"
            trigger="view"
            duration={1.2}
            stagger={0.08}
            align="center"
            weight={700}
            tracking={-0.02}
            lineHeight={1.15}
            textScale={0.28}
            className="civic-hero-masked-heading"
          />
          <AnimatedSubtitle />
          <p className="civic-hero-description">{copy.description}</p>
          <div className="civic-hero-actions">
            <Link to="/file" className="civic-btn civic-btn-primary">
              {copy.primaryCta}
              <ArrowRight size={18} />
            </Link>
            <Link to="/complaints" className="civic-btn civic-btn-secondary">
              {copy.secondaryCta}
            </Link>
          </div>
          <p className="civic-hero-microcopy">{copy.microcopy}</p>
          <div className="civic-hero-trust">
            {trustIndicators.map((item) => (
              <span key={item} className="civic-trust-item">{item}</span>
            ))}
          </div>
        </div>

        <div className="civic-scroll-cue" aria-hidden="true">
          <span className="civic-scroll-cue-text">{copy.scrollCue}</span>
          <ChevronDown size={20} className="civic-scroll-cue-icon" />
        </div>
      </WavyBackground>
    </section>
  )
}
