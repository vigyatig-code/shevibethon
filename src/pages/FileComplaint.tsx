import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FileText, CheckCircle2, AlertCircle, Loader2, Lock, Camera, X } from 'lucide-react'
import { supabase, CATEGORIES, generateTrackingNumber, assessSeverity, uploadComplaintPhoto, type ComplaintInput } from '../lib/supabase'
import TrueFocus from '../components/TrueFocus'

export default function FileComplaint() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<ComplaintInput>({
    name: '',
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

        <div className="form-actions">
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
