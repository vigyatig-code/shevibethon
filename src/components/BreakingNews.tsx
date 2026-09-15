import { useState, useEffect, useCallback, useRef } from 'react'
import { ExternalLink, RefreshCw, AlertTriangle, Clock } from 'lucide-react'
import { useInView, useReducedMotion, useTilt } from '../lib/hooks'

// BreakingNews: displays Indian civic news focused on urban problems
// and their solutions — infrastructure, sanitation, public safety,
// transport, environment, and civic governance. Uses demo data.
// To connect a live API, replace the demo data in fetchNews with a
// real fetch to an Indian news endpoint filtered to civic topics.

interface NewsItem {
  id: number
  title: string
  description: string
  url: string
  image: string
  source: string
  publishedAt: string
}

const demoNews: NewsItem[] = [
  {
    id: 1,
    title: 'Bengaluru BBMP deploys AI-powered waste segregation across 198 wards',
    description: 'Smart bins with sensor-based segregation and GPS-tracked collection vehicles aim to reduce landfill burden by 40% within six months.',
    url: 'https://news.google.com',
    image: 'https://images.unsplash.com/photo-1533233463289-cc5b7c05e35e?auto=format&fit=crop&w=600&q=80',
    source: 'Deccan Herald',
    publishedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 2,
    title: 'Mumbai pothole tracking app resolves 12,000 complaints in monsoon season',
    description: 'The civic body\'s digital grievance system lets citizens geotag potholes, with real-time status updates from allocation to road repair.',
    url: 'https://news.google.com',
    image: 'https://images.unsplash.com/photo-1558129483-30c3e3241b1c?auto=format&fit=crop&w=600&q=80',
    source: 'Mumbai Mirror',
    publishedAt: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: 3,
    title: 'Delhi installs 200 new air quality monitors at traffic junctions',
    description: 'The real-time AQI display boards will help commuters track pollution levels and enable targeted GRAP restrictions in hotspot zones.',
    url: 'https://news.google.com',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    source: 'Times of India',
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 4,
    title: 'Chennai water board launches leak detection dashboard for public tracking',
    description: 'Residents can now report and track water pipeline leaks online, with the metro water department publishing daily repair status updates.',
    url: 'https://news.google.com',
    image: 'https://images.unsplash.com/photo-1559825481-ef54301af05b?auto=format&fit=crop&w=600&q=80',
    source: 'The Hindu',
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: 5,
    title: 'Hyderabad introduces smart streetlights with motion-sensor dimming',
    description: '50,000 LED streetlights across the city now dim when streets are empty and brighten on movement, cutting energy costs by 35%.',
    url: 'https://news.google.com',
    image: 'https://images.unsplash.com/photo-1517479272896-3f0aa1b5f1e9?auto=format&fit=crop&w=600&q=80',
    source: 'Indian Express',
    publishedAt: new Date(Date.now() - 28800000).toISOString(),
  },
  {
    id: 6,
    title: 'Pune municipal corporation opens 24x7 public grievance redressal centers',
    description: 'Twelve ward-level help desks now accept complaints round the clock for sanitation, streetlights, water, and drainage issues with SLA-based tracking.',
    url: 'https://news.google.com',
    image: 'https://images.unsplash.com/photo-1582719471384-89c3f0f5e4f2?auto=format&fit=crop&w=600&q=80',
    source: 'NDTV',
    publishedAt: new Date(Date.now() - 43200000).toISOString(),
  },
]

const categories = [
  { key: 'all', label: 'All Civic News' },
  { key: 'sanitation', label: 'Sanitation & Waste' },
  { key: 'transport', label: 'Transport & Roads' },
  { key: 'environment', label: 'Environment' },
  { key: 'governance', label: 'Civic Governance' },
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
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.15 })
  const reduced = useReducedMotion()

  const fetchNews = useCallback(() => {
    setLoading(true)
    // Demo data — replace with a live Indian civic news API call here.
    // Example: fetch from gnews.io with query "civic OR municipal OR infrastructure"
    setTimeout(() => {
      setNews(demoNews)
      setLoading(false)
    }, 500)
  }, [])

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
        ) : (
          <div className={`civic-news-grid ${inView ? 'civic-reveal' : ''}`}>
            {news.map((item, index) => (
              <NewsCard key={item.id} item={item} index={index} reduced={reduced} />
            ))}
          </div>
        )}

        <div className="civic-news-footer">
          <span className="civic-demo-tag">Demo data</span>
          <span className="civic-news-note">Replace with a live Indian civic news API to show real-time updates.</span>
        </div>
      </div>
    </section>
  )
}
