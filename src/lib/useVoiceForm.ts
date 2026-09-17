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

const FINAL_WORDS = ['final', 'finalize', "that's final", 'lock it in', 'confirm final']
const REDO_WORDS = ['redo', 'again', 'try again', 'start over', 'no']
const SPELL_WORDS = ['spell', 'spell it', 'let me spell', 'spell it out']

function containsAny(text: string, words: string[]): boolean {
  const t = text.toLowerCase()
  return words.some((w) => t.includes(w))
}

function parseSpokenEmail(transcript: string): string {
  return transcript
    .toLowerCase()
    .replace(/\s+at\s+/g, '@')
    .replace(/\s+dot\s+/g, '.')
    .replace(/\s+underscore\s+/g, '_')
    .replace(/\s+dash\s+/g, '-')
    .replace(/\s+/g, '')
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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
    prompt: "What is your full name? Take your time — there's no rush at all.",
    transform: (t) => t.replace(/\b\w/g, (c) => c.toUpperCase()),
    spellable: true,
  },
  {
    field: 'email',
    label: 'email address',
    prompt:
      "What is your email address? You can say it naturally, like: john dot smith at gmail dot com. Take your time.",
    transform: parseSpokenEmail,
    validate: isValidEmail,
    spellable: true,
    speakAs: (v) => v.replace(/@/g, ' at ').replace(/\./g, ' dot '),
  },
  {
    field: 'subject',
    label: 'subject',
    prompt: 'What is a brief title for your complaint? Just say it in a few words.',
    spellable: true,
  },
  {
    field: 'description',
    label: 'description',
    prompt:
      'Please describe the issue in your own words. There is no rush — take as long as you need.',
  },
]

function getSpeechRecognition(): any | null {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
}

export interface VoiceStatus {
  stepNum: number
  totalSteps: number
  prompt: string
  heard: string
}

export function useVoiceForm(
  onFill: (field: VoiceStep['field'], value: string) => void,
) {
  const [active, setActive] = useState(false)
  const [spokenField, setSpokenField] = useState<string | null>(null)
  const [status, setStatus] = useState<VoiceStatus | null>(null)
  const stepRef = useRef(0)
  const recognitionRef = useRef<any>(null)
  const onFillRef = useRef(onFill)
  onFillRef.current = onFill
  const runningRef = useRef(false)
  const isBusyRef = useRef(false)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Chrome bug workaround: speechSynthesis silently stops after ~15s.
  useEffect(() => {
    keepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 10000)
    return () => {
      if (keepAliveRef.current) clearInterval(keepAliveRef.current)
    }
  }, [])

  const speak = useCallback((text: string, callback?: () => void) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.92
    utterance.pitch = 1
    const preferred = voicesRef.current.find((v) => v.lang === 'en-US') || voicesRef.current[0]
    if (preferred) utterance.voice = preferred

    let done = false
    const safety = setTimeout(() => {
      if (done) return
      done = true
      // 400ms buffer after speaking ends before the mic opens — prevents the
      // mic from catching the tail end of the browser's own voice (echo).
      setTimeout(() => callback?.(), 400)
    }, text.length * 100 + 2500)

    const finish = () => {
      if (done) return
      done = true
      clearTimeout(safety)
      setTimeout(() => callback?.(), 400)
    }

    utterance.onend = finish
    utterance.onerror = finish
    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    runningRef.current = false
    isBusyRef.current = false
    setActive(false)
    setSpokenField(null)
    setStatus(null)
    stepRef.current = 0
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
    window.speechSynthesis.cancel()
  }, [])

  const updateStatus = useCallback((heard: string) => {
    const idx = stepRef.current
    const step = idx < STEPS.length ? STEPS[idx] : STEPS[STEPS.length - 1]
    setStatus({
      stepNum: idx + 1,
      totalSteps: STEPS.length,
      prompt: step.prompt,
      heard,
    })
  }, [])

  const repeat = useCallback(() => {
    if (!runningRef.current) return
    askStepRef.current(stepRef.current)
  }, [])

  const skip = useCallback(() => {
    if (!runningRef.current) return
    stepRef.current++
    askStepRef.current(stepRef.current)
  }, [])

  const listenOnce = useCallback(
    (onHeard: (transcript: string) => void, onNothingHeard: (reason: string) => void) => {
      const SR = getSpeechRecognition()
      if (!SR) {
        onNothingHeard('no-support')
        return
      }
      if (isBusyRef.current) return
      isBusyRef.current = true

      let settled = false
      const rec = new SR()
      rec.lang = 'en-US'
      rec.continuous = false
      rec.interimResults = false
      rec.maxAlternatives = 1

      rec.onresult = (e: any) => {
        if (settled) return
        settled = true
        isBusyRef.current = false
        const transcript = e.results[0][0].transcript.trim()
        // Ignore obvious noise/garbage picked up by accident
        if (transcript.length < 2) {
          onNothingHeard('too-short')
          return
        }
        onHeard(transcript)
      }
      rec.onerror = (e: any) => {
        if (settled) return
        settled = true
        isBusyRef.current = false
        onNothingHeard(e.error)
      }
      rec.onspeechend = () => {
        try { rec.stop() } catch {}
      }
      rec.onend = () => {
        if (!settled) {
          settled = true
          isBusyRef.current = false
          onNothingHeard('no-speech')
        }
      }

      recognitionRef.current = rec

      try {
        rec.start()
      } catch {
        if (!settled) {
          settled = true
          isBusyRef.current = false
          onNothingHeard('start-failed')
        }
      }
    },
    [],
  )

  // --- Refs to avoid stale closures ---
  const askStepRef = useRef<(idx: number) => void>(() => {})
  const gentleListenRef = useRef<(step: VoiceStep) => void>(() => {})
  const handleAttemptRef = useRef<(step: VoiceStep, raw: string) => void>(() => {})
  const awaitDecisionRef = useRef<(step: VoiceStep, candidateValue: string) => void>(() => {})
  const spellModeRef = useRef<(step: VoiceStep) => void>(() => {})
  const spellLoopRef = useRef<(step: VoiceStep, buffer: string[]) => void>(() => {})
  const commitAnswerRef = useRef<(step: VoiceStep, value: string) => void>(() => {})

  const commitAnswer = useCallback(
    (step: VoiceStep, value: string) => {
      onFillRef.current(step.field, value)
      speak("Great, that's saved.", () => {
        stepRef.current++
        askStepRef.current(stepRef.current)
      })
    },
    [speak],
  )
  commitAnswerRef.current = commitAnswer

  const spellLoop = useCallback(
    (step: VoiceStep, buffer: string[]) => {
      if (!runningRef.current) return
      listenOnce(
        (transcript) => {
          const word = transcript.toLowerCase().trim()

          if (containsAny(word, FINAL_WORDS)) {
            const value = buffer.join('')
            const finalValue = step.transform ? step.transform(value) : value
            if (step.validate && !step.validate(finalValue)) {
              speak(
                `That's put together as ${finalValue}, but it doesn't look quite complete for your ${step.label}. Let's keep spelling — go ahead.`,
                () => spellLoopRef.current(step, buffer),
              )
              return
            }
            commitAnswerRef.current(step, finalValue)
            return
          }

          if (word === 'delete' || word === 'backspace' || word.includes('remove')) {
            buffer.pop()
            speak('Okay, removed. Go ahead with the next letter.', () =>
              spellLoopRef.current(step, buffer),
            )
            return
          }

          if (word.includes('start over') || word.includes('clear')) {
            speak('Okay, starting this field over. Go ahead and spell it from the beginning.', () =>
              spellLoopRef.current(step, []),
            )
            return
          }

          const char = PHONETIC_MAP[word] || (word.length === 1 ? word : null)
          if (char !== null && char !== undefined) {
            buffer.push(char)
            speak(char, () => spellLoopRef.current(step, buffer))
          } else {
            speak("Sorry, I didn't quite catch that letter. Could you say it once more?", () =>
              spellLoopRef.current(step, buffer),
            )
          }
        },
        () => {
          if (!runningRef.current) return
          speak('Still listening, whenever you are ready with the next letter.', () =>
            spellLoopRef.current(step, buffer),
          )
        },
      )
    },
    [listenOnce, speak],
  )
  spellLoopRef.current = spellLoop

  const spellMode = useCallback(
    (step: VoiceStep) => {
      speak(
        `Okay, let's spell it out together, one letter at a time. Say "at" for the at sign, "dot" for a period, "delete" to remove the last letter, and "final" whenever you are done.`,
        () => spellLoopRef.current(step, []),
      )
    },
    [speak],
  )
  spellModeRef.current = spellMode

  const awaitDecision = useCallback(
    (step: VoiceStep, candidateValue: string) => {
      if (!runningRef.current) return
      listenOnce(
        (reply) => {
          if (containsAny(reply, FINAL_WORDS)) {
            commitAnswerRef.current(step, candidateValue)
          } else if (containsAny(reply, SPELL_WORDS)) {
            spellModeRef.current(step)
          } else if (containsAny(reply, REDO_WORDS)) {
            speak("No problem, let's try that again.", () => gentleListenRef.current(step))
          } else {
            handleAttemptRef.current(step, reply)
          }
        },
        () => {
          if (!runningRef.current) return
          speak(
            "Take your time — just say 'final' when you are happy with it, or try again.",
            () => awaitDecisionRef.current(step, candidateValue),
          )
        },
      )
    },
    [listenOnce, speak],
  )
  awaitDecisionRef.current = awaitDecision

  const handleAttempt = useCallback(
    (step: VoiceStep, rawTranscript: string) => {
      if (containsAny(rawTranscript, SPELL_WORDS)) {
        spellModeRef.current(step)
        return
      }

      const value = step.transform ? step.transform(rawTranscript) : rawTranscript
      const valid = !step.validate || step.validate(value)

      const spokenBack = step.speakAs ? step.speakAs(value) : value
      const suggestion = step.spellable
        ? `Say "final" if that is correct, "spell it" to spell it out letter by letter, or just say it again to redo it.`
        : `Say "final" if that is correct, or just say it again to redo it.`

      if (!valid && step.spellable) {
        speak(
          `I heard "${rawTranscript}", but I am not fully sure that is right for your ${step.label}. Would you like to spell it out instead? Just say "spell it", or try saying it again.`,
          () => awaitDecisionRef.current(step, value),
        )
        return
      }

      speak(`I heard: ${spokenBack}. ${suggestion}`, () =>
        awaitDecisionRef.current(step, value),
      )
    },
    [speak],
  )
  handleAttemptRef.current = handleAttempt

  const gentleListen = useCallback(
    (step: VoiceStep) => {
      if (!runningRef.current) return
      listenOnce(
        (transcript) => {
          updateStatus(transcript)
          handleAttemptRef.current(step, transcript)
        },
        () => {
          if (!runningRef.current) return
          speak("Take your time. I am still listening whenever you are ready.", () =>
            gentleListenRef.current(step),
          )
        },
      )
    },
    [listenOnce, speak, updateStatus],
  )
  gentleListenRef.current = gentleListen

  const askStep = useCallback(
    (idx: number) => {
      if (!runningRef.current) return
      if (idx >= STEPS.length) {
        runningRef.current = false
        setActive(false)
        setSpokenField(null)
        setStatus(null)
        speak(
          'All done — thank you for your patience. Please take a moment to review the form, then submit whenever you are ready.',
        )
        return
      }
      const step = STEPS[idx]
      setSpokenField(step.field)
      updateStatus('—')
      speak(step.prompt, () => {
        if (runningRef.current) gentleListenRef.current(step)
      })
    },
    [speak, updateStatus],
  )
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
    speak(
      "Let's fill out the form together, one step at a time. There's no rush at all — take as many tries as you need on each question. After each answer, say \"final\" when you are happy with it.",
      () => askStepRef.current(0),
    )
  }, [speak])

  useEffect(() => {
    return () => {
      runningRef.current = false
      isBusyRef.current = false
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
      }
      window.speechSynthesis.cancel()
    }
  }, [])

  return { active, spokenField, status, start, stop, repeat, skip }
}
