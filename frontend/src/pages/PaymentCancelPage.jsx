import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function PaymentCancelPage() {
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({ type: 'payment-cancel' }, window.location.origin)
      window.close()
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Payment cancelled</h1>
        <p className="text-gray-500 text-sm mb-6">
          You cancelled the payment setup. You can complete this step at any time to activate your account.
        </p>
        <Link
          to="/verify"
          className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3 font-semibold text-sm transition-colors flex items-center justify-center"
        >
          Go back to verification
        </Link>
      </div>
    </div>
  )
}
