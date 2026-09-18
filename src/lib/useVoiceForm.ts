import { useRef, useState, useCallback, useEffect } from 'react'
import {
  type Language,
  type PromptMap,
  PROMPTS,
  LANG_CODES,
  FINAL_WORDS,
  REDO_WORDS,
  SPELL_WORDS,
  containsAny,
  pickVoice,
} from './voiceI18n'

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
  validate?: (value: string) => boolean
  transform?: (raw: string) => string
  speakAs?: (value: string) => string
  spellable?: boolean
}

function buildSteps(p: PromptMap): VoiceStep[] {
  return [
    {
      field: 'name',
      label: p.name.includes('नाम') ? 'नाम' : 'name',
      validate: undefined,
      transform: (t) => t.replace(/\b\w/g, (c) => c.toUpperCase()),
      spellable: true,
    },
    {
      field: 'email',
      label: p.email.includes('ईमेल') ? 'ईमेल पता' : 'email address',
      transform: parseSpokenEmail,
      validate: isValidEmail,
      spellable: true,
      speakAs: (v) => v.replace(/@/g, ' at ').replace(/\./g, ' dot '),
    },
    {
      field: 'subject',
      label: p.subject.includes('शीर्षक') ? 'शीर्षक' : 'subject',
      spellable: true,
    },
    {
      field: 'description',
      label: p.description.includes('वर्णन') ? 'विवरण' : 'description',
    },
  ]
}

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
  lang: Language = 'en',
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
  const langRef = useRef(lang)
  langRef.current = lang

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
  // Only call resume() — calling pause() then immediately resume() causes
  // the engine to restart with a distorted, pitch-shifted ("chipmunk") voice.
  useEffect(() => {
    keepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) {
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
    // rate and pitch must both be 1 (default) — values below 1 can cause
    // the browser to use a different audio processing path that distorts pitch.
    utterance.rate = 1
    utterance.pitch = 1
    utterance.lang = LANG_CODES[langRef.current]
    const preferred = pickVoice(voicesRef.current, langRef.current)
    if (preferred) utterance.voice = preferred

    let done = false
    const safety = setTimeout(() => {
      if (done) return
      done = true
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
    const steps = buildSteps(PROMPTS[langRef.current])
    const step = idx < steps.length ? steps[idx] : steps[steps.length - 1]
    const p = PROMPTS[langRef.current]
    const promptKey = step.field as keyof PromptMap
    setStatus({
      stepNum: idx + 1,
      totalSteps: steps.length,
      prompt: p[promptKey],
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
      rec.lang = LANG_CODES[langRef.current]
      rec.continuous = false
      rec.interimResults = false
      rec.maxAlternatives = 1

      rec.onresult = (e: any) => {
        if (settled) return
        settled = true
        isBusyRef.current = false
        const transcript = e.results[0][0].transcript.trim()
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
      const p = PROMPTS[langRef.current]
      onFillRef.current(step.field, value)
      speak(p.saved, () => {
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
      const p = PROMPTS[langRef.current]
      const finalWords = FINAL_WORDS[langRef.current]
      listenOnce(
        (transcript) => {
          const word = transcript.toLowerCase().trim()

          if (containsAny(word, finalWords)) {
            const value = buffer.join('')
            const finalValue = step.transform ? step.transform(value) : value
            if (step.validate && !step.validate(finalValue)) {
              speak(
                p.spellInvalid.replace('{val}', finalValue).replace('{label}', step.label),
                () => spellLoopRef.current(step, buffer),
              )
              return
            }
            commitAnswerRef.current(step, finalValue)
            return
          }

          if (word === 'delete' || word === 'backspace' || word.includes('remove') || word.includes('हटा')) {
            buffer.pop()
            speak(p.spellRemoved, () =>
              spellLoopRef.current(step, buffer),
            )
            return
          }

          if (word.includes('start over') || word.includes('clear') || word.includes('शुरू')) {
            speak(p.spellStartOver, () =>
              spellLoopRef.current(step, []),
            )
            return
          }

          const char = PHONETIC_MAP[word] || (word.length === 1 ? word : null)
          if (char !== null && char !== undefined) {
            buffer.push(char)
            speak(char, () => spellLoopRef.current(step, buffer))
          } else {
            speak(p.spellCatch, () =>
              spellLoopRef.current(step, buffer),
            )
          }
        },
        () => {
          if (!runningRef.current) return
          speak(p.stillListening, () =>
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
      const p = PROMPTS[langRef.current]
      speak(p.spellIntro, () => spellLoopRef.current(step, []))
    },
    [speak],
  )
  spellModeRef.current = spellMode

  const awaitDecision = useCallback(
    (step: VoiceStep, candidateValue: string) => {
      if (!runningRef.current) return
      const p = PROMPTS[langRef.current]
      const finalWords = FINAL_WORDS[langRef.current]
      const spellWords = SPELL_WORDS[langRef.current]
      const redoWords = REDO_WORDS[langRef.current]
      listenOnce(
        (reply) => {
          if (containsAny(reply, finalWords)) {
            commitAnswerRef.current(step, candidateValue)
          } else if (containsAny(reply, spellWords)) {
            spellModeRef.current(step)
          } else if (containsAny(reply, redoWords)) {
            speak(p.tryAgain, () => gentleListenRef.current(step))
          } else {
            handleAttemptRef.current(step, reply)
          }
        },
        () => {
          if (!runningRef.current) return
          speak(p.confirmTimeout, () => awaitDecisionRef.current(step, candidateValue))
        },
      )
    },
    [listenOnce, speak],
  )
  awaitDecisionRef.current = awaitDecision

  const handleAttempt = useCallback(
    (step: VoiceStep, rawTranscript: string) => {
      const p = PROMPTS[langRef.current]
      const spellWords = SPELL_WORDS[langRef.current]
      if (containsAny(rawTranscript, spellWords)) {
        spellModeRef.current(step)
        return
      }

      const value = step.transform ? step.transform(rawTranscript) : rawTranscript
      const valid = !step.validate || step.validate(value)

      const spokenBack = step.speakAs ? step.speakAs(value) : value
      const suggestion = step.spellable ? p.confirmSpellable : p.confirmGeneric

      if (!valid && step.spellable) {
        speak(
          p.heardInvalid.replace('{val}', rawTranscript).replace('{label}', step.label),
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
      const p = PROMPTS[langRef.current]
      listenOnce(
        (transcript) => {
          updateStatus(transcript)
          handleAttemptRef.current(step, transcript)
        },
        () => {
          if (!runningRef.current) return
          speak(p.stillListening, () =>
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
      const p = PROMPTS[langRef.current]
      const steps = buildSteps(p)
      if (idx >= steps.length) {
        runningRef.current = false
        setActive(false)
        setSpokenField(null)
        setStatus(null)
        speak(p.done)
        return
      }
      const step = steps[idx]
      setSpokenField(step.field)
      updateStatus('—')
      const promptKey = step.field as keyof PromptMap
      speak(p[promptKey], () => {
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
    const p = PROMPTS[langRef.current]
    speak(p.intro, () => askStepRef.current(0))
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
