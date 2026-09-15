import {
  Ear,
  ClipboardList,
  Hammer,
  BarChart3,
  SearchCheck,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { timelineStages } from '../lib/civicContent'
import Carousel, { type CarouselItem } from './Carousel'

const iconMap: Record<string, LucideIcon> = {
  ear: Ear,
  clipboard: ClipboardList,
  hammer: Hammer,
  chart: BarChart3,
  search: SearchCheck,
  refresh: RefreshCw,
  shield: ShieldCheck,
}

function buildCarouselItems(): CarouselItem[] {
  return timelineStages.map((stage) => {
    const Icon = iconMap[stage.icon] ?? Ear
    return {
      id: stage.id,
      title: stage.title,
      description: stage.description,
      icon: <Icon size={16} className="carousel-icon" />,
    }
  })
}

export default function ImpactTimeline() {
  const carouselItems = buildCarouselItems()

  return (
    <section className="civic-timeline-section" aria-label="From idea to impact">
      <div className="civic-section-inner">
        <div className="civic-section-header">
          <h2 className="civic-section-title">From idea to impact</h2>
          <p className="civic-section-subtitle">
            How resident input becomes measurable civic progress.
          </p>
        </div>
        <div className="civic-timeline-carousel">
          <Carousel
            items={carouselItems}
            baseWidth={320}
            autoplay
            autoplayDelay={800}
            pauseOnHover
            loop
          />
        </div>
      </div>
    </section>
  )
}
