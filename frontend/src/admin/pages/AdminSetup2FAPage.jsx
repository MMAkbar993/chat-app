import { useState } from 'react'
import axios from 'axios'
import { useAdminAuth } from '../context/AdminAuthContext'
import { getAdminToken } from '../api/adminClient'

// 2FA is mandatory for admin accounts (not just optional like it is for regular users) — this
// page is a hard gate rendered instead of the normal admin layout until setup completes. It calls
// the regular /api/auth/2fa/* endpoints (shared with normal users — authMiddleware resolves by
// user id regardless of isAdmin, and an admin token satisfies it fine), not /api/admin/*, so this
// deliberately uses its own one-off axios call with the admin token attached manually rather than
// either of the app's two existing shared clients (avoids mixing admin-token state into the
// regular user client, or vice versa).
const authApi = axios.create({ baseURL: '/api' })
authApi.interceptors.request.use((config) => {
  const token = getAdminToken()
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

export default function AdminSetup2FAPage() {
  const { setAdmin } = useAdminAuth()
  const [setupData, setSetupData] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function startSetup() {
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.post('/auth/2fa/setup')
      setSetupData(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start setup')
    } finally {
      setLoading(false)
    }
  }

  async function confirmEnable(e) {
    e.preventDefault()
    if (code.length !== 6) { setError('Enter the 6-digit code'); return }
    setError('')
    setLoading(true)
    try {
      await authApi.post('/auth/2fa/enable', { code })
      setAdmin((prev) => ({ ...prev, mustSetup2FA: false }))
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Set Up Two-Factor Authentication</h1>
          <p className="text-slate-400 text-sm mt-1">Required for all admin accounts before you can continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>
          )}

          {!setupData ? (
            <button
              onClick={startSetup}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-3 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Start Setup
            </button>
          ) : (
            <form onSubmit={confirmEnable} className="space-y-4">
              <p className="text-sm text-gray-600">
                1. Install an authenticator app (Google Authenticator, Authy, etc.).<br />
                2. Scan the QR code below.<br />
                3. Enter the 6-digit code to confirm.
              </p>
              <div className="flex justify-center">
                <img src={setupData.qrCode} alt="2FA QR Code" className="w-44 h-44 rounded-xl border border-gray-200" />
              </div>
              <p className="text-xs text-center text-gray-500">
                Can't scan? Use code: <span className="font-mono font-bold">{setupData.secret}</span>
              </p>
              <input
                type="text" inputMode="numeric" value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required maxLength={6} autoFocus placeholder="000000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-violet-400 transition-colors"
              />
              <button type="submit" disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-3 transition-colors flex items-center justify-center gap-2">
                {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Confirm & Enable
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
