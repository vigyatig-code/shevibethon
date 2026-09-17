import { useCallback, useEffect, useRef, useState } from 'react'
import { type Language, LANG_CODES, pickVoice } from './voiceI18n'

// Intersection Observer hook for scroll-triggered reveals.
// Returns a ref to attach and a boolean for whether it is visible.
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(entry.target)
        }
      },
      options ?? { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [options])

  return [ref, inView]
}

// Count-up animation hook — animates from 0 to target when active.
export function useCountUp(target: number, active: boolean, duration = 1500): number {
  const [value, setValue] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!active || startedRef.current) return
    startedRef.current = true

    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
      else setValue(target)
    }
    requestAnimationFrame(tick)
  }, [active, target, duration])

  return value
}

// Detects prefers-reduced-motion at mount and on changes.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced
}

// 3D cursor-following tilt effect for interactive cards.
// Returns mouse event handlers to spread onto any element.
// Pass the same ref the element uses so the hook can read its rect.
export function useTilt<T extends HTMLElement>(
  tiltRef: React.RefObject<T | null>,
  enabled: boolean = true
) {
  const onMouseMove = (e: React.MouseEvent<T>) => {
    if (!enabled) return
    const el = tiltRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    const maxTilt = 12
    el.style.transform = `perspective(800px) rotateX(${-py * maxTilt}deg) rotateY(${px * maxTilt}deg) translateY(-6px) scale(1.02)`
  }

  const onMouseLeave = () => {
    const el = tiltRef.current
    if (!el) return
    el.style.transform = ''
  }

  return { onMouseMove, onMouseLeave }
}

// ---- Voice Form Filler ----
// Hands-free form filling using the Web Speech API.
// Speaks a prompt, listens for the answer, fills the field, then moves on.

export interface VoiceFormStep {
  id: string
  prompt: string
  label: string
  transform?: (value: string) => string
  validate?: (value: string) => boolean
}

export interface VoiceFormFillerState {
  active: boolean
  currentStep: number
  totalSteps: number
  listening: boolean
  speaking: boolean
  lastAnswer: string | null
  error: string | null
  supported: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognitionAPI: any = (typeof window !== 'undefined'
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null)

export function useVoiceFormFiller(
  steps: VoiceFormStep[],
  onFill: (id: string, value: string) => void,
  onComplete?: (answers: Record<string, string>) => void,
  lang: Language = 'en',
): {
  state: VoiceFormFillerState
  start: () => void
  stop: () => void
} {
  const [active, setActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [lastAnswer, setLastAnswer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const stepRef = useRef(0)
  const answersRef = useRef<Record<string, string>>({})
  const onFillRef = useRef(onFill)
  const onCompleteRef = useRef(onComplete)
  const stepsRef = useRef(steps)
  const activeRef = useRef(false)
  const langRef = useRef(lang)
  langRef.current = lang

  onFillRef.current = onFill
  onCompleteRef.current = onComplete
  stepsRef.current = steps

  const supported = !!SpeechRecognitionAPI

  const speak = useCallback((text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.lang = LANG_CODES[langRef.current]
    const voices = window.speechSynthesis.getVoices()
    const preferred = pickVoice(voices, langRef.current)
    if (preferred) utterance.voice = preferred
    utterance.onend = () => {
      setSpeaking(false)
      if (onEnd) onEnd()
    }
    utterance.onerror = () => {
      setSpeaking(false)
      if (onEnd) onEnd()
    }
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }, [])

  const askStep = useCallback((stepIndex: number) => {
    if (!activeRef.current) return
    if (stepIndex >= stepsRef.current.length) {
      speak('All done! Please review the form and submit when ready.', () => {
        activeRef.current = false
        setActive(false)
        setListening(false)
        if (onCompleteRef.current) onCompleteRef.current(answersRef.current)
      })
      return
    }

    const step = stepsRef.current[stepIndex]
    setCurrentStep(stepIndex)
    speak(step.prompt, () => {
      if (!activeRef.current) return
      try {
        recognitionRef.current?.start()
        setListening(true)
      } catch {
        // recognition already running
      }
    })
  }, [speak])

  const start = useCallback(() => {
    if (!supported) return

    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = LANG_CODES[langRef.current]
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      setListening(false)
      const transcript = event.results[0][0].transcript.trim()
      const step = stepsRef.current[stepRef.current]
      let value = step.transform ? step.transform(transcript) : transcript

      if (step.validate && !step.validate(value)) {
        setError(null)
        speak(`That didn't sound like a valid ${step.label}. Let's try again.`, () => {
          askStep(stepRef.current)
        })
        return
      }

      onFillRef.current(step.id, value)
      answersRef.current[step.id] = value
      setLastAnswer(value)
      setError(null)

      speak(`Got it. ${value}.`, () => {
        stepRef.current++
        askStep(stepRef.current)
      })
    }

    recognition.onerror = (event: any) => {
      setListening(false)
      if (event.error === 'no-speech' || event.error === 'aborted') return
      setError('Could not hear you clearly. Let\'s try again.')
      speak('Sorry, I didn\'t catch that. Let\'s try again.', () => {
        askStep(stepRef.current)
      })
    }

    recognition.onspeechend = () => {
      recognition.stop()
      setListening(false)
    }

    recognitionRef.current = recognition
    activeRef.current = true
    stepRef.current = 0
    answersRef.current = {}
    setActive(true)
    setError(null)
    setLastAnswer(null)
    setCurrentStep(0)

    speak("Let's fill out the form together. I'll ask you a few questions.", () => {
      askStep(0)
    })
  }, [supported, speak, askStep])

  const stop = useCallback(() => {
    activeRef.current = false
    setActive(false)
    setListening(false)
    setSpeaking(false)
    try {
      recognitionRef.current?.stop()
    } catch {
      // already stopped
    }
    window.speechSynthesis.cancel()
  }, [])

  useEffect(() => {
    return () => {
      activeRef.current = false
      try {
        recognitionRef.current?.stop()
      } catch {
        // noop
      }
      window.speechSynthesis.cancel()
    }
  }, [])

  return {
    state: {
      active,
      currentStep,
      totalSteps: steps.length,
      listening,
      speaking,
      lastAnswer,
      error,
      supported,
    },
    start,
    stop,
  }
}

// Tracks scroll progress 0–1 for the scroll progress indicator.
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0)
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return progress
}
