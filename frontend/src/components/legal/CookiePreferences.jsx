import { useEffect, useState } from 'react'
import { CONSENT_EVENT, clearConsent, readConsent, setConsent } from '../../utils/cookieConsent'

const LABEL = {
  granted: 'Analytics cookies are on.',
  denied: 'Analytics cookies are off.',
  null: "You haven't chosen yet.",
}

// The "cookie preferences tool" section 6 of the policy promises. Lets someone see the choice
// they made and change it, which is what withdrawing consent has to mean in practice.
export default function CookiePreferences() {
  const [choice, setChoice] = useState(() => readConsent())

  useEffect(() => {
    function sync(e) { setChoice(e.detail ?? null) }
    window.addEventListener(CONSENT_EVENT, sync)
    return () => window.removeEventListener(CONSENT_EVENT, sync)
  }, [])

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 not-prose">
      <p className="text-sm font-semibold text-gray-900">Your cookie preferences</p>
      <p className="text-sm text-gray-600 mt-1">
        {LABEL[choice ?? 'null']} Essential cookies are always on — Pulse cannot sign you in
        without them.
      </p>
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => setConsent('granted')}
          disabled={choice === 'granted'}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Allow analytics
        </button>
        <button
          onClick={() => setConsent('denied')}
          disabled={choice === 'denied'}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Turn analytics off
        </button>
        {choice && (
          <button
            onClick={clearConsent}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Ask me again
          </button>
        )}
      </div>
    </div>
  )
}
