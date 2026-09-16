import { useState, useEffect, useCallback } from 'react'
import { X, Phone, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Calendar, User } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

type Step = 'phone' | 'otp' | 'profile' | 'success'
type Gender = 'male' | 'female' | 'non-binary' | 'other' | 'rather_not_say'

export default function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signInWithPhone, verifyOtp, refreshProfile } = useAuth()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  useEffect(() => {
    if (open) {
      setStep('phone')
      setPhone('')
      setOtp('')
      setFullName('')
      setDob('')
      setGender('')
      setError(null)
      setLoading(false)
      setResendCooldown(0)
    }
  }, [open])

  const handleSendOtp = useCallback(async () => {
    setError(null)
    const cleaned = phone.replace(/\s/g, '')
    if (!/^\+\d{10,15}$/.test(cleaned)) {
      setError('Enter a valid phone number with country code (e.g. +919876543210).')
      return
    }
    setLoading(true)
    const { error } = await signInWithPhone(cleaned)
    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    setPhone(cleaned)
    setStep('otp')
    setResendCooldown(30)
  }, [phone, signInWithPhone])

  const handleResendOtp = useCallback(async () => {
    setError(null)
    setLoading(true)
    const { error } = await signInWithPhone(phone)
    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    setResendCooldown(30)
  }, [phone, signInWithPhone])

  const handleVerifyOtp = useCallback(async () => {
    setError(null)
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from your SMS.')
      return
    }
    setLoading(true)
    const { error } = await verifyOtp(phone, otp)
    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    setStep('profile')
  }, [otp, phone, verifyOtp])

  const handleCompleteProfile = useCallback(async () => {
    setError(null)
    if (!dob) {
      setError('Please select your date of birth.')
      return
    }
    if (!gender) {
      setError('Please select your gender.')
      return
    }
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Session expired. Please start over.')
      setLoading(false)
      setStep('phone')
      return
    }
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        date_of_birth: dob,
        gender,
        full_name: fullName.trim() || null,
      })
      .eq('id', session.user.id)

    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    await refreshProfile()
    setStep('success')
  }, [dob, gender, fullName, refreshProfile])

  if (!open) return null

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {step === 'phone' && (
          <>
            <div className="auth-modal-header">
              <div className="auth-modal-icon"><Phone size={28} /></div>
              <h2>Sign In</h2>
              <p>Enter your phone number. We'll send a secure verification code via SMS.</p>
            </div>
            <div className="auth-modal-body">
              {error && <div className="auth-error"><AlertCircle size={18} /><span>{error}</span></div>}
              <div className="auth-field">
                <label htmlFor="auth-phone">Phone Number</label>
                <input
                  id="auth-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  autoComplete="tel"
                  autoFocus
                />
                <span className="auth-field-hint">Include your country code (e.g. +91 for India).</span>
              </div>
              <button className="auth-btn-primary" onClick={handleSendOtp} disabled={loading}>
                {loading ? <><Loader2 size={18} className="spin" /> Sending...</> : <>Send Verification Code</>}
              </button>
              <div className="auth-security-note">
                <ShieldCheck size={14} />
                <span>Your number is verified securely via OTP. We never share your details.</span>
              </div>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="auth-modal-header">
              <div className="auth-modal-icon"><ShieldCheck size={28} /></div>
              <h2>Verify Your Number</h2>
              <p>Enter the 6-digit code we sent to <strong>{phone}</strong>.</p>
            </div>
            <div className="auth-modal-body">
              {error && <div className="auth-error"><AlertCircle size={18} /><span>{error}</span></div>}
              <div className="auth-field">
                <label htmlFor="auth-otp">Verification Code</label>
                <input
                  id="auth-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="auth-otp-input"
                  autoFocus
                />
              </div>
              <button className="auth-btn-primary" onClick={handleVerifyOtp} disabled={loading}>
                {loading ? <><Loader2 size={18} className="spin" /> Verifying...</> : <>Verify & Continue</>}
              </button>
              <div className="auth-resend-row">
                {resendCooldown > 0 ? (
                  <span className="auth-resend-cooldown">Resend code in {resendCooldown}s</span>
                ) : (
                  <button className="auth-resend-btn" onClick={handleResendOtp} disabled={loading}>
                    Didn't get it? Resend code
                  </button>
                )}
              </div>
              <button className="auth-back-btn" onClick={() => { setStep('phone'); setError(null) }}>
                Change number
              </button>
            </div>
          </>
        )}

        {step === 'profile' && (
          <>
            <div className="auth-modal-header">
              <div className="auth-modal-icon"><User size={28} /></div>
              <h2>Complete Your Profile</h2>
              <p>A few details to finish setting up your account.</p>
            </div>
            <div className="auth-modal-body">
              {error && <div className="auth-error"><AlertCircle size={18} /><span>{error}</span></div>}
              <div className="auth-field">
                <label htmlFor="auth-name">Full Name <span className="auth-optional">(optional)</span></label>
                <input
                  id="auth-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                  autoFocus
                />
              </div>
              <div className="auth-field">
                <label htmlFor="auth-dob">Date of Birth</label>
                <div className="auth-input-with-icon">
                  <Calendar size={18} />
                  <input
                    id="auth-dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="auth-field">
                <label>Gender</label>
                <div className="auth-gender-options">
                  {(['male', 'female', 'non-binary', 'other', 'rather_not_say'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`auth-gender-btn ${gender === g ? 'selected' : ''}`}
                      onClick={() => setGender(g)}
                    >
                      {g === 'rather_not_say' ? 'Rather not say' : g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <button className="auth-btn-primary" onClick={handleCompleteProfile} disabled={loading}>
                {loading ? <><Loader2 size={18} className="spin" /> Saving...</> : <>Complete Sign In</>}
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="auth-success-screen">
            <div className="auth-success-icon">
              <CheckCircle2 size={64} />
            </div>
            <h2>Sign In Successful!</h2>
            <p>You're now signed in. You can report issues and track their status.</p>
            <button className="auth-btn-primary" onClick={onClose}>
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
