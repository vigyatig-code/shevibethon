import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Search, AlertCircle, Loader2, ArrowLeft, Clock, CheckCircle2, XCircle, Eye, Lock, Bell, BellOff } from 'lucide-react'
import { supabase, type Complaint, STATUSES, SEVERITY_COLORS } from '../lib/supabase'
import Galaxy from '../components/Galaxy'

const STATUS_META: Record<string, { color: string; icon: typeof Clock }> = {
  'Pending': { color: 'status-pending', icon: Clock },
  'Under Review': { color: 'status-review', icon: Eye },
  'Resolved': { color: 'status-resolved', icon: CheckCircle2 },
  'Rejected': { color: 'status-rejected', icon: XCircle },
}

export default function TrackComplaint() {
  const { trackingNumber: urlTrackingNumber } = useParams()
  const [input, setInput] = useState(urlTrackingNumber ?? '')
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (urlTrackingNumber) {
      setInput(urlTrackingNumber)
      doSearch(urlTrackingNumber)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTrackingNumber])

  useEffect(() => {
    if (complaint) {
      const stored = localStorage.getItem(`notif-${complaint.tracking_number}`)
      setSubscribed(stored === 'true')
    }
  }, [complaint])

  const doSearch = async (number: string) => {
    setLoading(true)
    setError(null)
    setComplaint(null)
    setSearched(true)

    try {
      const { data, error: queryError } = await supabase
        .from('complaints')
        .select('*')
        .eq('tracking_number', number.toUpperCase().trim())
        .maybeSingle()

      if (queryError) throw queryError

      if (data) {
        setComplaint(data as Complaint)
      } else {
        setError('No complaint found with that tracking number. Please check and try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSubscription = () => {
    if (!complaint) return
    const key = `notif-${complaint.tracking_number}`
    const newState = !subscribed
    setSubscribed(newState)
    localStorage.setItem(key, newState ? 'true' : 'false')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      doSearch(input)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const formatDateShort = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="page-container track-page">
      <div className="track-galaxy-bg" aria-hidden="true">
        <Galaxy
          density={1.5}
          hueShift={0}
          glowIntensity={0.18}
          saturation={0}
          twinkleIntensity={0.35}
          rotationSpeed={0.06}
          starSpeed={0.3}
          speed={0.6}
          mouseInteraction={true}
          mouseRepulsion={true}
          repulsionStrength={1.0}
          transparent={false}
        />
      </div>
      <div className="track-content">
      <div className="form-page-header">
        <div className="form-page-icon">
          <Search size={32} />
        </div>
        <h1>Track Your Complaint</h1>
        <p>Enter your tracking number to check the current status of your complaint.</p>
      </div>

      <form className="track-form" onSubmit={handleSubmit}>
        <div className="track-input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. CMP-ABCD1234"
            className="track-input"
            required
          />
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={20} className="spin" />
                Searching...
              </>
            ) : (
              <>
                <Search size={20} />
                Track
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {complaint && (
        <div className="complaint-detail">
          <div className="detail-header">
            <div>
              <span className="detail-tracking">{complaint.tracking_number}</span>
              <h2>{complaint.subject}</h2>
            </div>
            {(() => {
              const meta = STATUS_META[complaint.status] ?? STATUS_META['Pending']
              const Icon = meta.icon
              return (
                <span className={`status-badge ${meta.color}`}>
                  <Icon size={18} />
                  {complaint.status}
                </span>
              )
            })()}
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Filed By</span>
              <span className="detail-value">{complaint.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{complaint.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Category</span>
              <span className="detail-value">{complaint.category}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Priority</span>
              <span className="detail-value">{complaint.priority}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Severity</span>
              <span className="detail-value">
                <span className="severity-tag" style={{ background: SEVERITY_COLORS[complaint.severity] || SEVERITY_COLORS['Medium'] }}>
                  {complaint.severity}
                </span>
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Filed On</span>
              <span className="detail-value">{formatDate(complaint.created_at)}</span>
            </div>
          </div>

          {complaint.photo_url && (
            <div className="detail-section">
              <h3>Attached Photo</h3>
              <img src={complaint.photo_url} alt="Complaint evidence" className="detail-photo" />
            </div>
          )}

          <div className="detail-section">
            <h3>Description</h3>
            <p>{complaint.description}</p>
          </div>

          <div className="status-timeline">
            <h3>Status Timeline</h3>
            <div className="timeline-vertical">
              {STATUSES.map((status) => {
                const meta = STATUS_META[status]
                const Icon = meta.icon
                const currentIndex = STATUSES.indexOf(complaint.status as typeof status)
                const thisIndex = STATUSES.indexOf(status)
                const isPassed = thisIndex <= currentIndex
                const isCurrent = status === complaint.status
                return (
                  <div
                    key={status}
                    className={`timeline-v-item ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}`}
                  >
                    <div className="timeline-v-dot" />
                    <div className="timeline-v-content">
                      <div className="timeline-v-title">
                        <Icon size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                        {status}
                      </div>
                      <div className="timeline-v-date">
                        {isCurrent
                          ? `Current status — updated ${formatDateShort(complaint.updated_at)}`
                          : isPassed
                            ? `Completed ${formatDateShort(complaint.created_at)}`
                            : 'Pending'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="detail-section" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className={`btn ${subscribed ? 'btn-outline' : 'btn-primary'}`}
              onClick={toggleSubscription}
            >
              {subscribed ? <BellOff size={18} /> : <Bell size={18} />}
              {subscribed ? 'Unsubscribe from Notifications' : 'Subscribe to Notifications'}
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
              {subscribed
                ? 'You will receive updates when the status of this complaint changes.'
                : 'Get notified by email when this complaint status changes.'}
            </span>
          </div>

          <div className="immutability-note">
            <Lock size={16} />
            <span>This complaint is permanently recorded and cannot be modified by anyone. Status updates are managed by the review team.</span>
          </div>

          <div className="detail-back">
            <Link to="/track" className="btn btn-ghost">
              <ArrowLeft size={18} />
              Track Another
            </Link>
          </div>
        </div>
      )}

      {!complaint && !error && !loading && searched && (
        <div className="empty-state">
          <Search size={48} />
          <p>Enter a tracking number above to find your complaint.</p>
        </div>
      )}

      {!searched && (
        <div className="empty-state">
          <Search size={48} />
          <p>Enter a tracking number above to find your complaint.</p>
        </div>
      )}
      </div>
    </div>
  )
}
