import { useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Navigation, AlertCircle, Loader2, RefreshCw, ArrowRight } from 'lucide-react'
import { supabase, type Complaint, SEVERITY_COLORS, SEVERITY_ORDER } from '../lib/supabase'
import { useInView, useReducedMotion, useTilt } from '../lib/hooks'

// NearbyIssues: requests geolocation permission from the user, then
// queries complaints from the database that have location coordinates.
// Falls back to demo data when no geolocated complaints exist or when
// permission is denied. Uses the Haversine formula client-side to
// sort by distance. Never exposes precise user location — only uses
// it to find nearby complaints.

type LocationState = 'idle' | 'requesting' | 'granted' | 'denied' | 'error'

interface NearbyComplaint extends Complaint {
  distance: number
}

// Haversine distance in km between two lat/lng points
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const statusBadgeClass: Record<string, string> = {
  'Pending': 'status-pending',
  'Under Review': 'status-review',
  'Resolved': 'status-resolved',
  'Rejected': 'status-rejected',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

function NearbyCard({ c, index, reduced }: { c: NearbyComplaint; index: number; reduced: boolean }) {
  const tiltRef = useRef<HTMLAnchorElement>(null)
  const tilt = useTilt(tiltRef, !reduced)

  return (
    <Link
      to={`/track/${c.tracking_number}`}
      ref={tiltRef}
      className="civic-nearby-card"
      style={{ animationDelay: `${index * 0.08}s` }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <div className="civic-nearby-card-top">
        <span
          className="civic-nearby-sev-dot"
          style={{ background: SEVERITY_COLORS[c.severity] || SEVERITY_COLORS['Medium'] }}
        />
        <span className={`status-badge ${statusBadgeClass[c.status] ?? 'status-pending'}`}>
          {c.status}
        </span>
        {c.distance < 100 && (
          <span className="civic-nearby-distance">{c.distance < 1 ? `${Math.round(c.distance * 1000)}m` : `${c.distance.toFixed(1)}km`} away</span>
        )}
      </div>
      <h3 className="civic-nearby-card-title">{c.subject}</h3>
      <p className="civic-nearby-card-desc">
        {c.description.length > 100 ? `${c.description.slice(0, 100)}...` : c.description}
      </p>
      <div className="civic-nearby-card-foot">
        <span className="civic-nearby-location">
          <MapPin size={13} />
          {c.location_name || c.category}
        </span>
        <span className="civic-nearby-date">{formatDate(c.created_at)}</span>
      </div>
      <span className="civic-nearby-view">
        View details <ArrowRight size={13} />
      </span>
    </Link>
  )
}

// Demo complaint templates — locations are generated dynamically near the user's real coordinates
interface DemoTemplate {
  id: string
  tracking_number: string
  category: string
  subject: string
  description: string
  status: string
  priority: string
  severity: string
  location_name: string
  ageHours: number
}

const demoTemplates: DemoTemplate[] = [
  {
    id: 'demo-1',
    tracking_number: 'CMP-DEMO001',
    category: 'Service Complaint',
    subject: 'Potholes on main road junction',
    description: 'Deep potholes near the main road junction are causing accidents and two-wheeler skids, especially during monsoon rain.',
    status: 'Pending',
    priority: 'Normal',
    severity: 'High',
    location_name: 'Nearby junction',
    ageHours: 24,
  },
  {
    id: 'demo-2',
    tracking_number: 'CMP-DEMO002',
    category: 'Quality Issue',
    subject: 'Water pipeline leakage on 5th Cross',
    description: 'A major water leak on 5th Cross has been flooding the road for three days. Clean water is being wasted.',
    status: 'Under Review',
    priority: 'High',
    severity: 'Critical',
    location_name: '5th Cross, nearby',
    ageHours: 48,
  },
  {
    id: 'demo-3',
    tracking_number: 'CMP-DEMO003',
    category: 'Service Complaint',
    subject: 'Garbage not collected for a week',
    description: 'The municipal waste collection truck has not visited our street for over a week. Pile-up is causing health concerns and stray dog menace.',
    status: 'Pending',
    priority: 'Normal',
    severity: 'Medium',
    location_name: 'Nearby street',
    ageHours: 72,
  },
  {
    id: 'demo-4',
    tracking_number: 'CMP-DEMO004',
    category: 'Accessibility & Disability',
    subject: 'Footpath broken near school zone',
    description: 'The pavement outside the school is cracked and uneven, making it dangerous for children and wheelchair users.',
    status: 'Resolved',
    priority: 'High',
    severity: 'High',
    location_name: 'Near school zone',
    ageHours: 168,
  },
]

// Generate demo complaints at random offsets (0.3–3 km) from the user's real location
function generateDemoNearby(lat: number, lng: number): NearbyComplaint[] {
  // ~1 km in degrees latitude; longitude scales by cos(lat)
  const kmPerDegLat = 111
  const kmPerDegLng = 111 * Math.cos((lat * Math.PI) / 180)

  return demoTemplates.map((t) => {
    // Random distance 0.3–3.0 km, random bearing
    const distKm = 0.3 + Math.random() * 2.7
    const bearing = Math.random() * 2 * Math.PI
    const dLatKm = distKm * Math.sin(bearing)
    const dLngKm = distKm * Math.cos(bearing)
    const dLat = dLatKm / kmPerDegLat
    const dLng = dLngKm / kmPerDegLng
    const created = new Date(Date.now() - t.ageHours * 3600000).toISOString()
    return {
      id: t.id,
      tracking_number: t.tracking_number,
      name: 'Resident',
      email: 'demo@portal.gov.in',
      category: t.category,
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      severity: t.severity,
      photo_url: null,
      latitude: lat + dLat,
      longitude: lng + dLng,
      location_name: t.location_name,
      upvote_count: 0,
      created_at: created,
      updated_at: created,
      distance: distKm,
    }
  })
}

export default function NearbyIssues() {
  const [locationState, setLocationState] = useState<LocationState>('idle')
  const [complaints, setComplaints] = useState<NearbyComplaint[]>([])
  const [loading, setLoading] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.15 })
  const reducedMotion = useReducedMotion()

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState('error')
      setErrorMsg('Geolocation is not supported by your browser. Showing demo issues instead.')
      setComplaints(generateDemoNearby(0, 0))
      return
    }

    setLocationState('requesting')
    setErrorMsg(null)

    navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      setUserCoords({ lat: latitude, lng: longitude })
      setLocationState('granted')
      fetchNearbyComplaints(latitude, longitude)
    },
    (err) => {
      setLocationState('denied')
      if (err.code === err.PERMISSION_DENIED) {
        setErrorMsg('Location permission denied. Showing demo issues instead — enable location to see real problems near you.')
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setErrorMsg('Could not determine your location. Showing demo issues instead.')
      } else {
        setErrorMsg('Location request timed out. Showing demo issues instead.')
      }
      setComplaints(generateDemoNearby(0, 0))
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchNearbyComplaints = useCallback(async (lat: number, lng: number) => {
    setLoading(true)
    try {
      const { data, error: queryError } = await supabase
        .from('complaints')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100)

      if (queryError) throw queryError

      if (data && data.length > 0) {
        const withDistance = (data as Complaint[])
          .map((c) => ({
            ...c,
            distance: haversine(lat, lng, c.latitude!, c.longitude!),
          }))
          .sort((a, b) => {
            const sa = SEVERITY_ORDER[a.severity] ?? 2
            const sb = SEVERITY_ORDER[b.severity] ?? 2
            if (a.distance <= 2 && b.distance <= 2) {
              if (sa !== sb) return sa - sb
            }
            return a.distance - b.distance
          })
          .slice(0, 6)
        setComplaints(withDistance)
      } else {
        setComplaints(
          generateDemoNearby(lat, lng).sort((a, b) => a.distance - b.distance)
        )
      }
    } catch {
      setComplaints(generateDemoNearby(lat, lng))
      setErrorMsg('Could not load nearby complaints. Showing demo issues instead.')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="civic-nearby" aria-label="Issues near your location">
      <div className="civic-section-inner" ref={ref}>
        <div className="civic-section-header">
          <h2 className="civic-section-title">Issues Near You</h2>
          <p className="civic-section-subtitle">
            Allow location access to see civic problems reported around your area. No precise address is stored or shared.
          </p>
        </div>

        {locationState === 'idle' && (
          <div className="civic-nearby-prompt">
            <div className="civic-nearby-prompt-icon">
              <Navigation size={32} />
            </div>
            <h3 className="civic-nearby-prompt-title">Find problems around you</h3>
            <p className="civic-nearby-prompt-text">
              We use your approximate location to show civic issues near you — broken streetlights, garbage collection delays, water leaks, and more. Your exact location is never stored.
            </p>
            <button className="civic-btn civic-btn-primary civic-btn-lg" onClick={requestLocation}>
              <MapPin size={18} />
              Allow location access
            </button>
            <Link to="/complaints" className="civic-btn civic-btn-ghost civic-btn-lg">
              <ArrowRight size={18} />
              Browse without location
            </Link>
            <span className="civic-nearby-prompt-hint">
              Your exact location is never stored or shared.
            </span>
          </div>
        )}

        {locationState === 'requesting' && (
          <div className="civic-nearby-loading">
            <Loader2 size={32} className="spin" />
            <p>Requesting your location...</p>
            <span className="civic-nearby-prompt-hint">Please allow location access in your browser.</span>
          </div>
        )}

        {errorMsg && (
          <div className="civic-nearby-notice" role="status">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {locationState === 'denied' && (
          <div className="civic-nearby-denied-actions">
            <button className="civic-btn civic-btn-ghost civic-btn-lg" onClick={requestLocation}>
              <MapPin size={18} />
              Try again
            </button>
            <Link to="/complaints" className="civic-btn civic-btn-primary civic-btn-lg">
              <ArrowRight size={18} />
              Browse all complaints
            </Link>
          </div>
        )}

        {(locationState === 'granted' || locationState === 'denied' || locationState === 'error') && complaints.length > 0 && (
          <>
            {locationState === 'granted' && userCoords && (
              <div className="civic-nearby-status">
                <MapPin size={16} />
                <span>Showing issues near your location</span>
                <button className="civic-nearby-refresh" onClick={() => fetchNearbyComplaints(userCoords.lat, userCoords.lng)} disabled={loading} aria-label="Refresh nearby issues">
                  <RefreshCw size={14} className={loading ? 'spin' : ''} />
                </button>
              </div>
            )}

            {loading ? (
              <div className="civic-nearby-loading">
                <Loader2 size={28} className="spin" />
                <p>Loading nearby issues...</p>
              </div>
            ) : (
              <div className={`civic-nearby-grid ${inView ? 'civic-reveal' : ''}`}>
                {complaints.map((c, index) => (
                  <NearbyCard key={c.id} c={c} index={index} reduced={reducedMotion} />
                ))}
              </div>
            )}

            <div className="civic-nearby-footer">
              <span className="civic-demo-tag">Demo data</span>
              <Link to="/complaints" className="civic-nearby-all">
                Browse all complaints <ArrowRight size={13} />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
