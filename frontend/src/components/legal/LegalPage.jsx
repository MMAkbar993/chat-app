import { Link } from 'react-router-dom'

export function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-600 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export function SubSection({ title, children }) {
  return (
    <div>
      {title && <h3 className="text-base font-bold text-gray-800 mb-1.5">{title}</h3>}
      <div className="space-y-2">{children}</div>
    </div>
  )
}

export function LegalList({ items }) {
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}

const LEGAL_LINKS = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/cookies', label: 'Cookie Policy' },
  { to: '/kyc-policy', label: 'KYC Policy' },
  { to: '/login', label: 'Sign In' },
]

export default function LegalPage({ title, effectiveDate, lastUpdated, children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <img src="/full-logo.png" alt="Pulse" className="h-8" />
          </Link>
          <Link to="/login" className="text-sm text-violet-600 hover:underline font-medium">
            Back to Sign In
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500 text-sm mb-10">
          Effective Date: {effectiveDate} &middot; Last Updated: {lastUpdated}
        </p>

        {children}
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-400">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6">
          {LEGAL_LINKS.map((l, i) => (
            <span key={l.to} className="flex items-center gap-4">
              <Link to={l.to} className="hover:text-violet-600">{l.label}</Link>
              {i < LEGAL_LINKS.length - 1 && <span>&middot;</span>}
            </span>
          ))}
        </div>
      </footer>
    </div>
  )
}
