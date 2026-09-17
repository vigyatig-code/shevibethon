import { useState, useEffect, useCallback, useRef } from 'react'
import { ExternalLink, RefreshCw, AlertTriangle, Clock, Newspaper } from 'lucide-react'
import { useInView, useReducedMotion, useTilt } from '../lib/hooks'

interface NewsItem {
  id: number
  title: string
  description: string
  url: string
  image: string | null
  source: string
  publishedAt: string
  category: string
}

const categories = [
  { key: 'all', label: 'All Civic News' },
  { key: 'roads', label: 'Roads' },
  { key: 'water', label: 'Water' },
  { key: 'sanitation', label: 'Sanitation' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'general', label: 'General Civic News' },
]

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return `${Math.floor(diff / 60000)}m ago`
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

function NewsCard({ item, index, reduced }: { item: NewsItem; index: number; reduced: boolean }) {
  const tiltRef = useRef<HTMLAnchorElement>(null)
  const tilt = useTilt(tiltRef, !reduced)

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      ref={tiltRef}
      className="civic-news-card"
      style={{ animationDelay: `${index * 0.08}s` }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      {item.image && (
        <div className="civic-news-card-img-wrap">
          <img src={item.image} alt={item.title} loading="lazy" />
          <span className="civic-news-source">{item.source}</span>
        </div>
      )}
      <div className="civic-news-card-body">
        <h3 className="civic-news-card-title">{item.title}</h3>
        <p className="civic-news-card-desc">{item.description}</p>
        <div className="civic-news-card-foot">
          <span className="civic-news-time">
            <Clock size={13} />
            {formatTime(item.publishedAt)}
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
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/news-api`
      const res = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setNews(data.articles ?? [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load news right now.'
      setError(msg)
      setNews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const filteredNews =
    category === 'all' ? news : news.filter((n) => n.category === category)

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
          <p className="civic-section-subtitle">
            Civic problems and solutions from across India — infrastructure, sanitation, transport, environment, and urban governance updates.
          </p>

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
        ) : filteredNews.length === 0 ? (
          <div className="civic-news-empty">
            <Newspaper size={32} />
            <p>No civic news found in the last 30 days. Check back later for updates.</p>
          </div>
        ) : (
          <div className={`civic-news-grid ${inView ? 'civic-reveal' : ''}`}>
            {filteredNews.map((item, index) => (
              <NewsCard key={item.id} item={item} index={index} reduced={reduced} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
