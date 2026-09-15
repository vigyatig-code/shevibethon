import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Loader2, Search } from 'lucide-react'
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

export default function ComplaintList() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')

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

  const filtered = complaints.filter((c) => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter
    const matchesSearch =
      !search ||
      c.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesCategory && matchesSearch
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

      {loading ? (
        <div className="loading-state">
          <Loader2 size={32} className="spin" />
          <p>Loading complaints...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No complaints found.</p>
          <Link to="/file" className="btn btn-primary">File a Complaint</Link>
        </div>
      ) : (
        <div className="complaint-cards-grid">
          {filtered.map((c) => (
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
          ))}
        </div>
      )}
    </div>
  )
}
