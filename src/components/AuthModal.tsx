import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Mail, ShieldCheck, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  onAuthSuccess: (email: string) => void
}

type Screen = 'email' | 'code'

export default function AuthModal({ open, onClose, onAuthSuccess }: AuthModalProps) {
  const [screen, setScreen] = useState<Screen>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codeSent, setCodeSent] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setScreen('email')
    setEmail('')
    setCode('')
    setSending(false)
    setVerifying(false)
    setError(null)
    setCodeSent(false)
  }, [])

  useEffect(() => {
    if (open) {
      reset()
      setTimeout(() => emailRef.current?.focus(), 300)
    }
  }, [open, reset])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  const handleSendCode = async () => {
    setError(null)
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setSending(true)
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({ email })
      if (otpError) throw otpError
      setCodeSent(true)
      setScreen('code')
      setTimeout(() => codeRef.current?.focus(), 300)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send code. Please try again.'
      setError(msg)
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async () => {
    setError(null)
    if (code.length !== 6) {
      setError('Please enter the 6-digit code from your email.')
      return
    }
    setVerifying(true)
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      })
      if (verifyError) throw verifyError
      const userEmail = data.user?.email ?? email
      onAuthSuccess(userEmail)
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed. The code may be wrong or expired.'
      setError(msg)
    } finally {
      setVerifying(false)
    }
  }

  const handleBack = () => {
    setScreen('email')
    setCode('')
    setError(null)
    setCodeSent(false)
    setTimeout(() => emailRef.current?.focus(), 100)
  }

  if (!open) return null

  return (
    <div
      className="auth-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-heading"
    >
      <div ref={dialogRef} className="auth-modal">
        <button className="auth-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="auth-icon">
          {screen === 'email' ? <Mail size={28} /> : <ShieldCheck size={28} />}
        </div>

        <h3 id="auth-modal-heading" className="auth-heading">
          {screen === 'email' ? 'Sign Up / Sign In' : 'Enter Verification Code'}
        </h3>

        <p className="auth-subtitle">
          {screen === 'email'
            ? 'Enter your email and we&apos;ll send you a one-time code.'
            : codeSent
              ? 'Code sent, check your email.'
              : `We sent a 6-digit code to ${email}.`}
        </p>

        {screen === 'email' && (
          <div className="auth-field">
            <label htmlFor="auth-email" className="auth-label">Email Address</label>
            <input
              ref={emailRef}
              id="auth-email"
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
              disabled={sending}
              autoComplete="email"
            />
          </div>
        )}

        {screen === 'code' && (
          <div className="auth-field">
            <label htmlFor="auth-code" className="auth-label">6-Digit Code</label>
            <input
              ref={codeRef}
              id="auth-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="auth-input auth-code-input"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              disabled={verifying}
              autoComplete="one-time-code"
            />
          </div>
        )}

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {screen === 'code' && (
          <button className="auth-back" onClick={handleBack} disabled={verifying}>
            <ArrowLeft size={14} />
            Use a different email
          </button>
        )}

        <button
          className="auth-primary-btn"
          onClick={screen === 'email' ? handleSendCode : handleVerify}
          disabled={screen === 'email' ? sending : verifying}
        >
          {screen === 'email' ? (
            sending ? (
              <>
                <Loader2 size={18} className="auth-spinner" />
                Sending...
              </>
            ) : (
              'Send Code'
            )
          ) : verifying ? (
            <>
              <Loader2 size={18} className="auth-spinner" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Verify
            </>
          )}
        </button>
      </div>
    </div>
  )
}
