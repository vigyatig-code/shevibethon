import { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { FileText, Search, List, BarChart3, Menu, X, Leaf, Accessibility, Map, MapPin, Heart, LogIn, LogOut, UserCircle } from 'lucide-react'
import AnimatedBackground from './AnimatedBackground'
import ScrollShapeParticles from './ScrollShapeParticles'
import ScrollProgress from './ScrollProgress'
import SiteFooter from './SiteFooter'
import SplashCursor from './SplashCursor'
import SignInModal from './SignInModal'
import { useAuth } from '../lib/auth'

const navItems = [
  { to: '/', label: 'About', icon: Leaf, end: true },
  { to: '/file', label: 'Report an Issue', icon: FileText, end: false },
  { to: '/disability-support', label: 'Disability Support', icon: Heart, end: false },
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
  const [signInOpen, setSignInOpen] = useState(false)
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const { isSignedIn, profile, signOut, needsProfile } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (needsProfile) {
      setSignInOpen(true)
    }
  }, [needsProfile])

  const displayName = profile?.full_name || profile?.phone || 'Account'

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

          <div className="civic-auth-area">
            {isSignedIn ? (
              <div className="civic-user-chip">
                <UserCircle size={18} />
                <span className="civic-user-chip-name">{displayName}</span>
                <button className="civic-sign-out-btn" onClick={signOut} aria-label="Sign out" title="Sign out">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button className="civic-sign-in-btn" onClick={() => setSignInOpen(true)}>
                <LogIn size={16} />
                <span>Sign In</span>
              </button>
            )}
          </div>

          <button
            className="civic-menu-toggle"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <main className="civic-main">
        <Outlet />
      </main>

      <SiteFooter />

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  )
}
