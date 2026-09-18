import { useState, useEffect, useCallback, useRef } from 'react'
import { ExternalLink, RefreshCw, AlertTriangle, Clock, Newspaper } from 'lucide-react'
import { useInView, useReducedMotion, useTilt } from '../lib/hooks'
import { supabase } from '../lib/supabase'

interface NewsItem {
  id: string
  title: string
  link: string
  source: string | null
  category: string
  published_at: string | null
}

const categories = [
  { key: 'all', label: 'All Civic News' },
  { key: 'Roads', label: 'Roads' },
  { key: 'Water', label: 'Water' },
  { key: 'Sanitation', label: 'Sanitation' },
  { key: 'Electricity', label: 'Electricity' },
  { key: 'Disasters & Emergencies', label: 'Disasters & Emergencies' },
  { key: 'General Civic News', label: 'General Civic News' },
]

function formatTime(iso: string | null): string {
  if (!iso) return 'Recently'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0) return 'Just now'
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return `${Math.max(1, Math.floor(diff / 60000))}m ago`
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

function NewsCard({ item, index, reduced }: { item: NewsItem; index: number; reduced: boolean }) {
  const tiltRef = useRef<HTMLAnchorElement>(null)
  const tilt = useTilt(tiltRef, !reduced)

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      ref={tiltRef}
      className="civic-news-card"
      style={{ animationDelay: `${index * 0.08}s` }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <div className="civic-news-card-body">
        <h3 className="civic-news-card-title">{item.title}</h3>
        <p className="civic-news-card-desc">{item.source || 'Google News'}</p>
        <div className="civic-news-card-foot">
          <span className="civic-news-time">
            <Clock size={13} />
            {formatTime(item.published_at)}
          </span>
          <span className="civic-news-read">
            Read article <ExternalLink size={13} />
          </span>
        </div>
      </div>
    </a>
  )
}

export default function BreakingNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [error, setError] = useState<string | null>(null)
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.15 })
  const reduced = useReducedMotion()

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('news')
        .select('id, title, link, source, category, published_at')
        .order('published_at', { ascending: false })
        .limit(20)

      if (category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError
      setNews(data ?? [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load news right now.'
      setError(msg)
      setNews([])
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  return (
    <section className="civic-news" aria-label="Breaking News">
      <div className="civic-section-inner" ref={ref}>
        <div className="civic-news-header">
          <div className="civic-news-title-row">
            <div className="civic-news-badge">
              <AlertTriangle size={20} />
              <span>Breaking</span>
            </div>
            <h2 className="civic-section-title">Breaking News</h2>
            <span className="civic-news-live">
              <span className={`civic-live-dot ${!reduced ? 'civic-live-pulse' : ''}`} />
              Live
            </span>
          </div>

          <div className="civic-news-controls">
            <div className="civic-news-cats" role="tablist" aria-label="News categories">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  className={`civic-news-cat ${category === cat.key ? 'active' : ''}`}
                  onClick={() => setCategory(cat.key)}
                  role="tab"
                  aria-selected={category === cat.key}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <button
              className="civic-news-refresh"
              onClick={fetchNews}
              disabled={loading}
              aria-label="Refresh news"
            >
              <RefreshCw size={18} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="civic-news-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="civic-news-skeleton">
                <div className="civic-news-skeleton-img" />
                <div className="civic-news-skeleton-line w-75" />
                <div className="civic-news-skeleton-line w-100" />
                <div className="civic-news-skeleton-line w-50" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="civic-news-empty">
            <Newspaper size={32} />
            <p>{error}</p>
          </div>
        ) : news.length === 0 ? (
          <div className="civic-news-empty">
            <Newspaper size={32} />
            <p>No civic news found. Check back later for updates.</p>
          </div>
        ) : (
          <div className={`civic-news-grid ${inView ? 'civic-reveal' : ''}`}>
            {news.map((item, index) => (
              <NewsCard key={item.id} item={item} index={index} reduced={reduced} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
