import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { FileText, Search, List, BarChart3, Menu, X, Leaf, Accessibility, Map, MapPin, ChevronDown, Newspaper } from 'lucide-react'
import AnimatedBackground from './AnimatedBackground'
import ScrollShapeParticles from './ScrollShapeParticles'
import ScrollProgress from './ScrollProgress'
import SiteFooter from './SiteFooter'
import SplashCursor from './SplashCursor'
import AIAssistant from './AIAssistant'

const navItems = [
  { to: '/', label: 'About', icon: Leaf, end: true },
  { to: '/file', label: 'Report an Issue', icon: FileText, end: false },
  { to: '/accessibility', label: 'Accessibility', icon: Accessibility, end: false },
  { to: '/complaints', label: 'Projects', icon: List, end: false },
  { to: '/track', label: 'Updates', icon: Search, end: false },
  { to: '/news', label: 'News', icon: Newspaper, end: false },
  { to: '/insights', label: 'Get Involved', icon: BarChart3, end: false },
]

const mapSubItems = [
  { to: '/map', label: 'Civic Map', icon: Map },
  { to: '/map-view', label: 'Map View', icon: MapPin },
]

export default function Layout() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const isMapArea = location.pathname === '/map' || location.pathname === '/map-view'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMapOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mapOpen) return
    const onClick = (e: MouseEvent) => {
      if (mapRef.current && !mapRef.current.contains(e.target as Node)) {
        setMapOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [mapOpen])

  return (
    <div className={`civic-app${isHomePage ? '' : ' inner-page'}`}>
      <AnimatedBackground />
      <ScrollShapeParticles />
      <ScrollProgress />
      <SplashCursor />

      <header className={`civic-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="civic-header-inner">
          <Link to="/" className="civic-logo" onClick={() => setMenuOpen(false)}>
            <span className="civic-logo-icon">
              <Leaf size={20} />
            </span>
            <span className="civic-logo-text">Civic Portal</span>
          </Link>

          <div className="civic-header-right">
            <nav className={`civic-nav ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `civic-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}

              {/* Map dropdown */}
              <div className={`civic-nav-dropdown ${isMapArea ? 'active' : ''}`} ref={mapRef}>
                <button
                  type="button"
                  className={`civic-nav-link civic-nav-dropdown-trigger ${mapOpen ? 'open' : ''}`}
                  onClick={() => setMapOpen((o) => !o)}
                  aria-expanded={mapOpen}
                  aria-haspopup="true"
                >
                  <Map size={16} />
                  <span>Map</span>
                  <ChevronDown size={14} className={`civic-nav-dropdown-chevron ${mapOpen ? 'rotated' : ''}`} />
                </button>
                <div className={`civic-nav-submenu ${mapOpen ? 'open' : ''}`}>
                  {mapSubItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) => `civic-nav-submenu-link ${isActive ? 'active' : ''}`}
                      onClick={() => { setMapOpen(false); setMenuOpen(false) }}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>

              <Link to="/file" className="civic-nav-cta" onClick={() => setMenuOpen(false)}>
                Take Action
              </Link>
            </nav>

            <button
              className="civic-menu-toggle"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <main className="civic-main">
        <Outlet />
      </main>

      <SiteFooter />
      <AIAssistant />
    </div>
  )
}
