import { useEffect } from 'react'

export default function PaymentSuccessPage() {
  useEffect(() => {
    // Signal parent window if opened as popup
    if (window.opener) {
      window.opener.postMessage({ type: 'payment-success' }, window.location.origin)
      window.close()
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Payment saved!</h1>
        <p className="text-gray-500 text-sm">Your card details have been saved. You won't be charged until your identity is verified.</p>
      </div>
    </div>
  )
}
