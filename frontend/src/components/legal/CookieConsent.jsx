import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CONSENT_EVENT, readConsent, setConsent } from '../../utils/cookieConsent'

// Deliberately not wired to the app's darkMode: this also shows on the public marketing and
// legal pages, which have no such toggle. A dark card reads correctly against both themes.
export default function CookieConsent() {
  const [choice, setChoice] = useState(() => readConsent())

  useEffect(() => {
    // The preferences link on the Cookie Policy page clears the choice, which brings the
    // banner back without a reload.
    function sync(e) { setChoice(e.detail ?? null) }
    window.addEventListener(CONSENT_EVENT, sync)
    return () => window.removeEventListener(CONSENT_EVENT, sync)
  }, [])

  if (choice) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl bg-gray-900 text-gray-200 shadow-2xl ring-1 ring-white/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
        <p className="text-sm leading-relaxed flex-1">
          We use essential cookies to run Pulse. We'd also like to set analytics cookies to
          understand how the app is used — only if you agree.{' '}
          <Link to="/cookies" className="font-medium text-violet-300 hover:text-violet-200 underline underline-offset-2">
            Cookie Policy
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setConsent('denied')}
            className="flex-1 sm:flex-none rounded-xl px-4 py-2 text-sm font-semibold text-gray-300 border border-white/15 hover:bg-white/10 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => setConsent('granted')}
            className="flex-1 sm:flex-none rounded-xl px-5 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
