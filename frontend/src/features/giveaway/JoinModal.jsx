import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, startJoin, verifyJoin, errorMessage } from './giveawayApi'

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
      <p className="text-sm text-red-300">Joining is not open yet: the security check is still being set up.</p>
    )
  }
  return (
    <div>
      <div ref={box} className="min-h-16.25" />
      {failed && <p className="text-sm text-red-300">The security check could not load. Please turn off any blocker and reload.</p>}
    </div>
  )
}

const INPUT = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none'

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="xmas-join-title">
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0d2138] p-6 text-white shadow-2xl xmas-pop max-h-[92vh] overflow-y-auto">
        <button type="button" onClick={onClose} aria-label="Close" disabled={busy}
          className="absolute right-4 top-4 h-9 w-9 rounded-full bg-white/10 text-lg leading-none hover:bg-white/20">×</button>

        {step === 'details' ? (
          <form onSubmit={sendCode} noValidate>
            <h2 id="xmas-join-title" className="text-2xl font-bold">{returning ? 'Welcome back' : 'Join the giveaway'}</h2>
            <p className="mt-1 text-sm text-white/70">
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
                      category === c.value ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
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
            {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}

            <button type="submit" disabled={busy || !email.trim()}
              className="mt-5 w-full rounded-2xl bg-linear-to-r from-red-600 to-amber-500 px-6 py-3.5 font-bold disabled:opacity-50 hover:brightness-110">
              {busy ? 'Sending…' : 'Send my code'}
            </button>
            <button type="button" onClick={() => { setReturning((r) => !r); setError('') }}
              className="mt-3 w-full text-center text-sm text-white/70 underline hover:text-white">
              {returning ? 'New here? Join the giveaway' : 'Already joined? Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={checkCode} noValidate>
            <h2 id="xmas-join-title" className="text-2xl font-bold">Check your email</h2>
            {notice && <p className="mt-1 text-sm text-white/70">{notice}</p>}
            <label className="mt-5 block text-sm font-medium" htmlFor="xmas-code">6 digit code</label>
            <input id="xmas-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className={`${INPUT} mt-1.5 text-center font-mono text-2xl tracking-[0.5em]`} placeholder="••••••" />
            {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}
            <button type="submit" disabled={busy || code.length !== 6}
              className="mt-5 w-full rounded-2xl bg-linear-to-r from-red-600 to-amber-500 px-6 py-3.5 font-bold disabled:opacity-50 hover:brightness-110">
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
    </div>
  )
}
