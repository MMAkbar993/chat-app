import { useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

export default function SocialConnectErrorPage() {
  const [params] = useSearchParams()
  const reason = params.get('reason') || 'An unexpected error occurred.'

  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({ type: 'social-connect-error', reason }, '*')
    }
  }, [reason])

  function close() {
    if (window.opener) {
      window.close()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <img src="/full-logo.png" alt="ConnectAR" className="h-8 mb-8" />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">Connection failed</h1>
        <p className="text-gray-500 text-sm mb-6">{reason}</p>

        <div className="flex flex-col gap-2">
          {window.opener ? (
            <button
              onClick={close}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3 font-semibold text-sm transition-colors"
            >
              Close this window
            </button>
          ) : (
            <Link
              to="/chat"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3 font-semibold text-sm transition-colors flex items-center justify-center"
            >
              Go to app
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
