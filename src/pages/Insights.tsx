import { useState, useEffect } from 'react'
import { BarChart3, AlertCircle, Loader2 } from 'lucide-react'
import { supabase, SEVERITY_COLORS } from '../lib/supabase'

interface InsightsData {
  total: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  bySeverity: Record<string, number>
}

const STATUS_COLORS: Record<string, string> = {
  'Pending': '#c4976a',
  'Under Review': '#a96545',
  'Resolved': '#6f4e37',
  'Rejected': '#b8a088',
}

export default function Insights() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      const { data: rows, error: queryError } = await supabase
        .from('complaints')
        .select('status, category, severity')

      if (queryError) throw queryError

      const all = rows ?? []
      const byStatus: Record<string, number> = {}
      const byCategory: Record<string, number> = {}
      const bySeverity: Record<string, number> = {}

      for (const row of all) {
        byStatus[row.status] = (byStatus[row.status] || 0) + 1
        byCategory[row.category] = (byCategory[row.category] || 0) + 1
        bySeverity[row.severity] = (bySeverity[row.severity] || 0) + 1
      }

      setData({ total: all.length, byStatus, byCategory, bySeverity })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="insights-page">
        <div className="loading-state">
          <Loader2 size={32} className="spin" />
          <p>Loading insights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="insights-page">
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!data || data.total === 0) {
    return (
      <div className="insights-page">
        <div className="form-page-header">
          <div className="form-page-icon">
            <BarChart3 size={32} />
          </div>
          <h1>Public Insights Dashboard</h1>
          <p>No complaint data available yet. Insights will appear once complaints are filed.</p>
        </div>
      </div>
    )
  }

  const statuses = Object.entries(data.byStatus).sort((a, b) => b[1] - a[1])
  const categories = Object.entries(data.byCategory).sort((a, b) => b[1] - a[1])
  const severities = Object.entries(data.bySeverity)
  const maxCategory = Math.max(...categories.map(([, n]) => n))

  const resolvedCount = data.byStatus['Resolved'] || 0
  const resolutionRate = Math.round((resolvedCount / data.total) * 100)

  const donutSegments = statuses.map(([status, count]) => ({
    status,
    count,
    pct: count / data.total,
    color: STATUS_COLORS[status] || '#d4c4a8',
  }))

  let cumulativePct = 0
  const donutGradient = donutSegments.map((seg) => {
    const start = cumulativePct * 360
    cumulativePct += seg.pct
    const end = cumulativePct * 360
    return `${seg.color} ${start}deg ${end}deg`
  }).join(', ')

  return (
    <div className="insights-page">
      <div className="form-page-header">
        <div className="form-page-icon">
          <BarChart3 size={32} />
        </div>
        <h1>Public Insights Dashboard</h1>
        <p>Transparent analytics showing complaint trends, resolution rates, and category breakdowns.</p>
      </div>

      <div className="insights-stat-row">
        <div className="insights-stat">
          <div className="insights-stat-num">{data.total}</div>
          <div className="insights-stat-label">Total Complaints</div>
        </div>
        <div className="insights-stat">
          <div className="insights-stat-num">{resolutionRate}%</div>
          <div className="insights-stat-label">Resolution Rate</div>
        </div>
        <div className="insights-stat">
          <div className="insights-stat-num">{categories.length}</div>
          <div className="insights-stat-label">Categories Reported</div>
        </div>
      </div>

      <div className="insights-grid">
        <div className="insights-card">
          <h3>Status Distribution</h3>
          <div className="donut-chart">
            <div
              className="donut"
              style={{ background: `conic-gradient(${donutGradient})` }}
            >
              <div className="donut-center">
                <div className="donut-center-num">{data.total}</div>
                <div className="donut-center-label">Total</div>
              </div>
            </div>
            <div className="donut-legend">
              {donutSegments.map((seg) => (
                <div key={seg.status} className="donut-legend-item">
                  <span className="donut-legend-dot" style={{ background: seg.color }} />
                  <span>{seg.status}: {seg.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="insights-card">
          <h3>Complaints by Category</h3>
          <div className="bar-chart">
            {categories.map(([cat, count]) => (
              <div key={cat} className="bar-row">
                <span className="bar-label">{cat}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(count / maxCategory) * 100}%`,
                      background: '#a96545',
                    }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="insights-card">
        <h3>Severity Breakdown</h3>
        <div className="severity-pie">
          <div
            className="severity-pie-ring"
            style={{
              background: `conic-gradient(${severities.map(([sev, count]) => {
                const pct = count / data.total
                return `${SEVERITY_COLORS[sev] || '#d4c4a8'} 0deg ${pct * 360}deg`
              }).join(', ')})`,
            }}
          >
            <div className="severity-pie-center">{data.total}</div>
          </div>
          <div className="donut-legend">
            {severities.map(([sev, count]) => (
              <div key={sev} className="donut-legend-item">
                <span className="donut-legend-dot" style={{ background: SEVERITY_COLORS[sev] || '#d4c4a8' }} />
                <span>{sev}: {count} ({Math.round((count / data.total) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
