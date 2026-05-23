import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function VerifyPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [status, setStatus] = useState('pending')
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
        // First visit: user hasn't been to Stripe yet — send them there
        if (!returnedFromStripe) {
          window.location.href = res.data.url
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
        <img src="/full-logo.png" alt="Connect" className="h-8 mx-auto mb-8" />

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
