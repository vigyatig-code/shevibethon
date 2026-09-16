import { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FileText, CheckCircle2, AlertCircle, Loader2, Lock, Camera, X, MapPin, Navigation, Check, LogIn, Mic, Square } from 'lucide-react'
import { supabase, CATEGORIES, generateTrackingNumber, assessSeverity, uploadComplaintPhoto, type ComplaintInput } from '../lib/supabase'
import TrueFocus from '../components/TrueFocus'
import { useAuth } from '../lib/auth'
import { useVoiceForm } from '../lib/useVoiceForm'

export default function FileComplaint() {
  const navigate = useNavigate()
  const { isSignedIn, profile, needsProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<ComplaintInput>({
    name: profile?.full_name || '',
    email: '',
    category: CATEGORIES[0],
    subject: '',
    description: '',
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ trackingNumber: string } | null>(null)

  type LocationState = 'idle' | 'requesting' | 'granted' | 'denied' | 'error'
  const [locationState, setLocationState] = useState<LocationState>('idle')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState('error')
      return
    }
    setLocationState('requesting')
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setCoords({ lat: latitude, lng: longitude })
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept': 'application/json' } }
          )
          if (res.ok) {
            const data = await res.json()
            const addr = data.display_name || data.address?.suburb || data.address?.city || ''
            setLocationName(addr)
          }
        } catch {
          // reverse geocode failed — user can type manually
        }
        setLocationState('granted')
        setLocationLoading(false)
      },
      (err) => {
        setLocationState('denied')
        setLocationLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          // user denied — they can type manually
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    )
  }, [])

  const voice = useVoiceForm((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  })

  const completedSteps = [
    !!(form.name && form.email),
    !!(form.category && form.subject),
    !!form.description,
    !!photo,
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

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

      const { error: insertError } = await supabase
        .from('complaints')
        .insert({
          ...form,
          tracking_number: trackingNumber,
          status: 'Pending',
          priority: 'Normal',
          severity: severity,
          photo_url: photoUrl,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          location_name: locationName.trim() || null,
        })

      if (insertError) throw insertError

      setSuccess({ trackingNumber })
      setSubmitting(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit complaint. Please try again.')
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
          <h2>Complaint Filed Successfully!</h2>
          <p>Your complaint has been registered and is now under review. No one can alter the details you submitted.</p>
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
              View Complaint Status
            </button>
            <Link to="/file" className="btn btn-outline" onClick={() => setSuccess(null)}>
              File Another
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="page-container">
        <div className="form-page-header">
          <div className="form-page-icon">
            <FileText size={32} />
          </div>
          <h1>Report an Issue</h1>
          <p>You need to sign in before you can file a complaint.</p>
        </div>
        <div className="auth-gate-card">
          <div className="auth-gate-icon">
            <Lock size={40} />
          </div>
          <h2>Sign In Required</h2>
          <p>To report a civic issue, please sign in with your phone number. This helps us verify reports and keep track of updates for you.</p>
          <Link to="/" className="btn btn-primary btn-lg">
            <LogIn size={20} />
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (needsProfile) {
    return (
      <div className="page-container">
        <div className="form-page-header">
          <div className="form-page-icon">
            <FileText size={32} />
          </div>
          <h1>Report an Issue</h1>
          <p>Please complete your profile before filing a complaint.</p>
        </div>
        <div className="auth-gate-card">
          <div className="auth-gate-icon">
            <FileText size={40} />
          </div>
          <h2>Complete Your Profile</h2>
          <p>We need a few more details to set up your account. Please complete the sign-in process from the home page.</p>
          <Link to="/" className="btn btn-primary btn-lg">
            <LogIn size={20} />
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="form-page-header">
        <div className="form-page-icon">
          <FileText size={32} />
        </div>
        <h1>Report an Issue</h1>
        <div className="form-page-tagline">
          <TrueFocus
            sentence="We are focusing on your problems"
            borderColor="#a96545"
            glowColor="rgba(169, 101, 69, 0.6)"
            blurAmount={3}
            animationDuration={0.8}
            pauseBetweenAnimations={0.8}
          />
        </div>
        <p>Fill out the form below to submit your complaint. All fields are required.</p>
      </div>

      <div className="info-banner">
        <Lock size={18} />
        <span>Once submitted, your complaint is permanently registered and cannot be edited or deleted by anyone.</span>
      </div>

      <form className="complaint-form" onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="progress-wrap">
          <div className={`progress-seg ${completedSteps[0] ? 'filled' : ''}`}><div className="fill" /></div>
          <div className={`progress-seg ${completedSteps[1] ? 'filled' : ''}`}><div className="fill" /></div>
          <div className={`progress-seg ${completedSteps[2] ? 'filled' : ''}`}><div className="fill" /></div>
          <div className={`progress-seg ${completedSteps[3] ? 'filled' : ''}`}><div className="fill" /></div>
        </div>
        <div className="progress-labels">
          <span className={completedSteps[0] ? 'active' : ''}>Contact</span>
          <span className={completedSteps[1] ? 'active' : ''}>Details</span>
          <span className={completedSteps[2] ? 'active' : ''}>Description</span>
          <span className={completedSteps[3] ? 'active' : ''}>Photo</span>
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

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={form.category} onChange={handleChange} required>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Brief title of your complaint"
              required
              maxLength={200}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Provide a detailed description of your complaint..."
            required
            rows={6}
            maxLength={5000}
          />
          <span className="char-count">{form.description.length} / 5000</span>
        </div>

        <div className="form-group">
          <label>Location</label>
          {locationState === 'idle' && (
            <div className="location-prompt">
              <button type="button" className="btn btn-ghost" onClick={requestLocation}>
                <Navigation size={18} />
                Share my location
              </button>
              <span className="location-hint">Or enter an address manually below</span>
            </div>
          )}
          {locationState === 'requesting' && (
            <div className="location-loading">
              <Loader2 size={18} className="spin" />
              <span>Detecting your location...</span>
            </div>
          )}
          {locationState === 'granted' && coords && (
            <div className="location-granted">
              <div className="location-granted-row">
                <Check size={16} />
                <span>Location detected</span>
                <button type="button" className="location-retry" onClick={requestLocation}>
                  Retry
                </button>
              </div>
              {locationLoading && <span className="location-hint">Looking up address...</span>}
            </div>
          )}
          {locationState === 'denied' && (
            <div className="location-denied">
              <AlertCircle size={16} />
              <span>Location access denied. Enter your address manually below.</span>
              <button type="button" className="location-retry" onClick={requestLocation}>
                Try again
              </button>
            </div>
          )}
          {locationState === 'error' && (
            <div className="location-denied">
              <AlertCircle size={16} />
              <span>Geolocation not supported. Enter your address manually below.</span>
            </div>
          )}
          <input
            type="text"
            name="locationName"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Enter your area or address (e.g. Indiranagar, Bengaluru)"
            maxLength={300}
            className="location-input"
          />
          {coords && (
            <span className="location-coords">
              <MapPin size={12} />
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </span>
          )}
        </div>

        <div className="form-group">
          <label>Add a Photo (Optional)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="photo-input-hidden"
            id="photo-upload"
          />
          {photoPreview ? (
            <div className="photo-preview-wrapper">
              <img src={photoPreview} alt="Complaint preview" className="photo-preview-img" />
              <button type="button" className="photo-remove-btn" onClick={removePhoto}>
                <X size={18} />
                Remove Photo
              </button>
            </div>
          ) : (
            <label htmlFor="photo-upload" className="photo-upload-area">
              <Camera size={28} />
              <span className="photo-upload-text">Click to upload a photo</span>
              <span className="photo-upload-hint">JPG, PNG, or GIF up to 5 MB</span>
            </label>
          )}
        </div>

        {voice.active && (
          <div className="voice-fill-banner">
            <Mic size={18} className="pulse" />
            <span>Listening for: <strong>{voice.spokenField}</strong></span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={voice.stop}>
              <Square size={14} />
              Stop
            </button>
          </div>
        )}

        <div className="form-actions">
          {!voice.active && (
            <button type="button" className="btn btn-ghost" onClick={voice.start}>
              <Mic size={18} />
              Fill by Voice
            </button>
          )}
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
                <FileText size={20} />
                Submit Complaint
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
