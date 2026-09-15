import { useState, useRef, useEffect, useCallback } from 'react'
import { X, MapPin, Heart, Bell, Info, Plus, Search } from 'lucide-react'
import {
  demoPins,
  communityPinStatuses,
  pinStatusColors,
  communityTopics,
  communityAreas,
  communityFilters,
  type CommunityPin,
} from '../lib/civicContent'
import { useReducedMotion } from '../lib/hooks'

// CommunityVoice: an interactive widget combining a stylized SVG map
// with a suggestion system. Users can browse pins, filter, support
// ideas, and drop new suggestions via a placement + form flow.
// Demo data is stored locally and clearly labeled.

interface NewSuggestion {
  title: string
  description: string
  topic: string
  area: string
  noPrivateInfo: boolean
}

const emptyForm: NewSuggestion = {
  title: '',
  description: '',
  topic: communityTopics[0],
  area: communityAreas[0],
  noPrivateInfo: false,
}

export default function CommunityVoice() {
  const [pins, setPins] = useState<CommunityPin[]>(demoPins)
  const [selectedPin, setSelectedPin] = useState<CommunityPin | null>(null)
  const [hoveredPin, setHoveredPin] = useState<string | null>(null)
  const [filter, setFilter] = useState('All voices')
  const [searchQuery, setSearchQuery] = useState('')
  const [placementMode, setPlacementMode] = useState(false)
  const [pendingCoords, setPendingCoords] = useState<{ x: number; y: number } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<NewSuggestion>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<CommunityPin | null>(null)
  const [supportedPins, setSupportedPins] = useState<Set<string>>(new Set())
  const [followedPins, setFollowedPins] = useState<Set<string>>(new Set())
  const mapRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  // Focus trap for the modal
  useEffect(() => {
    if (!showForm) return
    const el = dialogRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>('input, textarea, select, button, [tabindex]')
    if (focusable[0]) focusable[0].focus()
    const trap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowForm(false)
        setPendingCoords(null)
        return
      }
      if (e.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [showForm])

  const filteredPins = pins.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.area.toLowerCase().includes(searchQuery.toLowerCase())

    let matchesFilter = true
    switch (filter) {
      case 'Newest':
        matchesFilter = true
        break
      case 'Most supported':
        matchesFilter = true
        break
      case 'Under review':
        matchesFilter = p.status === 'Being reviewed'
        break
      case 'In progress':
        matchesFilter = p.status === 'In progress' || p.status === 'In planning'
        break
      case 'Delivered':
        matchesFilter = p.status === 'Delivered'
        break
      default:
        matchesFilter = true
    }

    return matchesSearch && matchesFilter
  })

  const sortedPins = [...filteredPins].sort((a, b) => {
    if (filter === 'Most supported') return b.supporters - a.supporters
    if (filter === 'Newest') return new Date(b.date).getTime() - new Date(a.date).getTime()
    return 0
  })

  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!placementMode || !mapRef.current) return
    const rect = mapRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPendingCoords({ x, y })
    setShowForm(true)
    setPlacementMode(false)
  }, [placementMode])

  const handlePinClick = (pin: CommunityPin) => {
    setSelectedPin(pin)
  }

  const handlePinKeyDown = (e: React.KeyboardEvent, pin: CommunityPin) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handlePinClick(pin)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.title.trim()) {
      setFormError('Please add a title for your suggestion.')
      return
    }
    if (formData.title.length > 70) {
      setFormError('Title must be 70 characters or fewer.')
      return
    }
    if (formData.description.length > 300) {
      setFormError('Description must be 300 characters or fewer.')
      return
    }
    if (!formData.noPrivateInfo) {
      setFormError('Please confirm your submission contains no private or sensitive information.')
      return
    }
    if (!pendingCoords) {
      setFormError('Please choose a location on the map first.')
      return
    }

    const newPin: CommunityPin = {
      id: `p${Date.now()}`,
      title: formData.title.trim(),
      description: formData.description.trim() || 'No description provided.',
      area: formData.area,
      topic: formData.topic,
      status: 'New idea',
      supporters: 0,
      date: new Date().toISOString().split('T')[0],
      x: pendingCoords.x,
      y: pendingCoords.y,
    }

    setPins((prev) => [...prev, newPin])
    setSubmitted(newPin)
    setShowForm(false)
    setFormData(emptyForm)
    setPendingCoords(null)
  }

  const handleSupport = (pinId: string) => {
    setSupportedPins((prev) => {
      const next = new Set(prev)
      if (next.has(pinId)) {
        next.delete(pinId)
        setPins((prevPins) =>
          prevPins.map((p) => (p.id === pinId ? { ...p, supporters: p.supporters - 1 } : p))
        )
      } else {
        next.add(pinId)
        setPins((prevPins) =>
          prevPins.map((p) => (p.id === pinId ? { ...p, supporters: p.supporters + 1 } : p))
        )
      }
      return next
    })
  }

  const handleFollow = (pinId: string) => {
    setFollowedPins((prev) => {
      const next = new Set(prev)
      if (next.has(pinId)) next.delete(pinId)
      else next.add(pinId)
      return next
    })
  }

  const closeForm = () => {
    setShowForm(false)
    setPendingCoords(null)
    setFormData(emptyForm)
    setFormError(null)
  }

  const closeSubmitted = () => {
    setSubmitted(null)
    setSelectedPin(null)
  }

  const addAnother = () => {
    setSubmitted(null)
    setPlacementMode(true)
  }

  const totalContributions = pins.length

  return (
    <section className="civic-voice" aria-label="Community Voice">
      <div className="civic-section-inner">
        <div className="civic-section-header">
          <h2 className="civic-section-title">What should we improve next?</h2>
          <p className="civic-section-subtitle">
            Place your idea where it matters. Explore local suggestions, add your voice, and follow progress from first spark to real-world change.
          </p>
        </div>

        <div className="civic-voice-layout">
          {/* Map column — 60% on desktop */}
          <div className="civic-voice-map-col">
            <div className="civic-voice-map-header">
              <div className="civic-voice-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search suggestions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search community suggestions"
                />
              </div>
              <button
                className={`civic-btn civic-btn-primary civic-btn-sm ${placementMode ? 'civic-btn-active' : ''}`}
                onClick={() => setPlacementMode((p) => !p)}
              >
                <Plus size={16} />
                {placementMode ? 'Cancel placement' : 'Drop a suggestion'}
              </button>
            </div>

            {placementMode && (
              <div className="civic-voice-placement-hint" role="status">
                Choose a place on the map, then tell us what would make it better.
              </div>
            )}

            <div
              ref={mapRef}
              className={`civic-voice-map ${placementMode ? 'placement-mode' : ''}`}
              onClick={handleMapClick}
              role="application"
              aria-label="Stylized community map. Click to place a suggestion."
            >
              {/* Stylized SVG abstract map */}
              <svg className="civic-voice-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <radialGradient id="mapGlow" cx="50%" cy="40%">
                    <stop offset="0%" stopColor="#a96545" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f4ebdd" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="100" height="100" fill="url(#mapGlow)" />
                {/* Abstract neighborhood shapes */}
                <path d="M10,20 Q30,10 50,25 L60,40 Q40,50 20,45 Z" fill="#a96545" opacity="0.1" stroke="#6f4e37" strokeWidth="0.3" />
                <path d="M50,25 Q70,20 85,35 L80,55 Q60,50 50,40 Z" fill="#a96545" opacity="0.08" stroke="#6f4e37" strokeWidth="0.3" />
                <path d="M20,45 Q40,50 50,40 L60,60 Q40,75 25,70 Z" fill="#a96545" opacity="0.07" stroke="#6f4e37" strokeWidth="0.3" />
                <path d="M60,60 Q75,55 85,35 L90,70 Q70,85 60,75 Z" fill="#a96545" opacity="0.09" stroke="#6f4e37" strokeWidth="0.3" />
                {/* Path lines */}
                <path d="M5,50 Q30,45 50,55 Q70,60 95,50" fill="none" stroke="#c4976a" strokeWidth="0.4" opacity="0.25" strokeDasharray="2,2" />
                <path d="M50,5 Q45,30 55,55 Q60,80 50,95" fill="none" stroke="#c4976a" strokeWidth="0.4" opacity="0.2" strokeDasharray="2,2" />
              </svg>

              {/* Pins */}
              {pins.map((pin) => (
                <button
                  key={pin.id}
                  className={`civic-voice-pin ${selectedPin?.id === pin.id ? 'selected' : ''} ${!reduced ? 'civic-voice-pin-pulse' : ''}`}
                  style={{
                    left: `${pin.x}%`,
                    top: `${pin.y}%`,
                    '--pin-color': pinStatusColors[pin.status] ?? '#c4976a',
                  } as React.CSSProperties}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePinClick(pin)
                  }}
                  onKeyDown={(e) => handlePinKeyDown(e, pin)}
                  onMouseEnter={() => setHoveredPin(pin.id)}
                  onMouseLeave={() => setHoveredPin(null)}
                  onFocus={() => setHoveredPin(pin.id)}
                  onBlur={() => setHoveredPin(null)}
                  aria-label={`${pin.title}, ${pin.area}, ${pin.status}`}
                >
                  {hoveredPin === pin.id && (
                    <span className="civic-voice-pin-tooltip" role="tooltip">
                      <strong>{pin.title}</strong>
                      <span>{pin.area} — {pin.status}</span>
                    </span>
                  )}
                </button>
              ))}

              {/* Pending placement pin */}
              {pendingCoords && (
                <div
                  className="civic-voice-pin civic-voice-pin-pending"
                  style={{ left: `${pendingCoords.x}%`, top: `${pendingCoords.y}%` }}
                  aria-hidden="true"
                />
              )}

              {placementMode && <div className="civic-voice-crosshair" aria-hidden="true" />}
            </div>

            {/* Legend */}
            <div className="civic-voice-legend" aria-label="Pin color legend">
              {communityPinStatuses.map((status) => (
                <div key={status} className="civic-voice-legend-item">
                  <span className="civic-voice-legend-dot" style={{ background: pinStatusColors[status] }} />
                  <span>{status}</span>
                </div>
              ))}
            </div>

            <div className="civic-voice-contribution">
              <span>{totalContributions} community contributions</span>
              <span className="civic-demo-tag">Demo data</span>
            </div>
          </div>

          {/* Detail panel column — 40% on desktop */}
          <div className="civic-voice-panel-col">
            {/* Filters */}
            <div className="civic-voice-filters" role="tablist" aria-label="Filter suggestions">
              {communityFilters.map((f) => (
                <button
                  key={f}
                  className={`civic-voice-filter ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                  role="tab"
                  aria-selected={filter === f}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Selected pin detail */}
            {selectedPin ? (
              <div className="civic-voice-detail" role="region" aria-label="Suggestion details">
                <div className="civic-voice-detail-header">
                  <h3 className="civic-voice-detail-title">{selectedPin.title}</h3>
                  <button className="civic-voice-detail-close" onClick={() => setSelectedPin(null)} aria-label="Close detail">
                    <X size={18} />
                  </button>
                </div>
                <p className="civic-voice-detail-desc">{selectedPin.description}</p>
                <div className="civic-voice-detail-meta">
                  <span className="civic-voice-detail-area"><MapPin size={14} /> {selectedPin.area}</span>
                  <span className="civic-voice-detail-topic">{selectedPin.topic}</span>
                  <span className="civic-voice-detail-date">Added {new Date(selectedPin.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="civic-voice-detail-status">
                  <span className="civic-voice-status-badge" style={{ background: pinStatusColors[selectedPin.status] ?? '#c4976a' }}>
                    {selectedPin.status}
                  </span>
                  <span className="civic-voice-supporters">
                    <Heart size={14} /> {selectedPin.supporters} supporters
                  </span>
                </div>
                <div className="civic-voice-detail-actions">
                  <button
                    className={`civic-btn civic-btn-sm ${supportedPins.has(selectedPin.id) ? 'civic-btn-supported' : 'civic-btn-primary'}`}
                    onClick={() => handleSupport(selectedPin.id)}
                  >
                    <Heart size={14} />
                    {supportedPins.has(selectedPin.id) ? 'Supporting' : 'Support this idea'}
                  </button>
                  <button
                    className={`civic-btn civic-btn-sm ${followedPins.has(selectedPin.id) ? 'civic-btn-followed' : 'civic-btn-secondary'}`}
                    onClick={() => handleFollow(selectedPin.id)}
                  >
                    <Bell size={14} />
                    {followedPins.has(selectedPin.id) ? 'Following' : 'Follow updates'}
                  </button>
                </div>
                {supportedPins.has(selectedPin.id) && (
                  <p className="civic-voice-support-note">
                    You are supporting this idea. Thank you for adding weight to a shared priority.
                    Support helps us understand community interest. Formal decisions follow the relevant consultation and public process.
                  </p>
                )}
                <a href="#" className="civic-voice-detail-link">See how decisions are made</a>
              </div>
            ) : (
              <>
                {/* Suggestion list */}
                <div className="civic-voice-list" role="list">
                  <h3 className="civic-voice-list-title">
                    {filter === 'All voices' ? 'Recent suggestions' : filter}
                  </h3>
                  {sortedPins.length === 0 ? (
                    <div className="civic-voice-empty">
                      <p>No matching ideas.</p>
                      <p className="civic-voice-empty-hint">Try another topic, neighborhood, or status.</p>
                    </div>
                  ) : (
                    sortedPins.slice(0, 6).map((pin) => (
                      <button
                        key={pin.id}
                        className="civic-voice-list-item"
                        onClick={() => handlePinClick(pin)}
                        role="listitem"
                      >
                        <span className="civic-voice-list-dot" style={{ background: pinStatusColors[pin.status] }} />
                        <div className="civic-voice-list-content">
                          <span className="civic-voice-list-title">{pin.title}</span>
                          <span className="civic-voice-list-meta">{pin.area} — {pin.supporters} supporters</span>
                        </div>
                        <span className="civic-voice-list-status">{pin.status}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            <a href="#" className="civic-voice-full-link">
              View full Community Voice page
            </a>
          </div>
        </div>
      </div>

      {/* Suggestion form modal */}
      {showForm && (
        <div className="civic-modal-overlay" onClick={closeForm}>
          <div
            ref={dialogRef}
            className="civic-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Add a community suggestion"
            aria-modal="true"
          >
            <div className="civic-modal-header">
              <h3>Add your voice</h3>
              <button className="civic-modal-close" onClick={closeForm} aria-label="Close form">
                <X size={20} />
              </button>
            </div>
            <form className="civic-modal-form" onSubmit={handleSubmit}>
              {formError && (
                <div className="civic-modal-error" role="alert">{formError}</div>
              )}
              <div className="civic-form-group">
                <label htmlFor="sugg-title">Suggestion title</label>
                <input
                  id="sugg-title"
                  type="text"
                  maxLength={70}
                  placeholder="Make this place better by..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                <span className="civic-form-count">{formData.title.length} / 70</span>
              </div>
              <div className="civic-form-group">
                <label htmlFor="sugg-desc">Description</label>
                <textarea
                  id="sugg-desc"
                  maxLength={300}
                  placeholder="Tell us what you would change, who it would help, and why it matters."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
                <span className="civic-form-count">{formData.description.length} / 300</span>
              </div>
              <div className="civic-form-row2">
                <div className="civic-form-group">
                  <label htmlFor="sugg-topic">Topic</label>
                  <select
                    id="sugg-topic"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  >
                    {communityTopics.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="civic-form-group">
                  <label htmlFor="sugg-area">Area</label>
                  <select
                    id="sugg-area"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  >
                    {communityAreas.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="civic-form-helper">
                <Info size={14} /> Choose a broad area. Please do not share your home address.
              </p>
              <label className="civic-form-checkbox">
                <input
                  type="checkbox"
                  checked={formData.noPrivateInfo}
                  onChange={(e) => setFormData({ ...formData, noPrivateInfo: e.target.checked })}
                />
                <span>I confirm this submission contains no private, emergency, or sensitive personal information.</span>
              </label>
              <p className="civic-form-helper">
                Your suggestion may be visible to other residents. Do not include personal or sensitive information.
              </p>
              <div className="civic-modal-actions">
                <button type="button" className="civic-btn civic-btn-secondary" onClick={closeForm}>Not now</button>
                <button type="submit" className="civic-btn civic-btn-primary">Add my voice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {submitted && (
        <div className="civic-modal-overlay" onClick={closeSubmitted}>
          <div
            className="civic-modal civic-modal-confirm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Suggestion submitted"
            aria-modal="true"
          >
            <div className="civic-confirm-icon">
              <MapPin size={32} />
            </div>
            <h3 className="civic-confirm-title">Your voice has been added to the community constellation.</h3>
            <p className="civic-confirm-text">
              Your suggestion is now visible as a new idea. Our team will review it against the relevant civic process, and we will share updates when its status changes.
            </p>
            <div className="civic-confirm-actions">
              <button className="civic-btn civic-btn-secondary" onClick={() => { setSelectedPin(submitted); closeSubmitted(); }}>
                View my suggestion
              </button>
              <button className="civic-btn civic-btn-primary" onClick={addAnother}>Add another idea</button>
            </div>
            <button className="civic-btn civic-btn-ghost" onClick={closeSubmitted}>Explore nearby voices</button>
          </div>
        </div>
      )}
    </section>
  )
}
