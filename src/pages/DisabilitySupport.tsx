import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Ear, Footprints, Brain, Heart, Volume2, VolumeX, ChevronRight, Info, FileText, ArrowLeft, Mic, MicOff } from 'lucide-react'
import BorderGlow from '../components/BorderGlow'
import TrueFocus from '../components/TrueFocus'

type SpeechRecognitionType = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
  onerror: (event: { error: string }) => void
  onend: () => void
  start: () => void
  stop: () => void
  abort: () => void
}

const VOICE_KEYWORDS: Record<string, string[]> = {
  'Visual Impairment': ['visual', 'blind', 'eyes', 'sight', 'low vision', 'braille', 'visually'],
  'Hearing Impairment': ['hearing', 'deaf', 'ear', 'ears', 'hard of hearing', 'sound', 'hearing loss'],
  'Mobility / Wheelchair': ['mobility', 'wheelchair', 'physical', 'ramp', 'walking', 'legs', 'crutches', 'movement', 'disabled', 'handicap'],
  'Cognitive / Developmental': ['cognitive', 'developmental', 'autism', 'autistic', 'brain', 'learning', 'intellectual', 'down syndrome', 'mental'],
  'Multiple Disabilities': ['multiple', 'more than one', 'several', 'both', 'combination', 'many disabilities'],
}

type DisabilityValue = 'Visual Impairment' | 'Hearing Impairment' | 'Mobility / Wheelchair' | 'Cognitive / Developmental' | 'Multiple Disabilities'

interface DisabilityInfo {
  icon: typeof Eye
  label: DisabilityValue
  value: DisabilityValue
  shortDesc: string
  fullDesc: string
  commonIssues: string[]
  rights: string[]
  resources: string[]
  audioDesc: string
}

const DISABILITIES: DisabilityInfo[] = [
  {
    icon: Eye,
    label: 'Visual Impairment',
    value: 'Visual Impairment',
    shortDesc: 'Blindness or low vision',
    fullDesc: 'Visual impairment includes complete blindness, partial sight, low vision, color blindness, and conditions that cannot be fully corrected with glasses. People with visual impairments rely on screen readers, Braille, tactile paving, and audio cues to navigate public and digital spaces.',
    commonIssues: [
      'Missing Braille signage in public buildings',
      'Website or app not screen-reader compatible',
      'Broken or blocked tactile paving on sidewalks',
      'No audio announcements at public transit stations',
      'No large-print or high-contrast signage',
      'Inaccessible pedestrian crossings without audible signals',
    ],
    rights: [
      'Right to accessible public infrastructure including tactile paving and Braille signage',
      'Right to screen-reader-compatible digital platforms and websites',
      'Right to audio announcements in public transport',
      'Right to reasonable accommodation in education and workplace',
    ],
    resources: [
      'National Association for the Blind (NAB) — helpline and support services',
      'All India Confederation of the Blind — advocacy and legal aid',
      'NIEPVD (National Institute for Empowerment of Persons with Visual Disabilities)',
      'Screen reader software: NVDA (free), JAWS, VoiceOver (built-in on Apple devices)',
    ],
    audioDesc: 'You selected Visual Impairment. This includes blindness and low vision. Common issues include missing Braille signage, websites not compatible with screen readers, broken tactile paving, and lack of audio announcements. You have the right to accessible public infrastructure and digital platforms. When you are ready, you can file a report about any accessibility barrier you have faced.',
  },
  {
    icon: Ear,
    label: 'Hearing Impairment',
    value: 'Hearing Impairment',
    shortDesc: 'Deaf or hard of hearing',
    fullDesc: 'Hearing impairment ranges from mild hearing loss to complete deafness. People who are deaf or hard of hearing rely on sign language, captions, visual alerts, and text-based communication. Public spaces and digital platforms must provide visual alternatives to audio information.',
    commonIssues: [
      'No sign language interpreter available at public offices',
      'Videos without captions or subtitles',
      'No visual emergency alerts in public buildings',
      'No hearing-loop or assistive listening system',
      'Staff untrained in basic sign language',
      'No text-based communication alternatives',
    ],
    rights: [
      'Right to sign language interpreters in government offices and courts',
      'Right to captions and subtitles on public information videos',
      'Right to visual emergency alerts in all public buildings',
      'Right to text-based communication in public services',
    ],
    resources: [
      'National Association of the Deaf (NAD) — advocacy and support',
      'ISLRTC (Indian Sign Language Research and Training Centre)',
      'NISHA (National Institute for Speech and Hearing)',
      'Aided hearing devices and cochlear implant programs via ADIP scheme',
    ],
    audioDesc: 'You selected Hearing Impairment. This includes deafness and hard of hearing. Common issues include lack of sign language interpreters, videos without captions, no visual emergency alerts, and no assistive listening systems. You have the right to sign language interpreters and visual alerts in public spaces. When you are ready, you can file a report about any accessibility barrier you have faced.',
  },
  {
    icon: Footprints,
    label: 'Mobility / Wheelchair',
    value: 'Mobility / Wheelchair',
    shortDesc: 'Physical and mobility challenges',
    fullDesc: 'Mobility impairment includes conditions that affect walking, standing, or using arms and hands. This includes wheelchair users, people who use crutches or walkers, and those with limited dexterity. Accessible infrastructure like ramps, wide doorways, elevators, and dropped kerbs are essential for independent mobility.',
    commonIssues: [
      'No wheelchair ramp at public building entrance',
      'Steep steps without handrail at public entrance',
      'Narrow doorways blocking wheelchair access',
      'Broken or missing elevator in multi-floor building',
      'No accessible parking near building entrance',
      'No disabled-friendly restroom',
      'Inaccessible public transport',
      'No dropped kerbs on pavements',
    ],
    rights: [
      'Right to barrier-free access in all public buildings',
      'Right to accessible public transport with ramps and designated spaces',
      'Right to reserved accessible parking near building entrances',
      'Right to accessible restrooms in public facilities',
    ],
    resources: [
      'AccessAbility — accessibility audits and consultancy',
      'NIEPID (National Institute for Empowerment of Persons with Intellectual Disabilities)',
      'Disability Commissioner office in your state — file complaints',
      'Svayam — accessibility assessment and certification',
    ],
    audioDesc: 'You selected Mobility or Wheelchair. This includes physical and mobility challenges. Common issues include missing wheelchair ramps, narrow doorways, broken elevators, no accessible parking, and inaccessible public transport. You have the right to barrier-free access in all public buildings and transport. When you are ready, you can file a report about any accessibility barrier you have faced.',
  },
  {
    icon: Brain,
    label: 'Cognitive / Developmental',
    value: 'Cognitive / Developmental',
    shortDesc: 'Learning and cognitive disabilities',
    fullDesc: 'Cognitive and developmental disabilities include autism, Down syndrome, learning disabilities, dementia, and intellectual disabilities. People with cognitive disabilities may need simplified information, clear wayfinding, quiet spaces, and patient, trained staff to access services independently.',
    commonIssues: [
      'Complex or confusing signage in public spaces',
      'No quiet or sensory-friendly spaces available',
      'Lack of clear wayfinding or visual maps',
      'Overwhelming sensory environment (lighting, noise)',
      'No easy-read materials or simplified forms',
      'Staff untrained in supporting cognitive disabilities',
    ],
    rights: [
      'Right to simplified and easy-read information in public services',
      'Right to sensory-friendly environments in public spaces',
      'Right to trained staff who can support cognitive disabilities',
      'Right to reasonable accommodation in education and employment',
    ],
    resources: [
      'Action for Autism — support and resources',
      'Down Syndrome Federation of India',
      'NIEPID — National Institute for Empowerment of Persons with Intellectual Disabilities',
      'Alzheimer\'s and Related Disorders Society of India',
    ],
    audioDesc: 'You selected Cognitive or Developmental. This includes autism, learning disabilities, and intellectual disabilities. Common issues include confusing signage, no quiet spaces, overwhelming sensory environments, and lack of easy-read materials. You have the right to simplified information and trained support staff. When you are ready, you can file a report about any accessibility barrier you have faced.',
  },
  {
    icon: Heart,
    label: 'Multiple Disabilities',
    value: 'Multiple Disabilities',
    shortDesc: 'More than one disability',
    fullDesc: 'Multiple disabilities means a person has two or more disabilities at the same time, such as visual and hearing impairment, or mobility and cognitive disabilities. Accessibility solutions must address all the person\'s needs together, not individually.',
    commonIssues: [
      'No wheelchair ramp at public building',
      'No sign language interpreter available',
      'Missing Braille signage',
      'No disabled-friendly restroom',
      'Broken or missing elevator in multi-floor building',
      'Inaccessible public transport',
      'Discrimination or denial of service',
      'No accessible parking near building entrance',
    ],
    rights: [
      'Right to comprehensive accessibility addressing all disabilities',
      'Right to combined accommodations in education and workplace',
      'Right to non-discrimination in all public services',
      'Right to person-centered support plans',
    ],
    resources: [
      'National Trust — support for persons with multiple disabilities',
      'Disability Commissioner office in your state',
      'ADIP scheme — assistive devices and support',
      'State Disability Welfare Boards — benefits and services',
    ],
    audioDesc: 'You selected Multiple Disabilities. This means you have more than one disability. Common issues include missing ramps, no sign language interpreters, missing Braille signage, and discrimination. You have the right to comprehensive accessibility addressing all your needs. When you are ready, you can file a report about any accessibility barrier you have faced.',
  },
]

export default function DisabilitySupport() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<DisabilityInfo | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)
  const recognitionRef = useRef<SpeechRecognitionType | null>(null)

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    // rate and pitch must both be 1 (default) — values below 1 can cause
    // the browser to use a different audio processing path that distorts pitch.
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1
    utterance.onend = () => setSpeaking(false)
    speechRef.current = utterance
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
    speechRef.current = null
  }, [])

  useEffect(() => {
    return () => stopSpeaking()
  }, [stopSpeaking])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const matchVoiceToDisability = useCallback((transcript: string): DisabilityInfo | null => {
    const lower = transcript.toLowerCase()
    let bestMatch: DisabilityInfo | null = null
    let bestScore = 0
    for (const disability of DISABILITIES) {
      const keywords = VOICE_KEYWORDS[disability.value] || []
      let score = 0
      for (const keyword of keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          score += keyword.length
        }
      }
      if (score > bestScore) {
        bestScore = score
        bestMatch = disability
      }
    }
    return bestMatch
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setListening(false)
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionType }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionType }).webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      setVoiceError('Voice recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    setVoiceError(null)
    setVoiceTranscript('')
    stopSpeaking()

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setVoiceTranscript(transcript)
      const match = matchVoiceToDisability(transcript)
      if (match) {
        handleSelect(match)
      } else {
        const apology = `Sorry, I didn't catch that. I heard "${transcript}". Please try saying visual, hearing, mobility, cognitive, or multiple.`
        setVoiceError(apology)
        speak(apology)
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        setVoiceError('No speech detected. Please try again.')
      } else if (event.error === 'not-allowed') {
        setVoiceError('Microphone access denied. Please allow microphone access and try again.')
      } else {
        setVoiceError(`Voice error: ${event.error}`)
      }
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }, [matchVoiceToDisability, stopSpeaking])

  const [highlighted, setHighlighted] = useState<string | null>(null)

  const handleSelect = (disability: DisabilityInfo) => {
    setSelected(disability)
    setVoiceError(null)
    setVoiceTranscript('')
    setHighlighted(disability.value)
    speak(disability.audioDesc)
  }

  const handleFileReport = () => {
    if (!selected) return
    navigate(`/accessibility?type=${encodeURIComponent(selected.value)}`)
  }

  if (selected) {
    return (
      <div className="page-container disability-support-page">
        <div className="disability-detail-header">
          <button
            type="button"
            className="btn btn-ghost disability-back-btn"
            onClick={() => { stopSpeaking(); setSelected(null) }}
          >
            <ArrowLeft size={18} />
            Back to all disabilities
          </button>
          <div className="disability-detail-icon-wrap">
            <selected.icon size={40} />
          </div>
          <h1>{selected.label}</h1>
          <p className="disability-detail-shortdesc">{selected.shortDesc}</p>
        </div>

        <div className="disability-audio-bar">
          <button
            type="button"
            className={`accessibility-audio-toggle ${speaking ? 'on' : ''}`}
            onClick={() => (speaking ? stopSpeaking() : speak(selected.audioDesc))}
            aria-label={speaking ? 'Stop audio description' : 'Play audio description'}
          >
            {speaking ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>{speaking ? 'Stop Audio' : 'Play Audio Description'}</span>
          </button>
        </div>

        <div className="disability-detail-grid">
          <div className="disability-detail-card">
            <div className="disability-detail-card-header">
              <Info size={20} />
              <h2>About this disability</h2>
            </div>
            <p className="disability-detail-text">{selected.fullDesc}</p>
          </div>

          <div className="disability-detail-card">
            <div className="disability-detail-card-header">
              <FileText size={20} />
              <h2>Common issues faced</h2>
            </div>
            <ul className="disability-issues-list">
              {selected.commonIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>

          <div className="disability-detail-card">
            <div className="disability-detail-card-header">
              <ChevronRight size={20} />
              <h2>Your rights</h2>
            </div>
            <ul className="disability-rights-list">
              {selected.rights.map((right) => (
                <li key={right}>{right}</li>
              ))}
            </ul>
          </div>

          <div className="disability-detail-card">
            <div className="disability-detail-card-header">
              <Heart size={20} />
              <h2>Resources and support</h2>
            </div>
            <ul className="disability-resources-list">
              {selected.resources.map((resource) => (
                <li key={resource}>{resource}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="disability-detail-cta">
          <h3>Have you faced an accessibility barrier related to {selected.label.toLowerCase()}?</h3>
          <p>File a report and it will be automatically flagged as high priority.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={handleFileReport}>
            <FileText size={20} />
            File a Report for {selected.label}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container disability-support-page">
      <div className="form-page-header">
        <div className="form-page-icon accessibility-icon">
          <Heart size={32} />
        </div>
        <h1>Disability Support Portal</h1>
        <div className="form-page-tagline">
          <TrueFocus
            sentence="Select your disability to get started"
            borderColor="#e07a3c"
            glowColor="rgba(224, 122, 60, 0.6)"
            blurAmount={3}
            animationDuration={0.8}
            pauseBetweenAnimations={0.8}
          />
        </div>
        <p>Choose your disability type below to see common issues, your rights, available resources, and to file a report. An audio description will play automatically when you select a disability.</p>
      </div>

      <div className="disability-voice-section">
        <button
          type="button"
          className={`disability-mic-btn ${listening ? 'listening' : ''}`}
          onClick={() => (listening ? stopListening() : startListening())}
          aria-label={listening ? 'Stop voice input' : 'Start voice input'}
        >
          {listening ? <MicOff size={24} /> : <Mic size={24} />}
          <span>{listening ? 'Listening... Tap to stop' : 'Say your disability type'}</span>
        </button>
        {listening && (
          <div className="disability-voice-pulse">
            <span /><span /><span />
          </div>
        )}
        {voiceTranscript && !listening && (
          <p className="disability-voice-transcript">Heard: "{voiceTranscript}"</p>
        )}
        {voiceError && (
          <p className="disability-voice-error">{voiceError}</p>
        )}
        <p className="disability-voice-hint">
          Try saying: "visual impairment", "hearing", "mobility", "cognitive", or "multiple disabilities"
        </p>
      </div>

      <div className="disability-selection-grid">
        {DISABILITIES.map((disability) => {
          const Icon = disability.icon
          return (
            <BorderGlow
              key={disability.value}
              borderRadius={16}
              glowRadius={32}
              glowIntensity={1.4}
              edgeSensitivity={28}
              coneSpread={30}
              glowColor="28 70 55"
              backgroundColor="rgba(45, 28, 14, 0.88)"
              colors={['#f0b032', '#e07a3c', '#c25a22']}
              fillOpacity={0.35}
              className="disability-card-glow"
            >
              <button
                type="button"
                className={`disability-select-card ${highlighted === disability.value ? 'voice-highlighted' : ''}`}
                onClick={() => handleSelect(disability)}
                aria-label={`Select ${disability.label}`}
              >
                <div className="disability-select-icon">
                  <Icon size={32} />
                </div>
                <h3 className="disability-select-label">{disability.label}</h3>
                <p className="disability-select-desc">{disability.shortDesc}</p>
                <div className="disability-select-cta">
                  <span>View details</span>
                  <ChevronRight size={16} />
                </div>
              </button>
            </BorderGlow>
          )
        })}
      </div>
    </div>
  )
}
