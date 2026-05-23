import { useState, useEffect } from 'react'
import client from '../../api/client'

export default function TwoFactorSection({ darkMode }) {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [setupData, setSetupData] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirming, setConfirming] = useState(false)

  const bg = darkMode ? 'bg-gray-800' : 'bg-gray-50'
  const text = darkMode ? 'text-white' : 'text-gray-900'
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const inputCls = `w-full rounded-xl px-4 py-2 text-sm outline-none border ${
    darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-200'
  } focus:ring-2 focus:ring-violet-400 transition-colors`

  useEffect(() => {
    client.get('/auth/2fa/status')
      .then(({ data }) => setEnabled(data.enabled))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function startSetup() {
    setError('')
    setSuccess('')
    try {
      const { data } = await client.post('/auth/2fa/setup')
      setSetupData(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start setup')
    }
  }

  async function confirmEnable() {
    if (code.length !== 6) { setError('Enter the 6-digit code'); return }
    setConfirming(true)
    setError('')
    try {
      await client.post('/auth/2fa/enable', { code })
      setEnabled(true)
      setSetupData(null)
      setCode('')
      setSuccess('Two-factor authentication is now enabled.')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code')
    }
    setConfirming(false)
  }

  async function handleDisable() {
    if (code.length !== 6) { setError('Enter the 6-digit code to confirm'); return }
    setConfirming(true)
    setError('')
    try {
      await client.post('/auth/2fa/disable', { code })
      setEnabled(false)
      setCode('')
      setSuccess('Two-factor authentication disabled.')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code')
    }
    setConfirming(false)
  }

  if (loading) return null

  return (
    <div className={`rounded-2xl p-4 mb-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className={`text-sm font-bold ${text}`}>Two-Factor Authentication</span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
          enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
        }`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      <p className={`text-xs mb-4 ${sub}`}>
        Add an extra layer of security. Each time you sign in you'll need your password and a code from your authenticator app.
      </p>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      {success && <p className="text-xs text-green-600 mb-3">{success}</p>}

      {!enabled && !setupData && (
        <button
          onClick={startSetup}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2 text-sm font-semibold transition-colors"
        >
          Enable 2FA
        </button>
      )}

      {!enabled && setupData && (
        <div className="space-y-3">
          <p className={`text-xs ${sub}`}>
            1. Install an authenticator app (Google Authenticator, Authy, etc.).<br />
            2. Scan the QR code below.<br />
            3. Enter the 6-digit code to confirm.
          </p>
          <div className="flex justify-center">
            <img src={setupData.qrCode} alt="2FA QR Code" className="w-40 h-40 rounded-xl border border-gray-200" />
          </div>
          <p className={`text-xs text-center ${sub}`}>
            Can't scan? Use code: <span className="font-mono font-bold">{setupData.secret}</span>
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            className={inputCls}
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setSetupData(null); setCode(''); setError('') }}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold border transition-colors ${
                darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={confirmEnable}
              disabled={confirming}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {confirming ? 'Verifying…' : 'Confirm & Enable'}
            </button>
          </div>
        </div>
      )}

      {enabled && (
        <div className="space-y-3">
          <p className={`text-xs ${sub}`}>
            Enter the current code from your authenticator app to disable 2FA.
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            className={inputCls}
          />
          <button
            onClick={handleDisable}
            disabled={confirming}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {confirming ? 'Disabling…' : 'Disable 2FA'}
          </button>
        </div>
      )}
    </div>
  )
}
