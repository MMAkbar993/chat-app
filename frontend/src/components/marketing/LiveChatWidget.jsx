import { useEffect, useState } from 'react'
import { contactSupport } from '../../api/support'
import { apiErrorMessage } from '../../utils/apiError'
import { readConsent, CONSENT_EVENT } from '../../utils/cookieConsent'

// "Hi. Need any help?" in the corner of the public pages.
//
// With VITE_CRISP_WEBSITE_ID set, the bubble opens Crisp live chat. Crisp is only loaded when a
// visitor clicks, so nobody who never asks for help loads a third-party script. Without it, the
// bubble opens a short message form that emails support (POST /api/support/contact), and the
// visitor gets the answer by email.
const CRISP_ID = import.meta.env.VITE_CRISP_WEBSITE_ID
const GREETING_KEY = 'pulse:helpGreetingDismissed'
const CHAT_ICON = 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
const X_ICON = 'M6 18L18 6M6 6l12 12'

function Icon({ d, className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  )
}

function openCrisp() {
  if (!window.$crisp) {
    window.$crisp = []
    window.CRISP_WEBSITE_ID = CRISP_ID
    const s = document.createElement('script')
    s.src = 'https://client.crisp.chat/l.js'
    s.async = true
    document.head.appendChild(s)
  }
  // Queued until Crisp has loaded, then run.
  window.$crisp.push(['do', 'chat:show'])
  window.$crisp.push(['do', 'chat:open'])
}

function greetingDismissed() {
  try { return localStorage.getItem(GREETING_KEY) === '1' } catch { return false }
}

function MessageForm({ dark, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', message: '', website: '' })
  const [state, setState] = useState('idle') // idle | sending | sent
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setState('sending')
    try {
      await contactSupport({ ...form, page: window.location.pathname })
      setState('sent')
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send your message. Please try again.'))
      setState('idle')
    }
  }

  const field = `w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400 ${
    dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
  }`
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div
      role="dialog"
      aria-label="Message the Pulse team"
      className={`w-[min(22rem,calc(100vw-2rem))] rounded-2xl shadow-2xl overflow-hidden ring-1 ${dark ? 'bg-gray-900 ring-gray-800' : 'bg-white ring-gray-100'}`}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3.5 bg-linear-to-br from-violet-600 to-fuchsia-600 text-white">
        <div>
          <p className="font-semibold">Hi there 👋</p>
          <p className="text-sm text-white/85">Send us a message and we'll reply by email.</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 hover:bg-white/15">
          <Icon d={X_ICON} className="w-4 h-4" />
        </button>
      </div>

      {state === 'sent' ? (
        <div className="px-4 py-6 text-center">
          <p className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Thanks, we've got your message.</p>
          <p className={`mt-1 text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>We'll reply to {form.email}.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="p-4 space-y-2.5">
          <input className={field} placeholder="Your name" value={form.name} onChange={set('name')} maxLength={100} required autoComplete="name" />
          <input className={field} type="email" placeholder="Your email" value={form.email} onChange={set('email')} maxLength={254} required autoComplete="email" />
          <textarea className={`${field} resize-none`} rows={4} placeholder="How can we help?" value={form.message} onChange={set('message')} maxLength={2000} required />
          {/* left empty by people; bots fill it in */}
          <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={form.website} onChange={set('website')} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={state === 'sending'}
            className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 transition-colors"
          >
            {state === 'sending' ? 'Sending…' : 'Send message'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function LiveChatWidget({ dark = false }) {
  const [open, setOpen] = useState(false)
  const [crispOpened, setCrispOpened] = useState(false)
  const [showGreeting, setShowGreeting] = useState(false)
  // On phones the cookie banner spans the bottom of the screen; stay out of its way until the
  // visitor has answered it.
  const [consentPending, setConsentPending] = useState(() => readConsent() == null)

  useEffect(() => {
    const onConsent = () => setConsentPending(readConsent() == null)
    window.addEventListener(CONSENT_EVENT, onConsent)
    return () => window.removeEventListener(CONSENT_EVENT, onConsent)
  }, [])

  useEffect(() => {
    if (greetingDismissed()) return
    const t = setTimeout(() => setShowGreeting(true), 2500)
    return () => clearTimeout(t)
  }, [])

  function dismissGreeting() {
    setShowGreeting(false)
    try { localStorage.setItem(GREETING_KEY, '1') } catch { /* just not remembered */ }
  }

  function launch() {
    setShowGreeting(false)
    if (CRISP_ID) {
      openCrisp()
      setCrispOpened(true) // Crisp brings its own button from here on
      return
    }
    setOpen((o) => !o)
  }

  if (crispOpened) return null

  return (
    <div className={`fixed bottom-12 right-4 z-60 flex-col items-end gap-3 ${consentPending ? 'hidden sm:flex' : 'flex'}`}>
      {open && <MessageForm dark={dark} onClose={() => setOpen(false)} />}

      <div className="flex items-center gap-2">
        {showGreeting && !open && (
          <div className="flex items-center gap-1">
            <button
              onClick={dismissGreeting}
              aria-label="Hide"
              className={`w-7 h-7 rounded-full flex items-center justify-center shadow ring-1 ${
                dark ? 'bg-gray-800 text-gray-300 ring-gray-700' : 'bg-white text-gray-500 ring-gray-200'
              }`}
            >
              <Icon d={X_ICON} className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={launch}
              className={`rounded-2xl px-4 py-2.5 text-sm font-medium shadow-lg ring-1 ${
                dark ? 'bg-gray-800 text-white ring-gray-700' : 'bg-white text-gray-900 ring-gray-100'
              }`}
            >
              Hi. Need any help?
            </button>
          </div>
        )}
        <button
          onClick={launch}
          aria-label={open ? 'Close help' : 'Chat with us'}
          aria-expanded={open}
          className="w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow-xl shadow-violet-600/30 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
        >
          <Icon d={open ? X_ICON : CHAT_ICON} className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
