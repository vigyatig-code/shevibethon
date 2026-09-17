import BreakingNews from '../components/BreakingNews'

export default function NewsPage() {
  return (
    <div className="civic-inner-page-wrap">
      <div className="civic-inner-page-header">
        <h1 className="civic-inner-page-title">Breaking News</h1>
        <p className="civic-inner-page-subtitle">
          Civic problems and solutions from across India — infrastructure, sanitation, transport, environment, and urban governance updates.
        </p>
      </div>
      <BreakingNews />
    </div>
  )
}
