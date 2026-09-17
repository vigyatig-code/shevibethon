import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import Layout from './components/Layout'
import Home from './pages/Home'
import FileComplaint from './pages/FileComplaint'
import TrackComplaint from './pages/TrackComplaint'
import ComplaintList from './pages/ComplaintList'
import Insights from './pages/Insights'
import AccessibilityPage from './pages/AccessibilityPage'
import MapPage from './pages/MapPage'
import MapViewPage from './pages/MapViewPage'
import OpeningSplash from './components/OpeningSplash'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  const dismissSplash = useCallback(() => setShowSplash(false), [])

  return (
    <>
      {showSplash && <OpeningSplash onComplete={dismissSplash} />}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/file" element={<FileComplaint />} />
          <Route path="/track" element={<TrackComplaint />} />
          <Route path="/track/:trackingNumber" element={<TrackComplaint />} />
          <Route path="/complaints" element={<ComplaintList />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
          <Route path="/disability-support" element={<Navigate to="/accessibility" replace />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/map-view" element={<MapViewPage />} />
        </Route>
      </Routes>
    </>
  )
}
