import { useState, useEffect, useMemo } from 'react'
import { AlertCircle, Loader2, MapPin, Clock, Link2, Filter } from 'lucide-react'
import { supabase, type CivicComplaint } from '../lib/supabase'

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
  reopened: 'Reopened',
}

const STATUS_CLASSES: Record<string, string> = {
  open: 'dash-status-open',
  in_progress: 'dash-status-progress',
  closed: 'dash-status-closed',
  reopened: 'dash-status-reopened',
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  new: 'New',
  probable_repair_failure: 'Repair Failure',
  duplicate: 'Duplicate',
}

const CLASSIFICATION_CLASSES: Record<string, string> = {
  new: 'dash-class-new',
  probable_repair_failure: 'dash-class-failure',
  duplicate: 'dash-class-duplicate',
}

const STATUS_OPTIONS = ['all', 'open', 'in_progress', 'closed', 'reopened'] as const

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffH < 1) return 'Just now'
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 30) return `${diffD}d ago`
  return formatDate(dateStr)
}

export default function PublicDashboard() {
  const [complaints, setComplaints] = useState<CivicComplaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: queryError } = await supabase
        .from('civic_complaints')
        .select('*')
        .order('filed_at', { ascending: false })

      if (queryError) throw queryError
      setComplaints((data ?? []) as CivicComplaint[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaints.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return complaints
    return complaints.filter((c) => c.status === statusFilter)
  }, [complaints, statusFilter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: complaints.length, open: 0, in_progress: 0, closed: 0, reopened: 0 }
    complaints.forEach((cmp) => { c[cmp.status] = (c[cmp.status] ?? 0) + 1 })
    return c
  }, [complaints])

  return (
    <div className="civic-inner-page-wrap">
      <div className="civic-inner-page-header">
        <h1 className="civic-inner-page-title">Public Dashboard</h1>
        <p className="civic-inner-page-subtitle">
          All civic complaints filed across the city — track status, view classifications, and monitor repair warranties in real time.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="dash-filter-row">
        <div className="dash-filter-label">
          <Filter size={16} />
          <span>Filter by status</span>
        </div>
        <div className="dash-filter-pills">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              className={`dash-filter-pill ${statusFilter === opt ? 'active' : ''}`}
              onClick={() => setStatusFilter(opt)}
            >
              {opt === 'all' ? 'All' : STATUS_LABELS[opt] ?? opt}
              <span className="dash-pill-count">{counts[opt] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 size={32} className="spin" />
          <p>Loading complaints...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No complaints found{statusFilter !== 'all' ? ` with status "${STATUS_LABELS[statusFilter] ?? statusFilter}"` : ''}.</p>
        </div>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Classification</th>
                <th>Location</th>
                <th>Filed</th>
                <th>Warranty</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="dash-cell-ticket">#{c.ticket_no}</td>
                  <td className="dash-cell-title">
                    <span className="dash-title-text">{c.title}</span>
                    {c.linked_complaint_id && (
                      <span className="dash-linked" title={`Linked to another complaint`}>
                        <Link2 size={12} /> linked
                      </span>
                    )}
                  </td>
                  <td className="dash-cell-category">{c.category.replace(/_/g, ' ')}</td>
                  <td>
                    <span className={`dash-status-badge ${STATUS_CLASSES[c.status] ?? ''}`}>
                      <span className="dash-status-dot" />
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                  </td>
                  <td>
                    <span className={`dash-class-badge ${CLASSIFICATION_CLASSES[c.classification] ?? ''}`}>
                      {CLASSIFICATION_LABELS[c.classification] ?? c.classification}
                    </span>
                  </td>
                  <td className="dash-cell-location">
                    {c.address ? (
                      <span className="dash-loc"><MapPin size={12} /> {c.address.split(',')[0]}</span>
                    ) : (
                      <span className="dash-loc-muted">{c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}</span>
                    )}
                  </td>
                  <td className="dash-cell-filed">
                    <span className="dash-relative"><Clock size={12} /> {formatRelative(c.filed_at)}</span>
                  </td>
                  <td className="dash-cell-warranty">
                    {c.warranty_until ? (
                      new Date(c.warranty_until) > new Date() ? (
                        <span className="dash-warranty-active">Until {formatDate(c.warranty_until)}</span>
                      ) : (
                        <span className="dash-warranty-expired">Expired</span>
                      )
                    ) : (
                      <span className="dash-warranty-none">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
