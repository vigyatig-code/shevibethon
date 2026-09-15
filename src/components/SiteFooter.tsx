import { footerContent } from '../lib/civicContent'
import { useLocation } from 'react-router-dom'

// SiteFooter: contact details, office hours, links, newsletter signup,
// and emergency information disclaimer. The Links, Follow us, and
// Newsletter columns are hidden on the Updates and Projects pages.
export default function SiteFooter() {
  const { pathname } = useLocation()
  const hideExtras = pathname === '/track' || pathname === '/complaints'

  return (
    <footer className="civic-footer" role="contentinfo">
      <div className="civic-footer-inner">
        <div className="civic-footer-col">
          <h4 className="civic-footer-title">{footerContent.organization}</h4>
          <p className="civic-footer-text">{footerContent.address}</p>
          <p className="civic-footer-text">{footerContent.phone}</p>
          <p className="civic-footer-text">{footerContent.email}</p>
          <p className="civic-footer-text">{footerContent.hours}</p>
        </div>

        {!hideExtras && (
          <div className="civic-footer-col">
            <h4 className="civic-footer-title">Links</h4>
            <ul className="civic-footer-links">
              {footerContent.links.map((link) => (
                <li key={link.label}>
                  <a href={link.link}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!hideExtras && (
          <div className="civic-footer-col">
            <h4 className="civic-footer-title">Follow us</h4>
            <ul className="civic-footer-links">
              {footerContent.social.map((s) => (
                <li key={s.label}>
                  <a href={s.link}>{s.label}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!hideExtras && (
          <div className="civic-footer-col">
            <h4 className="civic-footer-title">Newsletter</h4>
            <p className="civic-footer-text">Get civic updates delivered to your inbox.</p>
            <form className="civic-footer-newsletter" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Your email" aria-label="Email for newsletter" />
              <button type="submit" className="civic-btn civic-btn-primary civic-btn-sm">Subscribe</button>
            </form>
          </div>
        )}
      </div>

      <div className="civic-footer-disclaimer">
        <p>{footerContent.disclaimer}</p>
        <p>&copy; {new Date().getFullYear()} {footerContent.organization}. All rights reserved.</p>
      </div>
    </footer>
  )
}
