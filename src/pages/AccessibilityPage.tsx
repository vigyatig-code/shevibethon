import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Accessibility, CheckCircle2, AlertCircle, Loader2, Lock, Camera, X, Heart, Eye, Ear, Brain, Footprints, Volume2, VolumeX } from 'lucide-react'
import { supabase, generateTrackingNumber, assessSeverity, uploadComplaintPhoto, type ComplaintInput } from '../lib/supabase'
import TrueFocus from '../components/TrueFocus'
import BubbleMenu from '../components/BubbleMenu'
import BorderGlow from '../components/BorderGlow'

const DISABILITY_CATEGORIES = [
  { icon: Eye, label: 'Visual Impairment', value: 'Visual Impairment' },
  { icon: Ear, label: 'Hearing Impairment', value: 'Hearing Impairment' },
  { icon: Footprints, label: 'Mobility / Wheelchair', value: 'Mobility / Wheelchair' },
  { icon: Brain, label: 'Cognitive / Developmental', value: 'Cognitive / Developmental' },
  { icon: Heart, label: 'Multiple Disabilities', value: 'Multiple Disabilities' },
] as const

const NEUTRAL_BUBBLE_BG = '#c9a87a'
const NEUTRAL_BUBBLE_HOVER = '#b8965f'
const NEUTRAL_BUBBLE_TEXT = '#3e2a1c'
const NEUTRAL_BUBBLE_HOVER_TEXT = '#2a1c12'

const DISABILITY_ISSUES: Record<string, string[]> = {
  'Visual Impairment': [
    'Missing Braille signage',
    'Website or app not screen-reader compatible',
    'Broken or blocked tactile paving',
    'No audio announcements at public transit',
    'No large-print or high-contrast signage',
    'Inaccessible pedestrian crossings (no audible signal)',
  ],
  'Hearing Impairment': [
    'No sign language interpreter available',
    'Videos without captions or subtitles',
    'No visual emergency alerts in public buildings',
    'No hearing-loop or assistive listening system',
    'Staff untrained in basic sign language',
    'No text-based communication alternatives',
  ],
  'Mobility / Wheelchair': [
    'No wheelchair ramp at public building',
    'Steep steps without handrail at public entrance',
    'Narrow doorways blocking wheelchair access',
    'Broken or missing elevator in multi-floor building',
    'No accessible parking near building entrance',
    'No disabled-friendly restroom',
    'Inaccessible public transport',
    'No dropped kerbs on pavements',
  ],
  'Cognitive / Developmental': [
    'Complex or confusing signage in public spaces',
    'No quiet or sensory-friendly spaces available',
    'Lack of clear wayfinding or visual maps',
    'Overwhelming sensory environment (lighting, noise)',
    'No easy-read materials or simplified forms',
    'Staff untrained in supporting cognitive disabilities',
  ],
  'Multiple Disabilities': [
    'No wheelchair ramp at public building',
    'No sign language interpreter available',
    'Missing Braille signage',
    'No disabled-friendly restroom',
    'Broken or missing elevator in multi-floor building',
    'Inaccessible public transport',
    'Discrimination or denial of service',
    'No accessible parking near building entrance',
  ],
}

const DEFAULT_ACCESSIBILITY_ISSUES = [
  'No wheelchair ramp at public building',
  'Broken or blocked tactile paving',
  'No sign language interpreter available',
  'Inaccessible public transport',
  'Missing Braille signage',
  'No disabled-friendly restroom',
  'Website or app not screen-reader compatible',
  'Discrimination or denial of service',
  'No accessible parking near building entrance',
  'Steep steps without handrail at public entrance',
  'Narrow doorways blocking wheelchair access',
  'Broken or missing elevator in multi-floor building',
]

export default function AccessibilityPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<ComplaintInput>({
    name: '',
    email: '',
    category: 'Accessibility & Disability',
    subject: '',
    description: '',
  })
  const [disabilityType, setDisabilityType] = useState<string>('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ trackingNumber: string } | null>(null)
  const [audioGuideOn, setAudioGuideOn] = useState(false)
  const [audioStep, setAudioStep] = useState(0)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

  const AUDIO_STEPS = [
    'Welcome to the Accessibility and Disability Support page. This audio guide will walk you through each step of submitting a report.',
    'Step 1. Select your disability type. Tap one of the cards below. For example, Visual Impairment, Hearing Impairment, Mobility, Cognitive, or Multiple Disabilities. This is optional but helps us categorize your report.',
    'Step 2. Choose a common issue. When you select a disability type, a bubble menu will appear with common issues. Tap a bubble to select the issue that best matches your situation. This will fill in the subject field for you.',
    'Step 3. Enter your full name and email address in the contact section. These are required so we can follow up with you about your report.',
    'Step 4. Review the subject field. If you selected an issue from the bubbles, it is already filled in. You can also type your own subject if you prefer.',
    'Step 5. Write a detailed description of the accessibility barrier or issue you experienced. The more detail you provide, the better we can help.',
    'Step 6. Optionally, add a photo. Tap the upload area to select an image from your device. This helps us see the problem directly.',
    'Step 7. When you are ready, tap the Submit Report button at the bottom. Your report will be submitted with high priority and you will receive a tracking number to check its status later.',
  ]

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1
    speechRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    speechRef.current = null
  }, [])

  const playStep = useCallback((step: number) => {
    if (step < 0 || step >= AUDIO_STEPS.length) return
    setAudioStep(step)
    speak(AUDIO_STEPS[step])
  }, [speak, AUDIO_STEPS])

  const toggleAudioGuide = () => {
    if (audioGuideOn) {
      stopSpeaking()
      setAudioGuideOn(false)
    } else {
      setAudioGuideOn(true)
      playStep(0)
    }
  }

  const nextStep = () => {
    if (audioStep < AUDIO_STEPS.length - 1) playStep(audioStep + 1)
  }

  const prevStep = () => {
    if (audioStep > 0) playStep(audioStep - 1)
  }

  useEffect(() => {
    return () => stopSpeaking()
  }, [stopSpeaking])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleQuickSelect = (issue: string) => {
    setForm({ ...form, subject: issue })
  }

  const currentIssues = disabilityType
    ? DISABILITY_ISSUES[disabilityType] ?? DEFAULT_ACCESSIBILITY_ISSUES
    : DEFAULT_ACCESSIBILITY_ISSUES

  const bubbleItems = currentIssues.map((issue, i) => ({
    label: issue,
    ariaLabel: issue,
    rotation: i % 2 === 0 ? -6 : 6,
    hoverStyles: { bgColor: NEUTRAL_BUBBLE_HOVER, textColor: NEUTRAL_BUBBLE_HOVER_TEXT },
    onClick: () => handleQuickSelect(issue),
  }))

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5 MB.')
      return
    }
    setError(null)
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const removePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const trackingNumber = generateTrackingNumber()
      const severity = assessSeverity(form.category, form.subject, form.description)

      let photoUrl: string | null = null
      if (photo) {
        photoUrl = await uploadComplaintPhoto(photo)
      }

      const fullDescription = disabilityType
        ? `[Disability type: ${disabilityType}] ${form.description}`
        : form.description

      const { error: insertError } = await supabase
        .from('complaints')
        .insert({
          ...form,
          description: fullDescription,
          tracking_number: trackingNumber,
          status: 'Pending',
          priority: 'High',
          severity: severity,
          photo_url: photoUrl,
        })

      if (insertError) throw insertError

      setSuccess({ trackingNumber })
      setSubmitting(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="page-container">
        <div className="success-card">
          <div className="success-icon">
            <CheckCircle2 size={64} />
          </div>
          <h2>Report Submitted Successfully</h2>
          <p>Your accessibility concern has been registered with high priority and is now under review.</p>
          <div className="tracking-display">
            <span className="tracking-label">Your Tracking Number</span>
            <span className="tracking-number">{success.trackingNumber}</span>
          </div>
          <p className="tracking-hint">Save this tracking number to check your complaint status later.</p>
          <div className="success-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/track/${success.trackingNumber}`)}
            >
              View Status
            </button>
            <Link to="/accessibility" className="btn btn-outline" onClick={() => setSuccess(null)}>
              Submit Another
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container accessibility-page">
      <div className="form-page-header">
        <div className="form-page-icon accessibility-icon">
          <Accessibility size={32} />
        </div>
        <h1>Accessibility & Disability Support</h1>
        <div className="form-page-tagline">
          <TrueFocus
            sentence="Every voice deserves to be heard"
            borderColor="#a96545"
            glowColor="rgba(169, 101, 69, 0.6)"
            blurAmount={3}
            animationDuration={0.8}
            pauseBetweenAnimations={0.8}
          />
        </div>
        <p>A dedicated space for persons with disabilities and their advocates to report barriers, discrimination, or accessibility issues.</p>
      </div>

      <div className="info-banner accessibility-banner">
        <Lock size={18} />
        <span>Reports are automatically flagged as high priority. Once submitted, your report is permanent and cannot be altered by anyone.</span>
      </div>

      <div className="accessibility-disability-types">
        <h3 className="accessibility-section-title">Select disability type (optional)</h3>
        <div className="accessibility-type-grid">
          {DISABILITY_CATEGORIES.map(({ icon: Icon, label, value }) => (
            <BorderGlow
              key={value}
              borderRadius={14}
              glowRadius={28}
              glowIntensity={1.2}
              edgeSensitivity={25}
              coneSpread={28}
              glowColor="28 70 55"
              backgroundColor="rgba(26, 18, 8, 0.55)"
              colors={['#c4976a', '#a96545', '#d4af37']}
              fillOpacity={0.35}
              className={`accessibility-type-glow ${disabilityType === value ? 'selected' : ''}`}
            >
              <button
                type="button"
                className={`accessibility-type-card ${disabilityType === value ? 'selected' : ''}`}
                onClick={() => setDisabilityType(disabilityType === value ? '' : value)}
              >
                <Icon size={22} />
                <span>{label}</span>
              </button>
            </BorderGlow>
          ))}
        </div>
      </div>

      {disabilityType === 'Visual Impairment' && (
        <div className="accessibility-audio-guide">
          <div className="accessibility-audio-header">
            <div className="accessibility-audio-title-wrap">
              <Volume2 size={20} />
              <span className="accessibility-audio-title">Audio Guide for Visually Impaired</span>
            </div>
            <button
              type="button"
              className={`accessibility-audio-toggle ${audioGuideOn ? 'on' : ''}`}
              onClick={toggleAudioGuide}
              aria-label={audioGuideOn ? 'Turn off audio guide' : 'Turn on audio guide'}
            >
              {audioGuideOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <span>{audioGuideOn ? 'On' : 'Off'}</span>
            </button>
          </div>
          {audioGuideOn && (
            <div className="accessibility-audio-controls">
              <div className="accessibility-audio-progress">
                <span className="accessibility-audio-step-label">
                  Step {audioStep + 1} of {AUDIO_STEPS.length}
                </span>
                <div className="accessibility-audio-dots">
                  {AUDIO_STEPS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`accessibility-audio-dot ${i === audioStep ? 'active' : ''} ${i < audioStep ? 'done' : ''}`}
                      onClick={() => playStep(i)}
                      aria-label={`Go to step ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
              <p className="accessibility-audio-text">{AUDIO_STEPS[audioStep]}</p>
              <div className="accessibility-audio-buttons">
                <button
                  type="button"
                  className="accessibility-audio-btn"
                  onClick={prevStep}
                  disabled={audioStep === 0}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="accessibility-audio-btn replay"
                  onClick={() => playStep(audioStep)}
                >
                  Replay
                </button>
                <button
                  type="button"
                  className="accessibility-audio-btn"
                  onClick={nextStep}
                  disabled={audioStep === AUDIO_STEPS.length - 1}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <form className="complaint-form" onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="accessibility-quick-issues">
          <h3 className="accessibility-section-title">
            {disabilityType
              ? `Common issues for ${disabilityType.toLowerCase()} — tap a bubble to select`
              : 'Common accessibility issues — tap a bubble to select'}
          </h3>
          <div className="accessibility-bubble-menu">
            <BubbleMenu
              logo={<span style={{ fontWeight: 700, fontSize: '0.8rem', color: NEUTRAL_BUBBLE_TEXT }}>Issues</span>}
              items={bubbleItems}
              autoOpenKey={disabilityType || 'default'}
              menuAriaLabel="Toggle common accessibility issues"
              menuBg={NEUTRAL_BUBBLE_BG}
              menuContentColor={NEUTRAL_BUBBLE_TEXT}
              useFixedPosition={false}
              animationEase="back.out(1.5)"
              animationDuration={0.5}
              staggerDelay={0.08}
            />
          </div>
          {form.subject && (
            <div className="accessibility-bubble-selected">
              <span className="accessibility-bubble-selected-label">Selected:</span>
              <span className="accessibility-bubble-selected-value">{form.subject}</span>
              <button
                type="button"
                className="accessibility-bubble-clear"
                onClick={() => setForm({ ...form, subject: '' })}
              >
                <X size={14} /> Clear
              </button>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              maxLength={200}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Brief title of the accessibility issue"
            required
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the accessibility barrier or issue you experienced in detail..."
            required
            rows={6}
            maxLength={5000}
          />
          <span className="char-count">{form.description.length} / 5000</span>
        </div>

        <div className="form-group">
          <label>Add a Photo (Optional)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="photo-input-hidden"
            id="photo-upload-accessibility"
          />
          {photoPreview ? (
            <div className="photo-preview-wrapper">
              <img src={photoPreview} alt="Report preview" className="photo-preview-img" />
              <button type="button" className="photo-remove-btn" onClick={removePhoto}>
                <X size={18} />
                Remove Photo
              </button>
            </div>
          ) : (
            <label htmlFor="photo-upload-accessibility" className="photo-upload-area">
              <Camera size={28} />
              <span className="photo-upload-text">Click to upload a photo</span>
              <span className="photo-upload-hint">JPG, PNG, or GIF up to 5 MB</span>
            </label>
          )}
        </div>

        <div className="form-actions">
          <Link to="/" className="btn btn-ghost">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={20} className="spin" />
                Submitting...
              </>
            ) : (
              <>
                <Accessibility size={20} />
                Submit Report
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
