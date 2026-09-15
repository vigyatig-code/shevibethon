import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface ComplaintMarker {
  id: string
  title: string
  status: string
  lat: number
  lng: number
  city: string
}

const mockComplaints: ComplaintMarker[] = [
  { id: 'CC-2401', title: 'Severe potholes on Western Express Highway', status: 'Pending', lat: 19.1136, lng: 72.8697, city: 'Mumbai' },
  { id: 'CC-2402', title: 'Water supply shortage in Whitefield', status: 'Under Review', lat: 12.9698, lng: 77.7500, city: 'Bengaluru' },
  { id: 'CC-2403', title: 'Drainage overflow on Anna Salai', status: 'Pending', lat: 13.0827, lng: 80.2707, city: 'Chennai' },
  { id: 'CC-2404', title: 'Severe air pollution in winter months', status: 'Under Review', lat: 28.6139, lng: 77.2090, city: 'Delhi' },
  { id: 'CC-2405', title: 'Monsoon waterlogging in Salt Lake Sector V', status: 'Pending', lat: 22.5958, lng: 88.2636, city: 'Kolkata' },
]

function createStampIcon(): L.DivIcon {
  return L.divIcon({
    className: 'civic-leaflet-marker-wrap',
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0 C7 0 1 6 1 14 C1 24 15 40 15 40 C15 40 29 24 29 14 C29 6 23 0 15 0 Z"
        fill="#8C3324" stroke="#3E2A1C" stroke-width="2" />
      <circle cx="15" cy="14" r="5" fill="#D8C39E" />
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -38],
  })
}

const stampIcon = createStampIcon()

const statusColors: Record<string, string> = {
  'Pending': '#8C3324',
  'Under Review': '#B8860B',
  'Resolved': '#4A6B3A',
  'Rejected': '#555',
}

export default function LeafletMap() {
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize()
    }
  }, [])

  return (
    <section className="civic-leaflet-section" aria-label="Interactive map of civic complaints across India">
      <div className="civic-section-inner">
        <div className="civic-section-header">
          <h2 className="civic-section-title">Complaints Map View</h2>
          <p className="civic-section-subtitle">
            Explore civic complaints across India on an interactive map. Click any marker for case details.
          </p>
        </div>

        <div className="civic-leaflet-card">
          <div className="civic-leaflet-header">
            <span className="civic-leaflet-header-title">Active Complaints - India</span>
            <span className="civic-leaflet-badge">Demo data</span>
          </div>

          <MapContainer
            center={[22.5, 80]}
            zoom={5}
            scrollWheelZoom={false}
            ref={mapRef as React.MutableRefObject<L.Map | null>}
            className="civic-leaflet-container"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mockComplaints.map((c) => (
              <Marker key={c.id} position={[c.lat, c.lng]} icon={stampIcon}>
                <Popup>
                  <div className="civic-leaflet-popup">
                    <span className="civic-leaflet-popup-id">{c.id}</span>
                    <p className="civic-leaflet-popup-title">{c.title}</p>
                    <div className="civic-leaflet-popup-meta">
                      <span className="civic-leaflet-popup-city">{c.city}</span>
                      <span
                        className="civic-leaflet-popup-status"
                        style={{ background: statusColors[c.status] || '#555' }}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </section>
  )
}
