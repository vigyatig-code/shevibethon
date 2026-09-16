import { useRef, useState, useCallback, useEffect } from 'react'

const PHONETIC_MAP: Record<string, string> = {
  a: 'a', alpha: 'a', b: 'b', bee: 'b', c: 'c', see: 'c', sea: 'c',
  d: 'd', dee: 'd', e: 'e', f: 'f', ef: 'f', g: 'g', gee: 'g',
  h: 'h', aitch: 'h', i: 'i', eye: 'i', j: 'j', jay: 'j', k: 'k', kay: 'k',
  l: 'l', el: 'l', m: 'm', em: 'm', n: 'n', en: 'n', o: 'o', oh: 'o',
  p: 'p', pee: 'p', q: 'q', cue: 'q', r: 'r', ar: 'r', s: 's', ess: 's',
  t: 't', tee: 't', u: 'u', you: 'u', v: 'v', vee: 'v', w: 'w', 'double u': 'w',
  x: 'x', ex: 'x', y: 'y', why: 'y', z: 'z', zee: 'z', zed: 'z',
  zero: '0', one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  at: '@', 'at sign': '@', dot: '.', period: '.', dash: '-', hyphen: '-',
  underscore: '_', space: ' ',
}

interface VoiceStep {
  field: 'name' | 'email' | 'subject' | 'description'
  label: string
  prompt: string
  validate?: (value: string) => boolean
  transform?: (raw: string) => string
  speakAs?: (value: string) => string
  spellable?: boolean
}

const STEPS: VoiceStep[] = [
  {
    field: 'name',
    label: 'name',
    prompt: 'What is your full name?',
    transform: (t) => t.replace(/\b\w/g, (c) => c.toUpperCase()),
    spellable: true,
  },
  {
    field: 'email',
    label: 'email address',
    prompt: 'What is your email address? You can say it like: john dot smith at gmail dot com.',
    transform: parseSpokenEmail,
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    spellable: true,
    speakAs: (v) => v.replace(/@/g, ' at ').replace(/\./g, ' dot '),
  },
  {
    field: 'subject',
    label: 'subject',
    prompt: 'What is a brief title for your complaint?',
    spellable: true,
  },
  {
    field: 'description',
    label: 'description',
    prompt: 'Please describe the issue in detail.',
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
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const speak = useCallback((text: string, callback?: () => void) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.05
    if (voicesRef.current.length) {
      const preferred = voicesRef.current.find((v) => v.lang === 'en-US') || voicesRef.current[0]
      utterance.voice = preferred
    }
    utterance.onend = () => callback?.()
    utterance.onerror = () => callback?.()
    window.speechSynthesis.speak(utterance)
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    runningRef.current = false
    clearTimer()
    setActive(false)
    setSpokenField(null)
    stepRef.current = 0
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
    window.speechSynthesis.cancel()
  }, [clearTimer])

  const prewarm = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) return
    try {
      const warmup = new SR()
      warmup.lang = 'en-US'
      warmup.continuous = false
      warmup.interimResults = false
      warmup.maxAlternatives = 1
      warmup.onerror = () => {}
      warmup.start()
      setTimeout(() => {
        try { warmup.stop() } catch {}
      }, 150)
    } catch {}
  }, [])

  const listenOnce = useCallback((onHeard: (transcript: string) => void, onFail: (reason: string) => void) => {
    const SR = getSpeechRecognition()
    if (!SR) { onFail('no-support'); return }

    let settled = false
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 1

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      try { rec.stop() } catch {}
      onFail('timeout')
    }, 6000)
    timerRef.current = timer

    rec.onresult = (e: any) => {
      if (settled) return
      settled = true
      clearTimer()
      onHeard(e.results[0][0].transcript.trim())
    }
    rec.onerror = (e: any) => {
      if (settled) return
      settled = true
      clearTimer()
      onFail(e.error)
    }
    rec.onspeechend = () => {
      try { rec.stop() } catch {}
    }

    recognitionRef.current = rec

    try {
      rec.start()
    } catch {
      if (!settled) {
        settled = true
        clearTimer()
        onFail('start-failed')
      }
    }
  }, [clearTimer])

  // --- Refs to avoid stale closures in recognition callbacks ---
  const askStepRef = useRef<(idx: number) => void>(() => {})
  const listenForAnswerRef = useRef<(step: VoiceStep) => void>(() => {})
  const proposeAnswerRef = useRef<(step: VoiceStep, raw: string) => void>(() => {})
  const confirmAnswerRef = useRef<(step: VoiceStep, value: string) => void>(() => {})
  const spellModeRef = useRef<(step: VoiceStep) => void>(() => {})
  const spellLoopRef = useRef<(step: VoiceStep, buffer: string[]) => void>(() => {})
  const commitAnswerRef = useRef<(step: VoiceStep, value: string) => void>(() => {})

  const commitAnswer = useCallback((step: VoiceStep, value: string) => {
    onFillRef.current(step.field, value)
    speak(`Got it.`, () => {
      stepRef.current++
      askStepRef.current(stepRef.current)
    })
  }, [speak])

  commitAnswerRef.current = commitAnswer

  const spellLoop = useCallback((step: VoiceStep, buffer: string[]) => {
    if (!runningRef.current) return
    listenOnce(
      (transcript) => {
        const word = transcript.toLowerCase().trim()
        if (word === 'done' || word === "finished" || word === "that's it") {
          const value = buffer.join('')
          confirmAnswerRef.current(step, step.transform ? step.transform(value) : value)
          return
        }
        if (word === 'delete' || word === 'backspace' || word === 'remove that') {
          buffer.pop()
          speak('Removed.', () => spellLoopRef.current(step, buffer))
          return
        }
        const char = PHONETIC_MAP[word] || (word.length === 1 ? word : null)
        if (char !== null && char !== undefined) {
          buffer.push(char)
          speak(char, () => spellLoopRef.current(step, buffer))
        } else {
          spellLoopRef.current(step, buffer)
        }
      },
      () => spellLoopRef.current(step, buffer),
    )
  }, [listenOnce, speak])

  spellLoopRef.current = spellLoop

  const spellMode = useCallback((step: VoiceStep) => {
    speak(
      `Please spell it out, one letter at a time. Say "at" for @, "dot" for period, and "done" when finished.`,
      () => spellLoopRef.current(step, []),
    )
  }, [speak])

  spellModeRef.current = spellMode

  const confirmAnswer = useCallback((step: VoiceStep, value: string) => {
    const spoken = step.speakAs ? step.speakAs(value) : value
    speak(
      `I heard: ${spoken}. Say "yes" to confirm, or say "spell it" to correct it.`,
      () => {
        if (!runningRef.current) return
        listenOnce(
          (reply) => {
            const r = reply.toLowerCase()
            if (r.includes('yes') || r.includes('correct') || r.includes('confirm')) {
              commitAnswerRef.current(step, value)
            } else if (step.spellable && (r.includes('spell') || r.includes('no'))) {
              spellModeRef.current(step)
            } else {
              proposeAnswerRef.current(step, reply)
            }
          },
          () => confirmAnswerRef.current(step, value),
        )
      },
    )
  }, [speak, listenOnce])

  confirmAnswerRef.current = confirmAnswer

  const proposeAnswer = useCallback((step: VoiceStep, rawTranscript: string) => {
    const value = step.transform ? step.transform(rawTranscript) : rawTranscript

    if (step.validate && !step.validate(value)) {
      if (step.spellable) {
        speak(
          `I heard "${rawTranscript}", but that doesn't look like a valid ${step.label}. Let's spell it out instead.`,
          () => spellModeRef.current(step),
        )
      } else {
        speak(`That didn't sound right for ${step.label}. Let's try again.`, () =>
          listenForAnswerRef.current(step),
        )
      }
      return
    }

    confirmAnswerRef.current(step, value)
  }, [speak])

  proposeAnswerRef.current = proposeAnswer

  const listenForAnswer = useCallback((step: VoiceStep) => {
    if (!runningRef.current) return
    listenOnce(
      (transcript) => proposeAnswerRef.current(step, transcript),
      () => {
        if (!runningRef.current) return
        speak("Sorry, I didn't catch that. Let's try again.", () =>
          listenForAnswerRef.current(step),
        )
      },
    )
  }, [listenOnce, speak])

  listenForAnswerRef.current = listenForAnswer

  const askStep = useCallback((idx: number) => {
    if (!runningRef.current) return
    if (idx >= STEPS.length) {
      runningRef.current = false
      setActive(false)
      setSpokenField(null)
      speak('All done! Please review the form and submit when ready.')
      return
    }
    const step = STEPS[idx]
    setSpokenField(step.field)
    speak(step.prompt, () => {
      if (runningRef.current) listenForAnswerRef.current(step)
    })
  }, [speak])

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
    prewarm()
    speak("Let's fill out the form together. I'll ask you a few questions.", () =>
      askStepRef.current(0),
    )
  }, [speak, prewarm])

  useEffect(() => {
    return () => {
      runningRef.current = false
      clearTimer()
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
      }
      window.speechSynthesis.cancel()
    }
  }, [clearTimer])

  return { active, spokenField, start, stop }
}
