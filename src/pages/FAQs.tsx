import { useState } from 'react'
import { Plus, HelpCircle } from 'lucide-react'

interface FAQ {
  question: string
  answer: string
}

const FAQS: FAQ[] = [
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

function FAQItem({ faq }: { faq: FAQ }) {
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

export default function FAQs() {
  return (
    <div className="civic-faq-page">
      <div className="form-page-header">
        <div className="form-page-icon">
          <HelpCircle size={32} />
        </div>
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about reporting issues, tracking progress, and participating in your community.</p>
      </div>

      <div className="civic-faq-list">
        {FAQS.map((faq, i) => (
          <FAQItem key={i} faq={faq} />
        ))}
      </div>

      <div className="civic-faq-contact">
        <p className="civic-faq-contact-text">
          Still have questions? Reach out to the platform team at{' '}
          <a href="mailto:contact@civicportal.gov.in">contact@civicportal.gov.in</a>
        </p>
      </div>
    </div>
  )
}
