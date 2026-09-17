import HeroSection from '../components/HeroSection'
import ImpactMetrics from '../components/ImpactMetrics'
import PriorityCards from '../components/PriorityCards'
import ImpactTimeline from '../components/ImpactTimeline'
import CommunityVoice from '../components/CommunityVoice'
import FeaturedInitiatives from '../components/FeaturedInitiatives'
import NearbyIssues from '../components/NearbyIssues'
import TestimonialCarousel from '../components/TestimonialCarousel'
import ParticipationCTA from '../components/ParticipationCTA'
import DomeGallery from '../components/DomeGallery'
import DepthText from '../components/DepthText'
import SplitFlapText from '../components/SplitFlapText'

// Home: assembles all front-page sections in order.
// Each section is a self-contained component with its own
// scroll reveal and animation logic. The AnimatedBackground
// and ScrollProgress are rendered by Layout.
export default function Home() {
  return (
    <div className="civic-home">
      <HeroSection />
      <ImpactMetrics />
      <PriorityCards />
      <ImpactTimeline />
      <section className="civic-dome-gallery-section" aria-label="Solved civic issues gallery">
        <div className="civic-dome-gallery-header">
          <h2 className="civic-dome-gallery-title">Issues resolved, visible progress</h2>
          <p className="civic-dome-gallery-subtitle">
            Drag to explore photos of civic problems that have been fixed across the city. Click any image to see it up close.
          </p>
        </div>
        <div className="civic-dome-gallery-container">
          <DomeGallery
            grayscale={false}
            overlayBlurColor="transparent"
            dragSensitivity={12}
            dragDampening={0.4}
            maxVerticalRotationDeg={10}
            autoRotateSpeed={0.08}
          />
        </div>
        <p className="civic-dome-gallery-hint">Drag to rotate &middot; Click an image to enlarge</p>
      </section>
      <CommunityVoice />
      <NearbyIssues />
      <FeaturedInitiatives />
      <TestimonialCarousel />
      <ParticipationCTA />

      <section className="civic-improve-next" aria-label="What should we improve next">
        <div className="civic-improve-next-inner">
          <DepthText
            text="What's Next?"
            layers={34}
            depth={2.4}
            faceColor="#f9f4ec"
            depthColor="#a96545"
            tilt={7.5}
            pointerTracking
            smoothing={0.14}
            perspective={900}
            autoOrbit
            orbitSpeed={0.35}
            fontSize="clamp(2.5rem, 10vw, 6rem)"
            fontWeight={900}
            shadow
          />
          <div className="civic-improve-next-flap">
            <SplitFlapText
              words={['DROP A SUGGESTION', 'SHARE YOUR VOICE', 'TELL US WHAT MATTERS']}
              flipDuration={0.12}
              stagger={0.06}
              cycleDelay={2400}
              charset="alphanumeric"
              flipsPerChar={8}
              tileColor="#4a3828"
              textColor="#f9f4ec"
              tileRadius={6}
              gap={4}
              fontSize={28}
              loop
              padTo={20}
            />
          </div>
          <p className="civic-improve-next-subtitle">
            Help shape the future of your city. Tell us what civic issues matter most to you and your community.
          </p>
        </div>
      </section>
    </div>
  )
}
