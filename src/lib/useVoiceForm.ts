import { useRef, useState, useCallback } from 'react'

interface VoiceStep {
  field: 'name' | 'email' | 'subject' | 'description'
  prompt: string
  label: string
  validate?: (value: string) => boolean
  transform?: (raw: string) => string
}

const STEPS: VoiceStep[] = [
  {
    field: 'name',
    label: 'name',
    prompt: "What is your full name?",
    transform: (t) => t.replace(/\b\w/g, (c) => c.toUpperCase()),
  },
  {
    field: 'email',
    label: 'email address',
    prompt: "What is your email address? You can say it like: john dot smith at gmail dot com.",
    transform: parseSpokenEmail,
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  },
  {
    field: 'subject',
    label: 'subject',
    prompt: "What is a brief title for your complaint?",
  },
  {
    field: 'description',
    label: 'description',
    prompt: "Please describe the issue in detail.",
  },
]

function parseSpokenEmail(transcript: string): string {
  return transcript
    .toLowerCase()
    .replace(/\s+at\s+/g, '@')
    .replace(/\s+dot\s+/g, '.')
    .replace(/\s+underscore\s+/g, '_')
    .replace(/\s+dash\s+/g, '-')
    .replace(/\s+/g, '')
}

function getSpeechRecognition(): any | null {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
}

export function useVoiceForm(
  onFill: (field: VoiceStep['field'], value: string) => void,
) {
  const [active, setActive] = useState(false)
  const [spokenField, setSpokenField] = useState<string | null>(null)
  const stepRef = useRef(0)
  const recognitionRef = useRef<any>(null)
  const onFillRef = useRef(onFill)
  onFillRef.current = onFill
  const runningRef = useRef(false)

  const speak = useCallback((text: string, callback?: () => void) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.onend = () => callback?.()
    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    runningRef.current = false
    setActive(false)
    setSpokenField(null)
    stepRef.current = 0
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
    window.speechSynthesis.cancel()
  }, [])

  const startListening = useCallback(() => {
    if (!runningRef.current) return

    const SR = getSpeechRecognition()
    if (!SR) return

    // Always create a fresh instance — Chrome can't restart a used one
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }

    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript.trim()
      handleAnswerRef.current(transcript)
    }
    rec.onerror = (e: any) => {
      console.error('Speech recognition error:', e.error)
      if (e.error === 'no-speech' || e.error === 'aborted') return
      speak("Sorry, I didn't catch that. Let's try again.", () => askStepRef.current(stepRef.current))
    }
    rec.onspeechend = () => {
      try { rec.stop() } catch {}
    }

    recognitionRef.current = rec

    try {
      rec.start()
    } catch {
      // Chrome throws if called too quickly — retry after short delay
      setTimeout(() => {
        if (!runningRef.current) return
        try { rec.start() } catch {}
      }, 200)
    }
  }, [speak])

  const handleAnswer = useCallback((raw: string) => {
    if (!runningRef.current) return
    const step = STEPS[stepRef.current]
    let value = step.transform ? step.transform(raw) : raw

    if (step.validate && !step.validate(value)) {
      speak(`That didn't sound like a valid ${step.label}. Let's try again.`, () =>
        askStepRef.current(stepRef.current),
      )
      return
    }

    onFillRef.current(step.field, value)
    speak(`Got it. ${value}.`, () => {
      stepRef.current++
      askStepRef.current(stepRef.current)
    })
  }, [speak])

  const askStep = useCallback((idx: number) => {
    if (!runningRef.current) return
    if (idx >= STEPS.length) {
      runningRef.current = false
      setActive(false)
      setSpokenField(null)
      speak("All done! Please review the form and submit when ready.")
      return
    }
    const step = STEPS[idx]
    setSpokenField(step.field)
    speak(step.prompt, () => {
      if (runningRef.current) startListening()
    })
  }, [speak, startListening])

  // Keep refs to latest callbacks so recognition handlers (set up once per
  // instance) always call the current version
  const handleAnswerRef = useRef(handleAnswer)
  handleAnswerRef.current = handleAnswer
  const askStepRef = useRef(askStep)
  askStepRef.current = askStep

  const start = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) {
      alert("Your browser doesn't support voice input. Try Chrome or Edge.")
      return
    }

    runningRef.current = true
    stepRef.current = 0
    setActive(true)
    speak("Let's fill out the form together. I'll ask you a few questions.", () =>
      askStep(0),
    )
  }, [speak, askStep])

  return { active, spokenField, start, stop }
}
