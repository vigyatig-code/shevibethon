import { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { FileText, Search, List, BarChart3, Menu, X, Leaf, Accessibility, Map, MapPin } from 'lucide-react'
import AnimatedBackground from './AnimatedBackground'
import ScrollShapeParticles from './ScrollShapeParticles'
import ScrollProgress from './ScrollProgress'
import SiteFooter from './SiteFooter'
import SplashCursor from './SplashCursor'

const navItems = [
  { to: '/', label: 'About', icon: Leaf, end: true },
  { to: '/file', label: 'Report an Issue', icon: FileText, end: false },
  { to: '/accessibility', label: 'Accessibility', icon: Accessibility, end: false },
  { to: '/complaints', label: 'Projects', icon: List, end: false },
  { to: '/track', label: 'Updates', icon: Search, end: false },
  { to: '/map', label: 'Map', icon: Map, end: false },
  { to: '/map-view', label: 'Map View', icon: MapPin, end: false },
  { to: '/insights', label: 'Get Involved', icon: BarChart3, end: false },
]

export default function Layout() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    </div>
  )
}
