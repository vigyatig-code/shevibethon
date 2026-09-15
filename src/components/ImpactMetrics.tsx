import { impactMetrics } from '../lib/civicContent'
import { useInView, useCountUp } from '../lib/hooks'

// ImpactMetrics: animated count-up civic metrics that trigger when
// the section enters the viewport. Demo data is clearly labeled.
function MetricCard({ metric, index }: { metric: typeof impactMetrics[0]; index: number }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 })
  const value = useCountUp(metric.value, inView)

  return (
    <div className="civic-metric" ref={ref} style={{ animationDelay: `${index * 0.1}s` }}>
      <span className="civic-metric-value">
        {value.toLocaleString()}{metric.suffix}
      </span>
      <span className="civic-metric-label">{metric.label}</span>
      {metric.isDemo && <span className="civic-demo-tag">Demo data</span>}
    </div>
  )
}

export default function ImpactMetrics() {
  return (
    <section className="civic-impact" aria-label="Civic impact metrics">
      <div className="civic-section-inner">
        <div className="civic-metrics-grid">
          {impactMetrics.map((metric, i) => (
            <MetricCard key={metric.label} metric={metric} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
