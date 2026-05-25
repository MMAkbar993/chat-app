import { useState } from 'react'
import { initWebsiteVerify, confirmWebsiteVerify } from '../../api/users'

export default function WebsiteVerificationSection({ darkMode, profile }) {
  const [url, setUrl] = useState(profile?.website || '')
  const [metaTag, setMetaTag] = useState(null)
  const [step, setStep] = useState(1) // 1 = enter URL, 2 = add meta tag, 3 = verified
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(profile?.website_verified || false)

  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const inp = `w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${
    darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
  } focus:ring-2 focus:ring-violet-400`
  const codeBg = darkMode ? 'bg-gray-900 text-green-400 border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-200'

  async function handleInit() {
    if (!url.trim()) { setError('Please enter your website URL.'); return }
    setError('')
    setLoading(true)
    try {
      const data = await initWebsiteVerify(url.trim())
      setMetaTag(data.metaTag)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start verification.')
    }
    setLoading(false)
  }

  async function handleVerify() {
    setError('')
    setLoading(true)
    try {
      await confirmWebsiteVerify()
      setVerified(true)
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.')
    }
    setLoading(false)
  }

  if (verified || step === 3) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Website Verified</span>
        </div>
        <p className={`text-xs ${sub}`}>{url || profile?.website}</p>
        <button
          onClick={() => { setVerified(false); setStep(1); setMetaTag(null); setUrl('') }}
          className={`text-xs ${sub} underline`}
        >
          Verify a different website
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-xs text-red-500">{error}</p>}

      {step === 1 && (
        <>
          <p className={`text-xs ${sub}`}>
            Enter your website address. We'll generate a small verification tag for you to add to your site.
          </p>
          <div>
            <label className={`text-xs mb-1 block ${sub}`}>Website URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className={inp}
            />
          </div>
          <button
            onClick={handleInit}
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Generating…' : 'Generate Verification Tag'}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Step 1 — Add this tag to your website's &lt;head&gt;</p>
            <p className={`text-xs mb-2 ${sub}`}>Open your website's HTML and paste the following tag inside the &lt;head&gt; section.</p>
            <div className={`rounded-xl border p-3 font-mono text-xs break-all ${codeBg}`}>
              {metaTag}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(metaTag)}
              className="mt-1 text-xs text-violet-500 hover:text-violet-700"
            >
              Copy to clipboard
            </button>
          </div>

          <div>
            <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Step 2 — Click Verify</p>
            <p className={`text-xs mb-3 ${sub}`}>
              Once the tag is live on <span className="font-medium">{url}</span>, click Verify below.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setStep(1); setMetaTag(null); setError('') }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
                darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </div>

          {/* Pending representation requests placeholder */}
          <div className={`rounded-xl border p-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Your pending representation requests
            </p>
            <p className={`text-xs ${sub}`}>No pending requests.</p>
          </div>
        </>
      )}
    </div>
  )
}
