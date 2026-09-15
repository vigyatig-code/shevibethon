import { useState } from 'react'
import { AlertCircle, TrendingUp, TrendingDown, X, MapPin, ChevronRight } from 'lucide-react'
import { useInView } from '../lib/hooks'
import { indiaStatePaths } from '../lib/indiaStatePaths'

export interface StateProblem {
  title: string
  category: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'Pending' | 'Under Review' | 'Resolved' | 'Rejected'
  area: string
  reportedDays: number
}

export interface StateSeverity {
  state: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  complaintCount: number
  trend: 'up' | 'down' | 'stable'
  problems: StateProblem[]
}

function getCaseLevel(count: number): 'high' | 'medium' | 'low' {
  if (count >= 3000) return 'high'
  if (count >= 1500) return 'medium'
  return 'low'
}

const LEVEL_FILL: Record<string, string> = {
  high: '#c0392b',
  medium: '#f1c40f',
  low: '#27ae60',
}

const LEVEL_GLOW: Record<string, string> = {
  high: 'rgba(192, 57, 43, 0.6)',
  medium: 'rgba(241, 196, 15, 0.5)',
  low: 'rgba(39, 174, 96, 0.4)',
}

const LEVEL_LABEL: Record<string, string> = {
  high: 'Most cases',
  medium: 'Moderate',
  low: 'Fewest cases',
}

const stateData: StateSeverity[] = [
  {
    state: 'Maharashtra',
    severity: 'Critical',
    complaintCount: 4280,
    trend: 'up',
    problems: [
      { title: 'Severe potholes on Western Express Highway', category: 'Roads', severity: 'Critical', status: 'Pending', area: 'Andheri East, Mumbai', reportedDays: 12 },
      { title: 'Monsoon flooding in low-lying areas of Mumbai', category: 'Drainage', severity: 'Critical', status: 'Under Review', area: 'Dadar, Mumbai', reportedDays: 8 },
      { title: 'Garbage piling near Crawford Market', category: 'Waste', severity: 'High', status: 'Pending', area: 'South Mumbai', reportedDays: 15 },
      { title: 'Broken streetlights on Marine Drive', category: 'Lighting', severity: 'Medium', status: 'Pending', area: 'Marine Drive, Mumbai', reportedDays: 20 },
      { title: 'Water contamination in Mithi River area', category: 'Water', severity: 'High', status: 'Under Review', area: 'Kurla, Mumbai', reportedDays: 6 },
    ],
  },
  {
    state: 'Karnataka',
    severity: 'High',
    complaintCount: 3120,
    trend: 'up',
    problems: [
      { title: 'Potholes on Outer Ring Road', category: 'Roads', severity: 'High', status: 'Pending', area: 'Silk Board, Bengaluru', reportedDays: 10 },
      { title: 'Water supply shortage in Whitefield', category: 'Water', severity: 'High', status: 'Under Review', area: 'Whitefield, Bengaluru', reportedDays: 14 },
      { title: 'Garbage not collected in Koramangala', category: 'Waste', severity: 'Medium', status: 'Pending', area: 'Koramangala, Bengaluru', reportedDays: 7 },
      { title: 'Open drains causing health hazards in KR Puram', category: 'Drainage', severity: 'High', status: 'Pending', area: 'KR Puram, Bengaluru', reportedDays: 18 },
    ],
  },
  {
    state: 'Tamil Nadu',
    severity: 'High',
    complaintCount: 2890,
    trend: 'stable',
    problems: [
      { title: 'Drainage overflow on Anna Salai', category: 'Drainage', severity: 'High', status: 'Pending', area: 'Anna Salai, Chennai', reportedDays: 9 },
      { title: 'Street flooding in T Nagar during monsoon', category: 'Drainage', severity: 'Critical', status: 'Under Review', area: 'T Nagar, Chennai', reportedDays: 5 },
      { title: 'Damaged footpath on Marina Beach Road', category: 'Roads', severity: 'Medium', status: 'Pending', area: 'Marina, Chennai', reportedDays: 22 },
      { title: 'Power outages in Velachery', category: 'Power', severity: 'Medium', status: 'Pending', area: 'Velachery, Chennai', reportedDays: 11 },
    ],
  },
  {
    state: 'Delhi',
    severity: 'Critical',
    complaintCount: 5100,
    trend: 'up',
    problems: [
      { title: 'Severe air pollution in winter months', category: 'Environment', severity: 'Critical', status: 'Under Review', area: 'Anand Vihar, Delhi', reportedDays: 3 },
      { title: 'Waste management crisis at Ghazipur landfill', category: 'Waste', severity: 'Critical', status: 'Pending', area: 'Ghazipur, Delhi', reportedDays: 30 },
      { title: 'Potholes on Ring Road near AIIMS', category: 'Roads', severity: 'High', status: 'Pending', area: 'AIIMS, Delhi', reportedDays: 8 },
      { title: 'Water pipeline leakage in Connaught Place', category: 'Water', severity: 'High', status: 'Under Review', area: 'Connaught Place, Delhi', reportedDays: 6 },
      { title: 'Illegal parking in Lajpat Nagar market', category: 'Encroachment', severity: 'Medium', status: 'Pending', area: 'Lajpat Nagar, Delhi', reportedDays: 16 },
    ],
  },
  {
    state: 'West Bengal',
    severity: 'High',
    complaintCount: 2640,
    trend: 'up',
    problems: [
      { title: 'Monsoon waterlogging in Salt Lake Sector V', category: 'Drainage', severity: 'Critical', status: 'Pending', area: 'Salt Lake, Kolkata', reportedDays: 7 },
      { title: 'Broken road surface on EM Bypass', category: 'Roads', severity: 'High', status: 'Pending', area: 'EM Bypass, Kolkata', reportedDays: 13 },
      { title: 'Stray dog menace in Behala', category: 'Safety', severity: 'Medium', status: 'Pending', area: 'Behala, Kolkata', reportedDays: 19 },
      { title: 'Streetlight not working in Lake Gardens', category: 'Lighting', severity: 'Medium', status: 'Under Review', area: 'Lake Gardens, Kolkata', reportedDays: 10 },
    ],
  },
  {
    state: 'Uttar Pradesh',
    severity: 'Medium',
    complaintCount: 1980,
    trend: 'stable',
    problems: [
      { title: 'Power outages in old Lucknow areas', category: 'Power', severity: 'High', status: 'Pending', area: 'Chowk, Lucknow', reportedDays: 12 },
      { title: 'Sanitation gaps in trans-Gomti area', category: 'Sanitation', severity: 'Medium', status: 'Under Review', area: 'Gomti Nagar, Lucknow', reportedDays: 9 },
      { title: 'Road disrepair on Kanpur highway', category: 'Roads', severity: 'Medium', status: 'Pending', area: 'Kanpur', reportedDays: 17 },
    ],
  },
  {
    state: 'Gujarat',
    severity: 'Medium',
    complaintCount: 1750,
    trend: 'down',
    problems: [
      { title: 'Traffic congestion on SG Highway', category: 'Transport', severity: 'Medium', status: 'Pending', area: 'SG Highway, Ahmedabad', reportedDays: 8 },
      { title: 'Street lighting failure in Naroda', category: 'Lighting', severity: 'Medium', status: 'Under Review', area: 'Naroda, Ahmedabad', reportedDays: 14 },
      { title: 'Water scarcity in Bhalia region', category: 'Water', severity: 'High', status: 'Pending', area: 'Bhalia, Gujarat', reportedDays: 21 },
    ],
  },
  {
    state: 'Rajasthan',
    severity: 'Medium',
    complaintCount: 1420,
    trend: 'stable',
    problems: [
      { title: 'Water scarcity in rural Jaipur district', category: 'Water', severity: 'High', status: 'Pending', area: 'Jaipur Rural', reportedDays: 25 },
      { title: 'Road disrepair on Ajmer highway', category: 'Roads', severity: 'Medium', status: 'Pending', area: 'Ajmer Highway', reportedDays: 15 },
      { title: 'Broken street signs in Jodhpur', category: 'Roads', severity: 'Low', status: 'Under Review', area: 'Jodhpur', reportedDays: 11 },
    ],
  },
  {
    state: 'Bihar',
    severity: 'High',
    complaintCount: 2310,
    trend: 'up',
    problems: [
      { title: 'Flood damage in Kosi belt villages', category: 'Disaster', severity: 'Critical', status: 'Pending', area: 'Kosi Belt, Bihar', reportedDays: 4 },
      { title: 'Broken embankments near Bagmati river', category: 'Disaster', severity: 'High', status: 'Under Review', area: 'Muzaffarpur, Bihar', reportedDays: 9 },
      { title: 'Bridge damage on NH-28', category: 'Roads', severity: 'High', status: 'Pending', area: 'Muzaffarpur, Bihar', reportedDays: 12 },
    ],
  },
  {
    state: 'Kerala',
    severity: 'Low',
    complaintCount: 680,
    trend: 'down',
    problems: [
      { title: 'Waste segregation gaps in Kochi corporation', category: 'Waste', severity: 'Medium', status: 'Under Review', area: 'Kochi', reportedDays: 8 },
      { title: 'Minor road cracks in Kozhikode', category: 'Roads', severity: 'Low', status: 'Pending', area: 'Kozhikode', reportedDays: 14 },
    ],
  },
  {
    state: 'Telangana',
    severity: 'Medium',
    complaintCount: 1340,
    trend: 'stable',
    problems: [
      { title: 'Stray dog menace in old city area', category: 'Safety', severity: 'Medium', status: 'Pending', area: 'Old City, Hyderabad', reportedDays: 10 },
      { title: 'Open drains in Kukatpally', category: 'Drainage', severity: 'Medium', status: 'Under Review', area: 'Kukatpally, Hyderabad', reportedDays: 13 },
      { title: 'Potholes on Banjara Hills Road 12', category: 'Roads', severity: 'Medium', status: 'Pending', area: 'Banjara Hills, Hyderabad', reportedDays: 7 },
    ],
  },
  {
    state: 'Madhya Pradesh',
    severity: 'Low',
    complaintCount: 540,
    trend: 'down',
    problems: [
      { title: 'Pothole repairs needed on MP SH-17', category: 'Roads', severity: 'Low', status: 'Pending', area: 'Indore', reportedDays: 16 },
      { title: 'Missing road signs in Bhopal new market', category: 'Roads', severity: 'Low', status: 'Under Review', area: 'Bhopal', reportedDays: 12 },
    ],
  },
  {
    state: 'Punjab',
    severity: 'Medium',
    complaintCount: 1180,
    trend: 'up',
    problems: [
      { title: 'Crop stubble burning causing air pollution', category: 'Environment', severity: 'High', status: 'Pending', area: 'Ludhiana, Punjab', reportedDays: 5 },
      { title: 'Air quality deterioration in Amritsar', category: 'Environment', severity: 'Medium', status: 'Under Review', area: 'Amritsar', reportedDays: 9 },
      { title: 'Drainage blockage in Patiala', category: 'Drainage', severity: 'Medium', status: 'Pending', area: 'Patiala', reportedDays: 11 },
    ],
  },
  {
    state: 'Odisha',
    severity: 'Medium',
    complaintCount: 1290,
    trend: 'stable',
    problems: [
      { title: 'Cyclone damage to coastal roads', category: 'Disaster', severity: 'High', status: 'Pending', area: 'Puri, Odisha', reportedDays: 6 },
      { title: 'Water contamination in Cuttack supply', category: 'Water', severity: 'Medium', status: 'Under Review', area: 'Cuttack', reportedDays: 10 },
      { title: 'Broken embankment near Chilika lake', category: 'Disaster', severity: 'Medium', status: 'Pending', area: 'Chilika, Odisha', reportedDays: 14 },
    ],
  },
  {
    state: 'Assam',
    severity: 'High',
    complaintCount: 2050,
    trend: 'up',
    problems: [
      { title: 'Flood erosion in Brahmaputra banks', category: 'Disaster', severity: 'Critical', status: 'Pending', area: 'Majuli, Assam', reportedDays: 3 },
      { title: 'Bridge damage on NH-37 near Kaziranga', category: 'Roads', severity: 'High', status: 'Under Review', area: 'Kaziranga, Assam', reportedDays: 8 },
      { title: 'Roads washed away in Dhemaji', category: 'Roads', severity: 'High', status: 'Pending', area: 'Dhemaji, Assam', reportedDays: 5 },
    ],
  },
]

const stateDataMap: Record<string, StateSeverity> = stateData.reduce((acc, s) => {
  acc[s.state] = s
  return acc
}, {} as Record<string, StateSeverity>)

function timeAgo(days: number): string {
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''} ago`
}

export default function IndiaMap() {
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.2 })

  const activeState = selectedState || hoveredState
  const activeData = activeState ? stateDataMap[activeState] : null
  const isPinned = selectedState !== null

  const levelCounts = {
    high: stateData.filter(s => getCaseLevel(s.complaintCount) === 'high').length,
    medium: stateData.filter(s => getCaseLevel(s.complaintCount) === 'medium').length,
    low: stateData.filter(s => getCaseLevel(s.complaintCount) === 'low').length,
  }

  const unresolvedProblems = activeData ? activeData.problems.filter(p => p.status !== 'Resolved') : []

  return (
    <section className="civic-india-map" aria-label="Civic problem severity across India">
      <div className="civic-section-inner" ref={ref}>
        <div className="civic-section-header">
          <h2 className="civic-section-title">Civic Severity Across India</h2>
          <p className="civic-section-subtitle">
            A state-by-state view of civic problem intensity. Click any state to see all unresolved issues reported in that region.
          </p>
        </div>

        <div className={`civic-india-map-layout ${inView ? 'civic-reveal' : ''}`}>
          <div className="civic-india-map-svg-wrap">
            <svg
              viewBox="52 59 1522 1723"
              className="civic-india-map-svg"
              role="img"
              shapeRendering="geometricPrecision"
              aria-label="Map of India showing civic problem severity by state"
            >
              <defs>
                <radialGradient id="mapBgGlow" cx="50%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="rgba(212, 175, 55, 0.08)" />
                  <stop offset="100%" stopColor="rgba(212, 175, 55, 0)" />
                </radialGradient>
              </defs>
              <rect x="52" y="59" width="1522" height="1723" fill="url(#mapBgGlow)" />
              {indiaStatePaths.map((s) => {
                const data = stateDataMap[s.name]
                const level = data ? getCaseLevel(data.complaintCount) : 'low'
                const fill = data ? LEVEL_FILL[level] : '#3d2a17'
                const glow = data ? LEVEL_GLOW[level] : 'rgba(212, 175, 55, 0.15)'
                const isActive = activeState === s.name
                return (
                  <g key={s.id}>
                    <path
                      d={s.d}
                      className={`india-state-path ${isActive ? 'india-state-active' : ''}`}
                      fill={fill}
                      stroke={isActive ? '#f5d061' : '#d4af37'}
                      strokeWidth={isActive ? 2 : 1.25}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      onMouseEnter={() => setHoveredState(s.name)}
                      onMouseLeave={() => setHoveredState(null)}
                      onClick={() => setSelectedState(selectedState === s.name ? null : s.name)}
                      style={{
                        cursor: 'pointer',
                        transition: 'opacity 0.25s ease, stroke-width 0.25s ease, filter 0.25s ease',
                        filter: isActive ? `drop-shadow(0 0 10px ${glow})` : 'none',
                      }}
                    >
                      <title>{s.name}{data ? ` — ${data.complaintCount.toLocaleString('en-IN')} complaints` : ''}</title>
                    </path>
                    {data && (() => {
                      const match = s.d.match(/m\s+([\d.]+),([\d.]+)/i)
                      if (!match) return null
                      const cx = parseFloat(match[1])
                      const cy = parseFloat(match[2])
                      return (
                        <text
                          x={cx}
                          y={cy}
                          className="india-state-label"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          pointerEvents="none"
                        >
                          {data.complaintCount >= 1000 ? `${(data.complaintCount / 1000).toFixed(1)}k` : data.complaintCount}
                        </text>
                      )
                    })()}
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="civic-india-map-side">
            <div className="civic-india-map-legend">
              <h3 className="civic-india-legend-title">Case Volume Legend</h3>
              <div className="civic-india-legend-items">
                {(['high', 'medium', 'low'] as const).map(lvl => (
                  <div key={lvl} className="civic-india-legend-item">
                    <span className="civic-india-legend-dot" style={{ background: LEVEL_FILL[lvl], boxShadow: `0 0 6px ${LEVEL_GLOW[lvl]}` }} />
                    <span className="civic-india-legend-label">{LEVEL_LABEL[lvl]}</span>
                    <span className="civic-india-legend-count">{levelCounts[lvl]} states</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="civic-india-map-detail">
              {activeData ? (
                <>
                  <div className="civic-india-detail-header">
                    <span className="civic-india-detail-sev-dot" style={{ background: LEVEL_FILL[getCaseLevel(activeData.complaintCount)], boxShadow: `0 0 8px ${LEVEL_GLOW[getCaseLevel(activeData.complaintCount)]}` }} />
                    <h3 className="civic-india-detail-state">{activeData.state}</h3>
                    {isPinned && (
                      <button className="civic-india-detail-close" onClick={() => setSelectedState(null)} aria-label="Close state details">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <div className="civic-india-detail-sev-badge" style={{ background: LEVEL_FILL[getCaseLevel(activeData.complaintCount)] }}>
                    {LEVEL_LABEL[getCaseLevel(activeData.complaintCount)]}
                  </div>
                  <div className="civic-india-detail-stats">
                    <div className="civic-india-detail-stat">
                      <span className="civic-india-detail-stat-num">{activeData.complaintCount.toLocaleString('en-IN')}</span>
                      <span className="civic-india-detail-stat-label">Total complaints</span>
                    </div>
                    <div className="civic-india-detail-stat">
                      <span className="civic-india-detail-stat-num">{unresolvedProblems.length}</span>
                      <span className="civic-india-detail-stat-label">Unresolved issues</span>
                    </div>
                    <div className="civic-india-detail-stat">
                      {activeData.trend === 'up' ? (
                        <TrendingUp size={20} className="civic-trend-up" />
                      ) : activeData.trend === 'down' ? (
                        <TrendingDown size={20} className="civic-trend-down" />
                      ) : (
                        <span className="civic-trend-stable">—</span>
                      )}
                      <span className="civic-india-detail-stat-label">
                        {activeData.trend === 'up' ? 'Rising' : activeData.trend === 'down' ? 'Improving' : 'Stable'}
                      </span>
                    </div>
                  </div>

                  {isPinned && (
                    <div className="civic-india-problem-list">
                      <h4 className="civic-india-problem-list-title">
                        <AlertCircle size={15} />
                        Unresolved Problems ({unresolvedProblems.length})
                      </h4>
                      <div className="civic-india-problem-items">
                        {unresolvedProblems.map((p, i) => (
                          <div key={i} className="civic-india-problem-item" style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className="civic-india-problem-sev-bar" style={{ background: LEVEL_FILL[getCaseLevel(activeData.complaintCount)] }} />
                            <div className="civic-india-problem-body">
                              <div className="civic-india-problem-top">
                                <span className="civic-india-problem-cat">{p.category}</span>
                                <span className={`civic-india-problem-status status-${p.status.toLowerCase().replace(/\s/g, '-')}`}>
                                  {p.status}
                                </span>
                              </div>
                              <p className="civic-india-problem-title">{p.title}</p>
                              <div className="civic-india-problem-meta">
                                <span className="civic-india-problem-area">
                                  <MapPin size={12} />
                                  {p.area}
                                </span>
                                <span className="civic-india-problem-time">{timeAgo(p.reportedDays)}</span>
                              </div>
                            </div>
                            <ChevronRight size={16} className="civic-india-problem-chevron" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isPinned && (
                    <div className="civic-india-detail-hint">
                      <ChevronRight size={16} />
                      <span>Click the state to see all {unresolvedProblems.length} unresolved problems</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="civic-india-detail-empty">
                  <p>Click a state on the map to see all unresolved civic problems in that region.</p>
                </div>
              )}
            </div>

            <div className="civic-india-map-summary">
              <div className="civic-india-summary-item">
                <span className="civic-india-summary-num">{stateData.reduce((a, s) => a + s.complaintCount, 0).toLocaleString('en-IN')}</span>
                <span className="civic-india-summary-label">Total complaints</span>
              </div>
              <div className="civic-india-summary-item">
                <span className="civic-india-summary-num">{stateData.reduce((a, s) => a + s.problems.filter(p => p.status !== 'Resolved').length, 0)}</span>
                <span className="civic-india-summary-label">Unresolved issues</span>
              </div>
              <div className="civic-india-summary-item">
                <span className="civic-india-summary-num">{stateData.length}</span>
                <span className="civic-india-summary-label">States tracked</span>
              </div>
              <span className="civic-demo-tag">Demo data</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
