import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FOCUS } from './marketingHelpers'

// The pieces every public marketing page shares — header, footer, section label, closing call
// to action — so the home page and How It Works are visibly the same product and can't drift.

export function Icon({ path, className = 'w-5 h-5' }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  )
}

export function Eyebrow({ children, dark = false }) {
  return (
    <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${dark ? 'bg-white/10 text-violet-300' : 'bg-white text-violet-600'}`}>
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-violet-500" />
      {children}
    </span>
  )
}

// `nav` items are either in-page anchors ("#pricing") or routes ("/how-it-works").
export function MarketingHeader({ nav = [] }) {
  const { user } = useAuth()
  const link = `text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors rounded ${FOCUS}`
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className={`rounded ${FOCUS}`}>
          <img src="/full-logo.png" alt="Pulse home" className="h-7" />
        </Link>
        <nav aria-label="Main" className="hidden lg:flex items-center gap-6">
          {nav.map((n) => (
            n.href.startsWith('#')
              ? <a key={n.href} href={n.href} className={link}>{n.label}</a>
              : <Link key={n.href} to={n.href} className={link}>{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <Link to="/chat" className={`px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors ${FOCUS}`}>
              Go to App
            </Link>
          ) : (
            <>
              <Link to="/login" className={`hidden sm:block px-3 py-2 ${link}`}>
                Sign in
              </Link>
              <Link to="/signup" className={`px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors ${FOCUS}`}>
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// The purple closing block. Same width as the page's text column.
export function CtaBanner({ title, body, buttonLabel, to = '/signup' }) {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto rounded-3xl px-6 sm:px-8 py-12 text-center bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white">
        <h2 className="text-3xl font-extrabold tracking-tight">{title}</h2>
        <p className="mt-3 text-white/85 max-w-xl mx-auto">{body}</p>
        <Link
          to={to}
          className="inline-block mt-7 px-7 py-3 rounded-xl bg-white text-violet-700 font-bold hover:bg-violet-50 transition-colors shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {buttonLabel}
        </Link>
      </div>
    </section>
  )
}

export function MarketingFooter() {
  const link = `hover:text-violet-600 transition-colors rounded ${FOCUS}`
  return (
    <footer className="px-4 sm:px-6 py-10 border-t border-gray-100">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <img src="/full-logo.png" alt="Pulse" className="h-6 opacity-70" />
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <Link to="/" className={link}>Home</Link>
          <Link to="/how-it-works" className={link}>How it works</Link>
          <Link to="/terms" className={link}>Terms</Link>
          <Link to="/privacy" className={link}>Privacy</Link>
          <Link to="/cookies" className={link}>Cookies</Link>
          <Link to="/kyc-policy" className={link}>KYC Policy</Link>
        </nav>
        <p className="text-xs text-gray-500">&copy;{new Date().getFullYear()} Pulse. All rights reserved.</p>
      </div>
    </footer>
  )
}
