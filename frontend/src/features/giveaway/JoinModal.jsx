import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiX } from 'react-icons/fi'
import { CATEGORIES, startJoin, verifyJoin, errorMessage } from './giveawayApi'
import { SnowDrift } from './XmasDecor'

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

// Loads Cloudflare's script once for the whole page.
let turnstileLoad = null
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!turnstileLoad) {
    turnstileLoad = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = TURNSTILE_SRC
      s.async = true
      s.onload = () => resolve(window.turnstile)
      s.onerror = () => { turnstileLoad = null; reject(new Error('Security check could not load')) }
      document.head.appendChild(s)
    })
  }
  return turnstileLoad
}

// The "I am a person" box. Without a site key (local development) there is no box and the
// backend skips the check too, as long as it has no secret key either.
function Turnstile({ onToken }) {
  const box = useRef(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    // Local development only: the backend skips the check when it has no secret either.
    if (!SITE_KEY) { if (import.meta.env.DEV) onToken('dev'); return }
    let widgetId = null
    let gone = false
    loadTurnstile().then((ts) => {
      if (gone || !box.current) return
      widgetId = ts.render(box.current, {
        sitekey: SITE_KEY,
        theme: 'dark',
        callback: (t) => onToken(t),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      })
    }).catch(() => setFailed(true))
    return () => {
      gone = true
      if (widgetId !== null) window.turnstile?.remove(widgetId)
    }
  }, [onToken])
  if (!SITE_KEY) {
    return import.meta.env.DEV ? null : (
      // A live build made without VITE_TURNSTILE_SITE_KEY: say so instead of failing on submit.
      <p className="text-sm text-amber-100">Joining is not open yet: the security check is still being set up.</p>
    )
  }
  return (
    <div>
      <div ref={box} className="min-h-16.25" />
      {failed && <p className="text-sm text-amber-100">The security check could not load. Please turn off any blocker and reload.</p>}
    </div>
  )
}

const INPUT = 'xmas-input px-4 py-3'

export default function JoinModal({ onClose, onJoined }) {
  const [step, setStep] = useState('details') // details | code
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState('')
  const [returning, setReturning] = useState(false)
  const [code, setCode] = useState('')
  const [turnstileToken, setTurnstileToken] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [widgetKey, setWidgetKey] = useState(0)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  async function sendCode(e) {
    e?.preventDefault()
    setError('')
    setNotice('')
    if (!returning && !category) { setError('Please choose what best describes you.'); return }
    if (!turnstileToken) { setError('Please complete the security check.'); return }
    setBusy(true)
    try {
      await startJoin({ email, category: returning ? undefined : category, turnstileToken })
      setStep('code')
      setNotice(`We sent a 6 digit code to ${email.trim()}. It can take a minute to arrive, so check your spam folder too.`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
      // A Turnstile token works once, so get a fresh one for the next request.
      setTurnstileToken(null)
      setWidgetKey((k) => k + 1)
    }
  }

  async function checkCode(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await verifyJoin({ email, code, category: returning ? undefined : category })
      onJoined()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    // Scrolls as a whole on short screens, like the wheel popup. A click outside closes it.
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="xmas-join-title">
      <div className="flex min-h-full items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <div className="xmas-panel xmas-pop w-full max-w-md rounded-[1.75rem] px-6 pb-12 pt-6">
        <button type="button" onClick={onClose} aria-label="Close" disabled={busy}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/60 bg-black/25 hover:bg-black/40">
          <FiX aria-hidden="true" />
        </button>
        <div className="relative z-10">
        <p className="xmas-eyebrow text-[11px] font-bold uppercase tracking-[0.25em] text-amber-300">25 Days of Christmas</p>

        {step === 'details' ? (
          <form onSubmit={sendCode} noValidate>
            <h2 id="xmas-join-title" className="mt-1 text-center text-2xl font-extrabold">{returning ? 'Welcome back' : 'Join the giveaway'}</h2>
            <p className="mt-1 text-center text-sm text-white/80">
              {returning ? 'Enter the email you joined with and we will send you a code.' : 'Free to join. One spin every day from 1 to 25 December.'}
            </p>

            <label className="mt-5 block text-sm font-medium" htmlFor="xmas-email">Email</label>
            <input id="xmas-email" type="email" autoComplete="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} className={`${INPUT} mt-1.5`} placeholder="you@company.com" />

            {!returning && (
              <>
                <p className="mt-4 text-sm font-medium" id="xmas-cat-label">What best describes you?</p>
                <div className="mt-2 grid gap-2" role="radiogroup" aria-labelledby="xmas-cat-label">
                  {CATEGORIES.map((c) => (
                    <label key={c.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                      category === c.value ? 'border-amber-300 bg-amber-300/15' : 'border-amber-200/20 bg-black/20 hover:bg-black/30'}`}>
                      <input type="radio" name="xmas-category" value={c.value} checked={category === c.value}
                        onChange={() => setCategory(c.value)} className="accent-amber-400" />
                      {c.label}
                    </label>
                  ))}
                </div>
              </>
            )}

            <div className="mt-4"><Turnstile key={widgetKey} onToken={setTurnstileToken} /></div>

            {!returning && (
              <p className="mt-3 text-xs text-white/55">
                By joining you confirm you are 18 or over and agree to the <Link to="/christmas/terms" className="underline hover:text-white" target="_blank">giveaway terms</Link>.
              </p>
            )}
            {error && <p className="mt-3 text-sm text-amber-100" role="alert">{error}</p>}

            <button type="submit" disabled={busy || !email.trim()}
              className="xmas-btn-gold mt-5 w-full px-6 py-3.5 text-lg">
              {busy ? 'Sending…' : 'Send my code'}
            </button>
            <button type="button" onClick={() => { setReturning((r) => !r); setError('') }}
              className="mt-3 w-full text-center text-sm text-white/70 underline hover:text-white">
              {returning ? 'New here? Join the giveaway' : 'Already joined? Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={checkCode} noValidate>
            <h2 id="xmas-join-title" className="mt-1 text-center text-2xl font-extrabold">Check your email</h2>
            {notice && <p className="mt-1 text-center text-sm text-white/80">{notice}</p>}
            <label className="mt-5 block text-sm font-medium" htmlFor="xmas-code">6 digit code</label>
            <input id="xmas-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className={`${INPUT} mt-1.5 text-center font-mono text-2xl tracking-[0.5em]`} placeholder="••••••" />
            {error && <p className="mt-3 text-sm text-amber-100" role="alert">{error}</p>}
            <button type="submit" disabled={busy || code.length !== 6}
              className="xmas-btn-gold mt-5 w-full px-6 py-3.5 text-lg">
              {busy ? 'Checking…' : returning ? 'Sign in' : 'Join the giveaway'}
            </button>

            <div className="mt-4"><Turnstile key={widgetKey} onToken={setTurnstileToken} /></div>
            <div className="mt-2 flex justify-between text-sm text-white/70">
              <button type="button" onClick={() => { setStep('details'); setCode(''); setError('') }} className="underline hover:text-white">Change email</button>
              <button type="button" onClick={sendCode} disabled={busy || !turnstileToken} className="underline hover:text-white disabled:opacity-40">Send a new code</button>
            </div>
          </form>
        )}
        </div>
        <SnowDrift className="h-10" />
      </div>
      </div>
    </div>
  )
}
