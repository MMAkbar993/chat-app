import { useState, useEffect } from 'react'
import {
  initWebsiteVerify, confirmWebsiteVerify, removeWebsiteVerify,
  requestRepresentation, getRepresentationRequests, handleRepresentationRequest,
} from '../../api/users'

export default function WebsiteVerificationSection({ darkMode, profile }) {
  const [url, setUrl] = useState(profile?.website || '')
  const [metaTag, setMetaTag] = useState(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(profile?.website_verified || false)
  const [claimedInfo, setClaimedInfo] = useState(null) // { ownerName, ownerId, websiteUrl }
  const [reprRequested, setReprRequested] = useState(false)
  const [pendingRequests, setPendingRequests] = useState([])
  const [loadingRepr, setLoadingRepr] = useState(false)

  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const inp = `w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${
    darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
  } focus:ring-2 focus:ring-violet-400`
  const codeBg = darkMode ? 'bg-gray-900 text-green-400 border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-200'

  useEffect(() => {
    if (verified) {
      getRepresentationRequests()
        .then((d) => setPendingRequests(d.requests || []))
        .catch(() => {})
    }
  }, [verified])

  async function handleInit() {
    if (!url.trim()) { setError('Please enter your website URL.'); return }
    setError('')
    setClaimedInfo(null)
    setLoading(true)
    try {
      const data = await initWebsiteVerify(url.trim())
      setMetaTag(data.metaTag)
      setStep(2)
    } catch (err) {
      const res = err.response?.data
      if (res?.error === 'already_claimed') {
        setClaimedInfo({ ownerName: res.ownerName, ownerId: res.ownerId, websiteUrl: res.websiteUrl })
      } else {
        setError(res?.error || 'Failed to start verification.')
      }
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

  async function handleRemove() {
    setLoading(true)
    try {
      await removeWebsiteVerify()
      setVerified(false)
      setStep(1)
      setMetaTag(null)
      setUrl('')
      setError('')
      setClaimedInfo(null)
      setPendingRequests([])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove verification.')
    }
    setLoading(false)
  }

  async function handleRequestRepresentation() {
    setLoadingRepr(true)
    try {
      await requestRepresentation(claimedInfo.websiteUrl, claimedInfo.ownerId)
      setReprRequested(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send request.')
    }
    setLoadingRepr(false)
  }

  async function handleReprAction(id, action) {
    try {
      await handleRepresentationRequest(id, action)
      setPendingRequests((prev) => prev.filter((r) => r.id !== id))
    } catch {}
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
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => { setVerified(false); setStep(1); setMetaTag(null); setUrl('') }}
            className={`text-xs ${sub} underline`}
          >
            Verify a different website
          </button>
          <span className={`text-xs ${sub}`}>·</span>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="text-xs text-red-500 underline disabled:opacity-50"
          >
            {loading ? 'Removing…' : 'Remove'}
          </button>
        </div>

        {pendingRequests.length > 0 && (
          <div className={`rounded-xl border p-3 space-y-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <p className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Pending Representation Requests
            </p>
            {pendingRequests.map((r) => {
              const name = r.display_name || r.full_name || r.username || 'Unknown'
              return (
                <div key={r.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {r.avatar_url
                      ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                      : name[0].toUpperCase()}
                  </div>
                  <span className={`flex-1 text-xs ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{name}</span>
                  <button
                    onClick={() => handleReprAction(r.id, 'approve')}
                    className="text-xs bg-violet-600 text-white px-2 py-1 rounded-lg hover:bg-violet-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReprAction(r.id, 'reject')}
                    className={`text-xs px-2 py-1 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Reject
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {pendingRequests.length === 0 && (
          <div className={`rounded-xl border p-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Pending Representation Requests
            </p>
            <p className={`text-xs ${sub}`}>No pending requests.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-xs text-red-500">{error}</p>}

      {claimedInfo && !reprRequested && (
        <div className={`rounded-xl border p-4 space-y-2 ${darkMode ? 'border-orange-800 bg-orange-900/20' : 'border-orange-200 bg-orange-50'}`}>
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-xs ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
              This website is already claimed by <span className="font-semibold">{claimedInfo.ownerName}</span>.
              If you represent this company, you can request representation.
            </p>
          </div>
          <button
            onClick={handleRequestRepresentation}
            disabled={loadingRepr}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2 text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            {loadingRepr ? 'Sending…' : 'Request Representation'}
          </button>
        </div>
      )}

      {reprRequested && (
        <div className={`rounded-xl border p-3 ${darkMode ? 'border-green-800 bg-green-900/20' : 'border-green-200 bg-green-50'}`}>
          <p className={`text-xs ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
            Your representation request has been sent. The website owner will review it shortly.
          </p>
        </div>
      )}

      {step === 1 && (
        <>
          <p className={`text-xs ${sub}`}>
            Enter your website address. We'll generate a small verification tag for you to add to your site.
          </p>
          <div>
            <label className={`text-xs mb-1 block ${sub}`}>Website URL</label>
            <input
              value={url}
              onChange={(e) => { setUrl(e.target.value); setClaimedInfo(null); setReprRequested(false) }}
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
        </>
      )}
    </div>
  )
}
