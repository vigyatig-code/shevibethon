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

export function useVoiceForm(
  onFill: (field: VoiceStep['field'], value: string) => void,
) {
  const [active, setActive] = useState(false)
  const [spokenField, setSpokenField] = useState<string | null>(null)
  const stepRef = useRef(0)
  const recognitionRef = useRef<any>(null)
  const onFillRef = useRef(onFill)
  onFillRef.current = onFill

  const speak = useCallback((text: string, callback?: () => void) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.onend = () => callback?.()
    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    setActive(false)
    setSpokenField(null)
    stepRef.current = 0
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    window.speechSynthesis.cancel()
  }, [])

  const askStep = useCallback((idx: number) => {
    if (idx >= STEPS.length) {
      setActive(false)
      setSpokenField(null)
      speak("All done! Please review the form and submit when ready.")
      return
    }
    const step = STEPS[idx]
    setSpokenField(step.field)
    speak(step.prompt, () => {
      try {
        recognitionRef.current?.start()
      } catch {
        // already running — ignore
      }
    })
  }, [speak])

  const handleAnswer = useCallback((raw: string) => {
    const step = STEPS[stepRef.current]
    let value = step.transform ? step.transform(raw) : raw

    if (step.validate && !step.validate(value)) {
      speak(`That didn't sound like a valid ${step.label}. Let's try again.`, () =>
        askStep(stepRef.current),
      )
      return
    }

    onFillRef.current(step.field, value)
    speak(`Got it. ${value}.`, () => {
      stepRef.current++
      askStep(stepRef.current)
    })
  }, [speak, askStep])

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert("Your browser doesn't support voice input. Try Chrome or Edge.")
      return
    }

    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript.trim()
      handleAnswer(transcript)
    }
    rec.onerror = (e: any) => {
      console.error('Speech recognition error:', e.error)
      speak("Sorry, I didn't catch that. Let's try again.", () => askStep(stepRef.current))
    }
    rec.onspeechend = () => {
      try { rec.stop() } catch {}
    }
    recognitionRef.current = rec

    stepRef.current = 0
    setActive(true)
    speak("Let's fill out the form together. I'll ask you a few questions.", () =>
      askStep(0),
    )
  }, [handleAnswer, speak, askStep])

  return { active, spokenField, start, stop }
}
