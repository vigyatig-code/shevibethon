import RippleDistortion from '../components/RippleDistortion'
import LeafletMap from '../components/LeafletMap'

export default function MapViewPage() {
  return (
    <div className="mapview-page">
      <div className="mapview-ripple-bg" aria-hidden="true">
        <RippleDistortion
          src="https://images.pexels.com/photos/28678222/pexels-photo-28678222.jpeg?auto=compress&cs=tinysrgb&w=1920"
          brushSize={180}
          strength={0.25}
          swirl={1.5}
          rings={4}
          spread={6}
          fade={4}
          spacing={12}
          glint={0.3}
          tint="#3E2A1C"
          tintAmount={0.15}
          highlightColor="#D8C39E"
          grayscale={false}
          trigger="both"
          clickStrength={2.5}
          quality="medium"
          className="mapview-ripple-canvas"
        />
      </div>
      <div className="mapview-content">
        <LeafletMap />
      </div>
    </div>
  )
}
