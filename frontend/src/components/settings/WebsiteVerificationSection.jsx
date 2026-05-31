import { useState, useEffect } from 'react'
import {
  getMyVerifiedWebsites, initWebsiteVerify, confirmWebsiteVerify, removeWebsiteVerify,
  requestRepresentation, revokeRepresentation, getRepresentationRequests, handleRepresentationRequest,
} from '../../api/users'

export default function WebsiteVerificationSection({ darkMode, profile }) {
  const [websites, setWebsites] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [pendingRequests, setPendingRequests] = useState([])

  // Add-website form state
  const [addOpen, setAddOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [metaTag, setMetaTag] = useState(null)
  const [websiteId, setWebsiteId] = useState(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [claimedInfo, setClaimedInfo] = useState(null)
  const [reprRequested, setReprRequested] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [revokingRepr, setRevokingRepr] = useState(false)
  const [reprRevoked, setReprRevoked] = useState(false)

  const approved = profile?.website_representation_approved || false
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const inp = `w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${
    darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
  } focus:ring-2 focus:ring-violet-400`
  const codeBg = darkMode ? 'bg-gray-900 text-green-400 border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-200'

  useEffect(() => {
    getMyVerifiedWebsites()
      .then((d) => setWebsites(d.websites || []))
      .catch(() => {})
      .finally(() => setLoadingList(false))
  }, [])

  useEffect(() => {
    if (websites.length > 0) {
      getRepresentationRequests()
        .then((d) => setPendingRequests(d.requests || []))
        .catch(() => {})
    }
  }, [websites.length])

  function resetAddForm() {
    setUrl('')
    setMetaTag(null)
    setWebsiteId(null)
    setStep(1)
    setError('')
    setClaimedInfo(null)
    setReprRequested(false)
  }

  async function handleInit() {
    if (!url.trim()) { setError('Please enter your website URL.'); return }
    setError('')
    setClaimedInfo(null)
    setLoading(true)
    try {
      const data = await initWebsiteVerify(url.trim())
      setMetaTag(data.metaTag)
      setWebsiteId(data.websiteId)
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
      await confirmWebsiteVerify(websiteId)
      const d = await getMyVerifiedWebsites()
      setWebsites(d.websites || [])
      resetAddForm()
      setAddOpen(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.')
    }
    setLoading(false)
  }

  async function handleRemove(id) {
    setRemovingId(id)
    try {
      await removeWebsiteVerify(id)
      setWebsites((prev) => prev.filter((w) => w.id !== id))
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove website.')
    }
    setRemovingId(null)
  }

  async function handleRequestRepresentation() {
    setLoading(true)
    try {
      await requestRepresentation(claimedInfo.websiteUrl, claimedInfo.ownerId)
      setReprRequested(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send request.')
    }
    setLoading(false)
  }

  async function handleReprAction(id, action) {
    try {
      await handleRepresentationRequest(id, action)
      setPendingRequests((prev) => prev.filter((r) => r.id !== id))
    } catch {}
  }

  async function handleRevokeRepr() {
    if (!window.confirm('Remove your authorized representative status? This will unlink your profile from the company.')) return
    setRevokingRepr(true)
    try {
      await revokeRepresentation()
      setReprRevoked(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove representative status.')
    }
    setRevokingRepr(false)
  }

  if ((approved && websites.length === 0) && !reprRevoked) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Authorized Representative</span>
        </div>
        <div className={`rounded-xl border p-3 ${darkMode ? 'border-violet-800 bg-violet-900/20' : 'border-violet-100 bg-violet-50'}`}>
          <p className={`text-xs ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>
            You have been approved as an authorized representative
            {profile?.company_name ? ` of ${profile.company_name}` : ''}. Your profile now shows your company affiliation.
          </p>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handleRevokeRepr}
          disabled={revokingRepr}
          className="text-xs text-red-500 hover:text-red-700 underline disabled:opacity-50"
        >
          {revokingRepr ? 'Removing…' : 'Remove representative status'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Verified websites list */}
      {!loadingList && websites.length > 0 && (
        <div className="space-y-2">
          {websites.map((w) => (
            <div
              key={w.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'}`}
            >
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <a
                href={w.url.startsWith('http') ? w.url : `https://${w.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm text-violet-500 hover:underline truncate"
              >
                {w.url}
              </a>
              <button
                onClick={() => handleRemove(w.id)}
                disabled={removingId === w.id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 shrink-0"
              >
                {removingId === w.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pending representation requests (only shown when owner has verified websites) */}
      {websites.length > 0 && pendingRequests.length > 0 && (
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

      {/* Add website toggle */}
      {!addOpen ? (
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 text-xs text-violet-500 hover:text-violet-700 font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {websites.length === 0 ? 'Verify a website' : 'Add another website'}
        </button>
      ) : (
        <div className={`rounded-xl border p-4 space-y-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {websites.length === 0 ? 'Verify a website' : 'Add another website'}
            </p>
            <button
              onClick={() => { resetAddForm(); setAddOpen(false) }}
              className={`text-xs ${sub} hover:text-gray-700`}
            >
              Cancel
            </button>
          </div>

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
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending…' : 'Request Representation'}
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
      )}
    </div>
  )
}
