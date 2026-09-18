import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

interface FAQ {
  question: string
  answer: string
}

const FAQS: FAQ[] = [
  {
    question: 'How do I report a civic issue?',
    answer:
      `Click "Report an Issue" (or "Take Action") in the navigation, fill in the form with the category, subject, and a description of the problem, and submit. You can optionally attach a photo and share your location to help authorities locate the issue faster. After submitting, you'll receive a tracking number you can use to follow your report.`,
  },
  {
    question: 'Can I track the status of my complaint?',
    answer:
      `Yes. Every report receives a unique tracking number (format CMP-XXXXXXXX). Go to the "Updates" page, enter your tracking number, and you'll see the current status — Pending, Under Review, Resolved, or Rejected — along with any updates and a timeline of progress.`,
  },
  {
    question: 'Is my report anonymous?',
    answer:
      'You can file a report without creating an account — anonymous filing is supported. However, providing your name and email helps authorities contact you if they need more details about the issue. Your contact information is only visible to the platform administrators and the assigned government body, not to the general public.',
  },
  {
    question: 'How is priority or urgency decided?',
    answer:
      'Each report is automatically assessed for severity based on the category and the words used in your description. Issues involving immediate danger, health hazards, or safety risks (like exposed electrical wiring, major road damage, or contaminated water) are flagged as Critical or High priority. Lower-impact issues are rated Medium or Low. This helps authorities triage the most urgent problems first.',
  },
  {
    question: 'Can I edit or delete a submitted report?',
    answer:
      'Once a report is submitted, it cannot be edited or deleted. This ensures a transparent, tamper-proof record of every complaint and its resolution. If you made an error or the issue has changed, you can file a new report with the corrected details, or contact the platform team with your tracking number for assistance.',
  },
  {
    question: 'How does voting work?',
    answer:
      `On the "Vote" page, you can browse open civic issues and add your support to the ones that affect you. Each issue shows a running vote count. Reports with more community votes surface higher in priority, signaling to authorities which problems matter most to residents. You can vote on multiple issues, and your support helps push the most widely-felt problems toward faster action.`,
  },
  {
    question: 'What types of issues can I report?',
    answer:
      'The platform covers a wide range of civic concerns: Roads & Infrastructure (potholes, broken pavements), Water & Drainage (leaks, overflow, supply issues), Waste & Sanitation (garbage collection, public toilet maintenance), Street Lighting (broken or missing lights), Public Safety (unsafe areas, missing signage), Parks & Green Spaces, Traffic & Transport, and Accessibility & Disability barriers.',
  },
  {
    question: 'How long does it take for a report to be resolved?',
    answer:
      'Resolution times vary depending on the category, severity, and the responsible government body. Critical and High-priority issues are typically addressed faster. You can check the status of your report at any time using your tracking number on the Updates page. The platform aims to keep the process transparent so you always know where things stand.',
  },
]

function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
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
          <FAQItem key={i} faq={faq} index={i} />
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
