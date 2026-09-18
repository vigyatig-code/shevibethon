import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, FileText, Search, ThumbsUp, CheckCircle2, Users, Building2, Leaf, ChevronDown } from 'lucide-react'
import { useInView } from '../lib/hooks'

interface AboutFAQ {
  question: string
  answer: string
}

const ABOUT_FAQS: AboutFAQ[] = [
  {
    question: 'How do I report a civic issue?',
    answer:
      'Click "Report an Issue" in the navigation, fill in the category, subject, and a description of the problem, and submit. You can optionally attach a photo and share your location to help authorities locate the issue faster. After submitting, you will receive a tracking number you can use to follow your report.',
  },
  {
    question: 'Can I track the status of my complaint?',
    answer:
      'Yes. Every report receives a unique tracking number (format CMP-XXXXXXXX). Go to the "Updates" page, enter your tracking number, and you will see the current status — Pending, Under Review, Resolved, or Rejected — along with any updates and a timeline of progress.',
  },
  {
    question: 'Is my report anonymous?',
    answer:
      'You can file a report without creating an account — anonymous filing is supported. However, providing your name and email helps authorities contact you if they need more details about the issue. Your contact information is only visible to the platform administrators and the assigned government body, not to the general public.',
  },
  {
    question: 'How is priority or urgency decided?',
    answer:
      'Each report is automatically assessed for severity based on the category and the words used in your description. Issues involving immediate danger, health hazards, or safety risks are flagged as Critical or High priority. Lower-impact issues are rated Medium or Low. This helps authorities triage the most urgent problems first.',
  },
  {
    question: 'Can I edit or delete a submitted report?',
    answer:
      'Once a report is submitted, it cannot be edited or deleted. This ensures a transparent, tamper-proof record of every complaint and its resolution. If you made an error or the issue has changed, you can file a new report with the corrected details, or contact the platform team with your tracking number for assistance.',
  },
  {
    question: 'How does voting work?',
    answer:
      'On the "Vote" page, you can browse open civic issues and add your support to the ones that affect you. Each issue shows a running vote count. Reports with more community votes surface higher in priority, signaling to authorities which problems matter most to residents.',
  },
]

function AboutFaqItem({ faq, index }: { faq: AboutFAQ; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`civic-faq-item ${open ? 'open' : ''}`}>
      <button
        className="civic-faq-question"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="civic-faq-q-num">{String(index + 1).padStart(2, '0')}</span>
        <span className="civic-faq-q-text">{faq.question}</span>
        <ChevronDown size={18} className={`civic-faq-chevron ${open ? 'rotated' : ''}`} />
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
      <div className="form-page-header">
        <div className="form-page-icon">
          <Info size={32} />
        </div>
        <h1>About Civic Portal</h1>
        <p>A platform that turns everyday civic concerns into visible, trackable progress.</p>
      </div>

      <section className="civic-about-mission">
        <div className="civic-about-mission-inner">
          <span className="civic-about-eyebrow">Our mission</span>
          <h2 className="civic-about-mission-title">
            Every resident deserves a voice in how their neighborhood is maintained and improved.
          </h2>
          <p className="civic-about-mission-text">
            Civic Portal is a community-driven platform that helps citizens report local civic issues —
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
          <div className="civic-about-faq-list">
            {ABOUT_FAQS.map((faq, i) => (
              <AboutFaqItem key={i} faq={faq} index={i} />
            ))}
          </div>
          <div className="civic-about-faq-more">
            <Link to="/faqs" className="civic-btn civic-btn-secondary">View all FAQs</Link>
          </div>
        </div>
      </section>

      <section className="civic-about-cta">
        <div className="civic-about-cta-inner">
          <h2 className="civic-about-cta-title">See something that needs fixing?</h2>
          <p className="civic-about-cta-text">Report it in under two minutes and track it to resolution.</p>
          <div className="civic-about-cta-actions">
            <Link to="/file" className="civic-btn civic-btn-primary">Report an Issue</Link>
            <Link to="/faqs" className="civic-btn civic-btn-secondary">Read FAQs</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
