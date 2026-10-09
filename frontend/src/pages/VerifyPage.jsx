import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

// Same promise, same words, as the How It Works page — both rest on the Help Center's retention
// answer (the ID provider deletes verification data within a month; Pulse keeps only the
// verification status). Change one, change the other.
function IdDataNote() {
  return (
    <div className="flex gap-3 rounded-xl bg-green-50 px-4 py-3 text-left">
      <svg className="w-4 h-4 mt-0.5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <p className="text-sm text-green-800 leading-relaxed">
        <span className="font-semibold">Your ID data is not kept.</span> Your documents and selfie
        are automatically deleted after 30 days. Pulse only keeps a record that your identity was
        verified.
      </p>
    </div>
  )
}

const CHECK = 'M5 13l4 4L19 7'

export default function VerifyPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [status, setStatus] = useState(() =>
    new URLSearchParams(window.location.search).has('session_id') ? 'pending' : 'loading'
  )
  const [introUrl, setIntroUrl] = useState(null)
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    let interval
    let stopped = false
    const returnedFromStripe = new URLSearchParams(window.location.search).has('session_id')

    async function init() {
      try {
        const res = await client.post('/kyc/create-session')
        if (!res.data.url) {
          // Dev bypass — backend already set status to verified, go straight to dashboard
          if (!stopped) {
            await refreshUser()
            navigate('/dashboard')
          }
          return
        }
        // First visit: say what is about to happen, and what happens to the ID afterwards,
        // before sending them to the provider.
        if (!returnedFromStripe) {
          if (!stopped) {
            setIntroUrl(res.data.url)
            setStatus('intro')
          }
          return
        }
      } catch {
        // Session already exists or Stripe not needed — fall through to polling
      }

      async function poll() {
        try {
          const res = await client.get('/kyc/status')
          const { kyc_status } = res.data
          if (stopped) return
          setStatus(kyc_status)
          if (kyc_status === 'verified') {
            clearInterval(interval)
            await refreshUser()
            setTimeout(() => navigate('/dashboard'), 1500)
          } else if (kyc_status === 'failed') {
            clearInterval(interval)
          }
        } catch {
          // keep polling silently
        }
      }

      poll()
      interval = setInterval(poll, 3000)
    }

    init()

    return () => {
      stopped = true
      clearInterval(interval)
    }
  }, [navigate])

  async function handleRetry() {
    setRetrying(true)
    setError('')
    try {
      const res = await client.post('/kyc/create-session')
      window.location.href = res.data.url
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start verification. Please try again.')
      setRetrying(false)
    }
  }

  return (
    <div className="min-h-screen bg-lavender flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <img src="/full-logo.png" alt="Pulse" className="h-8 mx-auto mb-8" />

        {status === 'loading' && (
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto my-6" />
        )}

        {status === 'intro' && (
          <>
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l1.5 1.5 3.75-3.75M12 3l7 3v5c0 4.5-3 8.25-7 9.5-4-1.25-7-5-7-9.5V6l7-3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verify your identity</h2>
            <p className="text-gray-500 text-sm mb-6">
              Every Pulse member is verified, so you always know who you're talking to.
              Verification is handled securely by our partner Didit.
            </p>

            <ul className="space-y-2.5 text-left mb-6">
              {['A valid government-issued ID', 'Your camera, for a quick selfie to confirm it\'s you'].map((t) => (
                <li key={t} className="flex gap-2.5 text-sm text-gray-700">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={CHECK} />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>

            <IdDataNote />

            <button
              onClick={() => { window.location.href = introUrl }}
              className="mt-6 w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
            >
              Start verification
            </button>
            <p className="mt-3 text-xs text-gray-400">
              Read our{' '}
              <Link to="/kyc-policy" target="_blank" className="text-violet-600 hover:underline">KYC Policy</Link>
              {' '}and{' '}
              <Link to="/privacy" target="_blank" className="text-violet-600 hover:underline">Privacy Policy</Link>
            </p>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Your Identity</h2>
            <p className="text-gray-500 text-sm">
              We are processing your identity verification. This usually takes a few minutes.
              Please keep this page open.
            </p>
          </>
        )}

        {status === 'verified' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Identity Verified!</h2>
            <p className="text-gray-500 text-sm">Redirecting you to your dashboard...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-500 text-sm mb-6">
              We could not verify your identity. Please try again with a valid government-issued ID.
            </p>
            <div className="mb-6"><IdDataNote /></div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
                {error}
              </div>
            )}
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl px-6 py-3 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
            >
              {retrying && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
