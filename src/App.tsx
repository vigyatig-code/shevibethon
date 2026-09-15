import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import FileComplaint from './pages/FileComplaint'
import TrackComplaint from './pages/TrackComplaint'
import ComplaintList from './pages/ComplaintList'
import Insights from './pages/Insights'
import AccessibilityPage from './pages/AccessibilityPage'
import MapPage from './pages/MapPage'
import MapViewPage from './pages/MapViewPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/file" element={<FileComplaint />} />
        <Route path="/track" element={<TrackComplaint />} />
        <Route path="/track/:trackingNumber" element={<TrackComplaint />} />
        <Route path="/complaints" element={<ComplaintList />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/map-view" element={<MapViewPage />} />
      </Route>
    </Routes>
  )
}
