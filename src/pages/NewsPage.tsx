import BreakingNews from '../components/BreakingNews'

export default function NewsPage() {
  return (
    <div className="civic-inner-page-wrap">
      <div className="breaking-news-marquee" aria-label="Breaking News ticker">
        <div className="breaking-news-marquee-track">
          <span className="breaking-news-marquee-text">BREAKING NEWS</span>
          <span className="breaking-news-marquee-text">BREAKING NEWS</span>
          <span className="breaking-news-marquee-text">BREAKING NEWS</span>
          <span className="breaking-news-marquee-text">BREAKING NEWS</span>
          <span className="breaking-news-marquee-text">BREAKING NEWS</span>
          <span className="breaking-news-marquee-text">BREAKING NEWS</span>
        </div>
      </div>
      <BreakingNews />
    </div>
  )
}
