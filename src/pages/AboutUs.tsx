import { useState } from 'react'
import { Info, FileText, Search, ThumbsUp, CheckCircle2, Users, Building2, Leaf, Plus } from 'lucide-react'
import { useInView } from '../lib/hooks'
import Aurora from '../components/Aurora'
import Shuffle from '../components/Shuffle'

interface FAQ {
  question: string
  answer: string
}

const ABOUT_FAQS: FAQ[] = [
  {
    question: 'What makes Nazar different from just complaining on social media?',
    answer:
      'Every report here becomes a permanent, trackable record — not a tweet that gets lost. Once submitted, it can\u2019t be edited or deleted by anyone, so it stays an honest paper trail that authorities and the public can hold accountable over time.',
  },
  {
    question: 'How do I actually report something, and what happens after?',
    answer:
      'Hit \u201CReport an Issue,\u201D pick a category, describe the problem, and drop a photo if you\u2019ve got one. It\u2019s locked in permanently and gets a tracking ID (like CMP-ABCD1234) so you can follow its journey from Pending to Resolved.',
  },
  {
    question: 'Can I see problems near me before I even report mine?',
    answer:
      'Yes — our Map lets you explore active complaints across India visually, either as pins you can click for case details or as a state-by-state heatmap showing where problems are most concentrated. See the pattern before you add to it.',
  },
  {
    question: 'I have a disability — does this site actually work for me, or is \u201Caccessibility\u201D just a checkbox here?',
    answer:
      'It\u2019s built in, not bolted on. Choose your disability type — visual, hearing, mobility, or cognitive — and the site adapts: voice commands, automatic audio descriptions, and full Hindi support included. You can even speak your disability type aloud instead of clicking.',
  },
  {
    question: 'How do I know the numbers on this site aren\u2019t made up?',
    answer:
      'Our Public Insights Dashboard shows everything live — total complaints, resolution rates, category breakdowns — pulled straight from real submitted reports, not curated PR stats.',
  },
  {
    question: 'What\u2019s Ask Mitra, and is it just a chatbot that dodges my questions?',
    answer:
      'Ask Mitra is our AI assistant built specifically to help you use this site — filing reports, understanding statuses, finding the right category — not a generic bot reciting canned answers.',
  },
  {
    question: 'Why does voting happen on a blockchain instead of a normal poll?',
    answer:
      'Because a normal poll can be quietly edited. Blockchain voting means your vote — and everyone else\u2019s — is locked in and verifiable, so no one, including us, can alter the results after the fact.',
  },
  {
    question: 'Is the civic news real-time, or just old headlines dressed up?',
    answer:
      'It\u2019s live, continuously refreshed from real Indian news sources — categorized by Roads, Water, Sanitation, Electricity, and Disasters — so you\u2019re seeing what\u2019s actually unfolding, not a static news archive.',
  },
]

function AboutFaqItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`civic-faq-item ${open ? 'open' : ''}`}>
      <button
        className="civic-faq-question"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="civic-faq-q-text">{faq.question}</span>
        <span className={`civic-faq-plus ${open ? 'rotated' : ''}`}>
          <Plus size={22} />
        </span>
      </button>
      <div className={`civic-faq-answer ${open ? 'open' : ''}`}>
        <p className="civic-faq-answer-text">{faq.answer}</p>
      </div>
    </div>
  )
}

function HowItWorksStep({
  icon: Icon,
  step,
  title,
  description,
}: {
  icon: typeof FileText
  step: number
  title: string
  description: string
}) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.15 })
  return (
    <div ref={ref} className={`civic-about-step ${inView ? 'civic-reveal' : ''}`} style={{ transitionDelay: `${step * 0.1}s` }}>
      <div className="civic-about-step-num">{step}</div>
      <div className="civic-about-step-icon">
        <Icon size={24} />
      </div>
      <h3 className="civic-about-step-title">{title}</h3>
      <p className="civic-about-step-desc">{description}</p>
    </div>
  )
}

export default function AboutUs() {
  return (
    <div className="civic-about-page">
      <div className="aurora-bg-wrap" aria-hidden="true">
        <Aurora
          colorStops={['#7cff67', '#B497CF', '#5227FF']}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>
      <div className="form-page-header">
        <div className="form-page-icon">
          <Info size={32} />
        </div>
        <Shuffle
          text="About Nazar"
          tag="h1"
          className="civic-about-shuffle-heading"
          shuffleDirection="right"
          duration={0.4}
          animationMode="evenodd"
          stagger={0.04}
          shuffleTimes={2}
          ease="power3.out"
          triggerOnHover={true}
        />
        <p>A platform that turns everyday civic concerns into visible, trackable progress.</p>
      </div>

      <section className="civic-about-mission">
        <div className="civic-about-mission-inner">
          <span className="civic-about-eyebrow">Our mission</span>
          <h2 className="civic-about-mission-title">
            Every resident deserves a voice in how their neighborhood is maintained and improved.
          </h2>
          <p className="civic-about-mission-text">
            Nazar is a community-driven platform that helps citizens report local civic issues —
            potholed roads, water supply problems, sanitation and waste collection gaps, faulty street lighting,
            drainage overflows, and more — and follow them through to resolution. We believe that when people can
            easily report what needs fixing, and when the process is transparent for everyone, public services
            become more responsive and accountable.
          </p>
          <p className="civic-about-mission-text">
            Instead of complaints disappearing into a black box, every report gets a tracking number, a visible
            status, and a priority level — so you always know where things stand. Community members can add their
            support to issues that affect them, helping the most urgent problems rise to the top.
          </p>
        </div>
      </section>

      <section className="civic-about-how">
        <div className="civic-section-inner">
          <div className="civic-section-header">
            <h2 className="civic-section-title">How it works</h2>
            <p className="civic-section-subtitle">
              From spotting a problem to seeing it fixed — four simple steps.
            </p>
          </div>
          <div className="civic-about-steps-grid">
            <HowItWorksStep
              icon={FileText}
              step={1}
              title="Report an issue"
              description="Share what needs attention — a pothole, a broken streetlight, a water leak, overflowing drains, or waste piling up. Add a photo and location so it's easy to find and verify."
            />
            <HowItWorksStep
              icon={Search}
              step={2}
              title="Track progress"
              description="Every report gets a tracking number. Use it to follow the status as it moves from Pending to Under Review to Resolved — with updates visible at every stage."
            />
            <HowItWorksStep
              icon={ThumbsUp}
              step={3}
              title="Community support"
              description="Neighbors can vote on issues that affect them too. Reports with more community backing surface higher, helping the most urgent problems get attention first."
            />
            <HowItWorksStep
              icon={CheckCircle2}
              step={4}
              title="Resolution"
              description="Local authorities address the issue and mark it resolved. The outcome is public — so everyone can see what was fixed and how the process worked."
            />
          </div>
        </div>
      </section>

      <section className="civic-about-who">
        <div className="civic-section-inner">
          <div className="civic-section-header">
            <h2 className="civic-section-title">Who it's for</h2>
            <p className="civic-section-subtitle">Built for the people who live here and the people who serve them.</p>
          </div>
          <div className="civic-about-who-grid">
            <div className="civic-about-who-card">
              <div className="civic-about-who-icon">
                <Users size={28} />
              </div>
              <h3 className="civic-about-who-title">Residents &amp; Citizens</h3>
              <p className="civic-about-who-text">
                Anyone who sees a civic problem in their neighborhood — a dangerous pothole on your daily route,
                a streetlight that's been dark for weeks, waterlogging that won't drain. You don't need to know
                which department handles it; just report it and the platform routes it appropriately.
              </p>
            </div>
            <div className="civic-about-who-card">
              <div className="civic-about-who-icon">
                <Building2 size={28} />
              </div>
              <h3 className="civic-about-who-title">Local Government Bodies</h3>
              <p className="civic-about-who-text">
                Municipal corporations, public works departments, and civic agencies get a clear, prioritized
                view of what needs attention. Instead of scattered phone calls and informal complaints,
                they receive structured reports with photos, locations, and community urgency signals —
                making it easier to plan and act.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="civic-about-values">
        <div className="civic-section-inner">
          <div className="civic-about-values-grid">
            <div className="civic-about-value">
              <Leaf size={22} />
              <span>Transparency at every step</span>
            </div>
            <div className="civic-about-value">
              <Users size={22} />
              <span>Community voices drive priorities</span>
            </div>
            <div className="civic-about-value">
              <CheckCircle2 size={22} />
              <span>Visible outcomes, not black boxes</span>
            </div>
          </div>
        </div>
      </section>

      <section className="civic-about-faqs">
        <div className="civic-section-inner">
          <div className="civic-section-header">
            <h2 className="civic-section-title">Frequently asked questions</h2>
            <p className="civic-section-subtitle">Quick answers to common questions about how the portal works.</p>
          </div>
          <div className="civic-faq-list">
            {ABOUT_FAQS.map((faq, i) => (
              <AboutFaqItem key={i} faq={faq} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
