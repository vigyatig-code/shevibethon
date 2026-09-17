import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Loader2, Search, MapPin, X, Navigation } from 'lucide-react'
import { supabase, type Complaint } from '../lib/supabase'

const STATUS_BADGE_CLASS: Record<string, string> = {
  'Pending': 'open',
  'Under Review': 'review',
  'Resolved': 'resolved',
  'Rejected': 'rejected',
}

const STATUS_DOT_CLASS: Record<string, string> = {
  'Pending': 'open',
  'Under Review': 'progress',
  'Resolved': 'resolved',
  'Rejected': 'rejected',
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface GeocodedLocation {
  lat: number
  lng: number
  displayName: string
}

export default function ComplaintList() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const [locationQuery, setLocationQuery] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [activeLocation, setActiveLocation] = useState<GeocodedLocation | null>(null)
  const [radiusKm, setRadiusKm] = useState(10)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: queryError } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })

      if (queryError) throw queryError
      setComplaints((data ?? []) as Complaint[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaints.')
    } finally {
      setLoading(false)
    }
  }

  const geocodeLocation = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return

    setGeocoding(true)
    setGeoError(null)

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=1`,
        { headers: { 'Accept': 'application/json' } }
      )
      if (!res.ok) throw new Error('Geocoding service unavailable')

      const data = await res.json()
      if (!data || data.length === 0) {
        setGeoError('Location not found. Try a different place name or address.')
        setActiveLocation(null)
        return
      }

      setActiveLocation({
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      })
    } catch {
      setGeoError('Could not search for that location. Please try again.')
      setActiveLocation(null)
    } finally {
      setGeocoding(false)
    }
  }, [])

  const clearLocation = () => {
    setActiveLocation(null)
    setLocationQuery('')
    setGeoError(null)
  }

  const filtered = complaints.filter((c) => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter
    const matchesSearch =
      !search ||
      c.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())

    let matchesLocation = true
    let distance = 0
    if (activeLocation && c.latitude != null && c.longitude != null) {
      distance = haversine(activeLocation.lat, activeLocation.lng, c.latitude, c.longitude)
      matchesLocation = distance <= radiusKm
    } else if (activeLocation) {
      // If location filter is active but complaint has no coords, check location_name text match
      matchesLocation = !!c.location_name &&
        c.location_name.toLowerCase().includes(activeLocation.displayName.toLowerCase().split(',')[0].toLowerCase())
    }

    return matchesStatus && matchesCategory && matchesSearch && matchesLocation
  })

  const categories = Array.from(new Set(complaints.map((c) => c.category))).sort()

  const cardClass = (c: Complaint) => {
    const parts: string[] = ['complaint-card']
    const sev = c.severity?.toLowerCase() ?? ''
    if (sev === 'critical') parts.push('severity-critical')
    if (sev === 'high') parts.push('severity-high')
    const st = c.status?.toLowerCase().replace(/\s+/g, '') ?? ''
    if (st === 'pending') parts.push('status-open')
    if (st === 'resolved') parts.push('status-resolved')
    if (st === 'rejected') parts.push('status-rejected')
    return parts.join(' ')
  }

  const sevClass = (sev: string) => {
    const s = sev?.toLowerCase() ?? ''
    if (s === 'critical') return 'critical'
    if (s === 'high') return 'high'
    if (s === 'medium') return 'medium'
    return 'low'
  }

  const getDistance = (c: Complaint): string | null => {
    if (!activeLocation || c.latitude == null || c.longitude == null) return null
    const d = haversine(activeLocation.lat, activeLocation.lng, c.latitude, c.longitude)
    if (d < 1) return `${Math.round(d * 1000)}m away`
    return `${d.toFixed(1)}km away`
  }

  return (
    <div className="complaint-cards-page">
      <div className="complaint-page-header">
        <h1>What needs attention</h1>
        <p>Browse civic issues reported by residents across your community. Filter, search, and track progress on the things that matter most.</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="complaint-search-row">
        <Search size={18} color="#6b7570" />
        <input
          type="text"
          placeholder="Search reports, references, places..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All statuses</option>
          <option value="Pending">Open</option>
          <option value="Under Review">In progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="All">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="location-filter-row">
        <MapPin size={18} color="#6b7570" />
        <input
          type="text"
          placeholder="Enter an area or address (e.g. Indiranagar, Bengaluru)"
          value={locationQuery}
          onChange={(e) => setLocationQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); geocodeLocation(locationQuery) } }}
          className="location-filter-input"
        />
        <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="location-radius-select">
          <option value={2}>Within 2 km</option>
          <option value={5}>Within 5 km</option>
          <option value={10}>Within 10 km</option>
          <option value={25}>Within 25 km</option>
          <option value={50}>Within 50 km</option>
        </select>
        <button
          className="btn btn-primary location-search-btn"
          onClick={() => geocodeLocation(locationQuery)}
          disabled={geocoding || !locationQuery.trim()}
        >
          {geocoding ? <Loader2 size={16} className="spin" /> : <Navigation size={16} />}
          {geocoding ? 'Searching...' : 'Find'}
        </button>
        {activeLocation && (
          <button className="location-clear-btn" onClick={clearLocation} aria-label="Clear location filter">
            <X size={16} />
          </button>
        )}
      </div>

      {activeLocation && (
        <div className="location-active-badge">
          <MapPin size={14} />
          <span>Showing complaints within {radiusKm} km of <strong>{activeLocation.displayName.split(',').slice(0, 3).join(',')}</strong></span>
        </div>
      )}

      {geoError && (
        <div className="alert alert-error location-alert">
          <AlertCircle size={18} />
          <span>{geoError}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <Loader2 size={32} className="spin" />
          <p>Loading complaints...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>{activeLocation ? 'No complaints found in this area. Try expanding the radius or searching a different location.' : 'No complaints found.'}</p>
          <Link to="/file" className="btn btn-primary">File a Complaint</Link>
        </div>
      ) : (
        <div className="complaint-cards-grid">
          {filtered.map((c) => {
            const dist = getDistance(c)
            return (
              <div key={c.id} className={cardClass(c)}>
                <div className="cc-top">
                  <span className="cc-top-left">
                    <span className={`cc-dot ${STATUS_DOT_CLASS[c.status] ?? 'open'}`} />
                    {c.tracking_number}
                  </span>
                  <span className={`cc-badge ${STATUS_BADGE_CLASS[c.status] ?? 'open'}`}>
                    {c.status}
                  </span>
                </div>
                {c.photo_url && (
                  <img src={c.photo_url} alt="" className="cc-card-photo" loading="lazy" />
                )}
                <h3>{c.subject}</h3>
                <p>{c.description}</p>
                <div className="cc-foot">
                  <div className="cc-meta-left">
                    <span className="cc-meta-location">
                      {c.category} — filed by {c.name}
                      {c.location_name && (
                        <span className="cc-meta-place">
                          <MapPin size={11} /> {c.location_name}
                        </span>
                      )}
                      {dist && (
                        <span className="cc-meta-dist">{dist}</span>
                      )}
                    </span>
                    <span className={`cc-sev ${sevClass(c.severity)}`}>
                      ● {c.severity}
                    </span>
                  </div>
                  <Link to={`/track/${c.tracking_number}`} className="cc-view-link">
                    View record ↗
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
