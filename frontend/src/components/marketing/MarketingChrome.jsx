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
    <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${dark ? 'bg-white/10 text-violet-300' : 'bg-white night:bg-gray-900 text-violet-600 night:text-violet-300'}`}>
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-violet-500" />
      {children}
    </span>
  )
}

// The logo, linking home. Shared so every marketing header carries the same one.
export function HeaderLogo() {
  return (
    <Link to="/" className={`shrink-0 rounded ${FOCUS}`}>
      <img src="/full-logo.png" alt="Pulse home" className="h-7" />
    </Link>
  )
}

const SUN = 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
const MOON = 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'

// Light/dark switch. Labelled with what it will do, so a screen reader hears the action.
export function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={`w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-gray-100 night:text-gray-400 night:hover:text-violet-300 night:hover:bg-gray-800 transition-colors ${FOCUS}`}
    >
      <Icon path={dark ? SUN : MOON} className="w-5 h-5" />
    </button>
  )
}

// Sign in / Create account, or Go to App for someone already signed in. With `theme`
// ({ dark, onToggle }) the light/dark switch sits in front of them.
export function HeaderActions({ theme }) {
  const { user } = useAuth()
  return (
    <div className="flex items-center gap-2 shrink-0">
      {theme && <ThemeToggle dark={theme.dark} onToggle={theme.onToggle} />}
      {user ? (
        <Link to="/chat" className={`px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors ${FOCUS}`}>
          Go to App
        </Link>
      ) : (
        <>
          <Link to="/login" className={`hidden sm:block px-3 py-2 text-sm font-medium text-gray-600 night:text-gray-300 hover:text-violet-600 night:hover:text-violet-300 transition-colors rounded ${FOCUS}`}>
            Sign in
          </Link>
          <Link to="/signup" className={`px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors ${FOCUS}`}>
            Create account
          </Link>
        </>
      )}
    </div>
  )
}

// `nav` items are either in-page anchors ("#pricing") or routes ("/how-it-works").
export function MarketingHeader({ nav = [], theme }) {
  const link = `text-sm font-medium text-gray-600 night:text-gray-300 hover:text-violet-600 night:hover:text-violet-300 transition-colors rounded ${FOCUS}`
  return (
    <header className="sticky top-0 z-40 bg-white/85 night:bg-gray-950/85 backdrop-blur border-b border-gray-100 night:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <HeaderLogo />
        <nav aria-label="Main" className="hidden lg:flex items-center gap-6">
          {nav.map((n) => (
            n.href.startsWith('#')
              ? <a key={n.href} href={n.href} className={link}>{n.label}</a>
              : <Link key={n.href} to={n.href} className={link}>{n.label}</Link>
          ))}
        </nav>
        <HeaderActions theme={theme} />
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
  const link = `hover:text-violet-600 night:hover:text-violet-300 transition-colors rounded ${FOCUS}`
  return (
    <footer className="px-4 sm:px-6 py-10 border-t border-gray-100 night:border-gray-800">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <img src="/full-logo.png" alt="Pulse" className="h-6 opacity-70" />
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500 night:text-gray-400">
          <Link to="/" className={link}>Home</Link>
          <Link to="/how-it-works" className={link}>How it works</Link>
          <Link to="/terms" className={link}>Terms</Link>
          <Link to="/privacy" className={link}>Privacy</Link>
          <Link to="/cookies" className={link}>Cookies</Link>
          <Link to="/kyc-policy" className={link}>KYC Policy</Link>
        </nav>
        <p className="text-xs text-gray-500 night:text-gray-400">&copy;{new Date().getFullYear()} Pulse. All rights reserved.</p>
      </div>
    </footer>
  )
}
