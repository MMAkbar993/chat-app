import { useState, useEffect } from 'react'
import {
  getMyVerifiedWebsites, initWebsiteVerify, confirmWebsiteVerify, removeWebsiteVerify,
  requestRepresentation, revokeRepresentation, getRepresentationRequests, handleRepresentationRequest,
  getWebsiteRepresentatives, transferWebsiteOwnership, getMyRepresentationStatus, cancelRepresentationRequest,
  getApprovedRepresentatives, revokeRepresentative,
} from '../../api/users'
import { useSocket } from '../../context/SocketContext'

// ─── shared visual bits ─────────────────────────────────────────────────────

function Illustration({ darkMode, badge, badgeColor, lockColor }) {
  return (
    <div className="relative w-36 h-28 shrink-0 hidden sm:block">
      <span className="absolute -top-2 left-2 w-2 h-2 rounded-full bg-pink-300" />
      <span className="absolute top-1 right-0 w-1.5 h-1.5 rounded-full bg-blue-300" />
      <span className="absolute bottom-4 -left-1 w-1.5 h-1.5 rounded-full bg-green-300" />
      <div className={`absolute left-2 top-4 w-32 h-20 rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100 shadow-md'}`}>
        <div className={`flex items-center gap-1 px-2 py-1.5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>
        <div className="p-2.5 space-y-1.5">
          <div className={`h-1.5 rounded w-3/4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
          <div className={`h-1.5 rounded w-1/2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
          <div className={`h-1.5 rounded w-2/3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
        </div>
      </div>
      <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${badgeColor}`}>
        {badge}
      </div>
      {lockColor && (
        <span className={`absolute bottom-1 right-1 w-7 h-7 rounded-full flex items-center justify-center border-[3px] ${darkMode ? 'border-gray-800' : 'border-white'} ${lockColor}`}>
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
      )}
    </div>
  )
}

function InfoTile({ darkMode, icon, color, title, desc }) {
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  return (
    <div className="flex-1 min-w-0">
      <span className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${color}`}>
        {icon}
      </span>
      <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
      <p className={`text-xs mt-0.5 leading-relaxed ${sub}`}>{desc}</p>
    </div>
  )
}

function StepTile({ darkMode, number, title, desc, icon }) {
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  return (
    <div className={`relative flex-1 min-w-0 text-center rounded-2xl border pt-7 pb-5 px-3 ${
      darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50/70 shadow-sm'
    }`}>
      <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-violet-600 shadow-md ring-4 ${darkMode ? 'ring-gray-800' : 'ring-white'}`}>
        {number}
      </span>
      <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${darkMode ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
        {icon}
      </div>
      <p className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
      <p className={`text-[11px] mt-0.5 leading-snug ${sub}`}>{desc}</p>
    </div>
  )
}

function StepConnector({ darkMode }) {
  return (
    <div className="hidden sm:flex items-center px-1 shrink-0">
      <div className={`w-6 border-t-2 border-dashed ${darkMode ? 'border-gray-700' : 'border-violet-200'}`} />
    </div>
  )
}

function HelpCard({ darkMode }) {
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const card = `rounded-2xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`
  return (
    <div className={`${card} p-5 flex items-center justify-between gap-4 flex-wrap`}>
      <div>
        <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Need help?</p>
        <p className={`text-xs mt-0.5 ${sub}`}>If you believe this is an error or have any questions, contact our support team.</p>
      </div>
      <a
        href="mailto:support@connectar.online"
        className="text-xs font-semibold text-violet-600 border border-violet-200 rounded-xl px-4 py-2 hover:bg-violet-50 transition-colors shrink-0"
      >
        Contact Support
      </a>
    </div>
  )
}

export default function WebsiteVerificationSection({ darkMode, profile }) {
  const { socket } = useSocket()
  const [websites, setWebsites] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [pendingRequests, setPendingRequests] = useState([])
  const [myPendingRequests, setMyPendingRequests] = useState([])
  const [representatives, setRepresentatives] = useState([])
  const [revokingRep, setRevokingRep] = useState(null)

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
  const [cancellingId, setCancellingId] = useState(null)
  // Transfer/delete dialog
  const [removeDialog, setRemoveDialog] = useState(null) // { id, url, reps }
  const [transferTo, setTransferTo] = useState('')
  const [dialogLoading, setDialogLoading] = useState(false)

  const approved = profile?.website_representation_approved || false
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const inp = `w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${
    darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
  } focus:ring-2 focus:ring-violet-400`
  const codeBg = darkMode ? 'bg-gray-900 text-green-400 border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-200'
  const card = `rounded-2xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`

  useEffect(() => {
    getMyVerifiedWebsites()
      .then((d) => setWebsites(d.websites || []))
      .catch(() => {})
      .finally(() => setLoadingList(false))
    // Load pending requests this user has sent as a requester (persists across refreshes)
    getMyRepresentationStatus()
      .then((d) => setMyPendingRequests(d.requests || []))
      .catch(() => {})
    getApprovedRepresentatives()
      .then((d) => setRepresentatives(d.representatives || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (websites.length > 0) {
      getRepresentationRequests()
        .then((d) => setPendingRequests(d.requests || []))
        .catch(() => {})
    }
  }, [websites.length])

  // Real-time: refresh owner's pending list when a new rep request arrives
  useEffect(() => {
    if (!socket) return
    function onNotification({ type }) {
      if (type === 'rep_request') {
        getRepresentationRequests()
          .then((d) => setPendingRequests(d.requests || []))
          .catch(() => {})
      }
    }
    // Real-time: update requester's own pending/approved status when owner decides
    function onRepUpdate({ action } = {}) {
      if (action === 'revoked') {
        // Owner removed us — hide the "Authorized Representative" panel immediately
        setReprRevoked(true)
      }
      getMyRepresentationStatus()
        .then((d) => setMyPendingRequests(d.requests || []))
        .catch(() => {})
    }
    socket.on('notification', onNotification)
    socket.on('rep-request-update', onRepUpdate)
    return () => {
      socket.off('notification', onNotification)
      socket.off('rep-request-update', onRepUpdate)
    }
  }, [socket])

  // Real-time: remove rep from approved list when they revoke themselves
  useEffect(() => {
    if (!socket) return
    function onRepRevoked({ requesterId }) {
      setRepresentatives((prev) => prev.filter((r) => r.user_id !== requesterId))
    }
    socket.on('rep-revoked', onRepRevoked)
    return () => socket.off('rep-revoked', onRepRevoked)
  }, [socket])

  async function handleRevokeRep(userId) {
    if (!window.confirm("Remove this user's representative access?")) return
    setRevokingRep(userId)
    try {
      await revokeRepresentative(userId)
      setRepresentatives((prev) => prev.filter((r) => r.user_id !== userId))
      window.dispatchEvent(new CustomEvent('rep-status-changed', { detail: { userId } }))
    } catch {}
    setRevokingRep(null)
  }

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

  async function handleRemoveClick(website) {
    setRemovingId(website.id)
    try {
      const data = await getWebsiteRepresentatives(website.id)
      if (data.representatives.length > 0) {
        setRemoveDialog({ id: website.id, url: website.url, reps: data.representatives })
        setTransferTo('')
      } else {
        if (!window.confirm(`Remove ${website.url}? This cannot be undone.`)) {
          setRemovingId(null)
          return
        }
        await removeWebsiteVerify(website.id)
        setWebsites((prev) => prev.filter((w) => w.id !== website.id))
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove website.')
    }
    setRemovingId(null)
  }

  async function handleDialogDelete() {
    setDialogLoading(true)
    try {
      await removeWebsiteVerify(removeDialog.id)
      setWebsites((prev) => prev.filter((w) => w.id !== removeDialog.id))
      setRemoveDialog(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove website.')
    }
    setDialogLoading(false)
  }

  async function handleDialogTransfer() {
    if (!transferTo) return
    setDialogLoading(true)
    try {
      await transferWebsiteOwnership(removeDialog.id, transferTo)
      setWebsites((prev) => prev.filter((w) => w.id !== removeDialog.id))
      setRemoveDialog(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to transfer ownership.')
    }
    setDialogLoading(false)
  }

  async function handleRequestRepresentation() {
    setLoading(true)
    try {
      await requestRepresentation(claimedInfo.websiteUrl, claimedInfo.ownerId)
      setReprRequested(true)
      // Immediately reflect the new pending request so it survives a page refresh
      const d = await getMyRepresentationStatus()
      setMyPendingRequests(d.requests || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send request.')
    }
    setLoading(false)
  }

  async function handleReprAction(id, action) {
    try {
      await handleRepresentationRequest(id, action)
      setPendingRequests((prev) => prev.filter((r) => r.id !== id))
      if (action === 'approve') {
        getApprovedRepresentatives()
          .then((d) => setRepresentatives(d.representatives || []))
          .catch(() => {})
      }
    } catch {}
  }

  async function handleCancelRequest(id) {
    setCancellingId(id)
    try {
      await cancelRepresentationRequest(id)
      setMyPendingRequests((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel request.')
    }
    setCancellingId(null)
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
      <div className="space-y-4">
        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className={`${card} p-6 flex items-center gap-6 flex-wrap`}>
          <Illustration
            darkMode={darkMode}
            badgeColor={darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}
            badge={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 3a4 4 0 10-8 0" />
              </svg>
            }
          />
          <div className="flex-1 min-w-[220px]">
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>You're an Authorized Representative</h3>
            <p className={`text-sm mt-1 ${sub}`}>
              You have been approved as an authorized representative
              {profile?.company_name ? ` of ${profile.company_name}` : ''}. Your profile now shows your company affiliation.
            </p>
          </div>
        </div>

        <div className={`${card} p-5 flex items-center justify-between gap-4 flex-wrap`}>
          <div>
            <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Remove representative status</p>
            <p className={`text-xs mt-0.5 ${sub}`}>This will unlink your profile from the company.</p>
          </div>
          <button
            onClick={handleRevokeRepr}
            disabled={revokingRepr}
            className="text-xs font-semibold text-red-500 border border-red-200 rounded-xl px-4 py-2 hover:bg-red-50 transition-colors shrink-0 disabled:opacity-50"
          >
            {revokingRepr ? 'Removing…' : 'Remove'}
          </button>
        </div>

        <HelpCard darkMode={darkMode} />
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* STATE A — this website is already claimed by someone else */}
      {claimedInfo && (
        <>
          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={() => { setClaimedInfo(null); setReprRequested(false); setError('') }}
            className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>

          <div className={`${card} p-6 flex items-center gap-6 flex-wrap`}>
            <Illustration darkMode={darkMode}
              badgeColor={darkMode ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-100 text-violet-600'}
              badge={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              lockColor="bg-orange-500"
            />
            <div className="flex-1 min-w-[220px]">
              <h3 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>This Website Is Already Verified</h3>
              <a
                href={claimedInfo.websiteUrl.startsWith('http') ? claimedInfo.websiteUrl : `https://${claimedInfo.websiteUrl}`}
                target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-violet-600 hover:underline inline-flex items-center gap-1"
              >
                {claimedInfo.websiteUrl}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <p className={`text-sm mt-2 ${sub}`}>This website is already verified and managed by another user.</p>
              <div className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs ${darkMode ? 'bg-violet-900/20 text-violet-300' : 'bg-violet-50 text-violet-700'}`}>
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                We verify website ownership to prevent fraud and misrepresentation, and to keep our community trusted.
              </div>
            </div>
          </div>

          <div className={`${card} p-6`}>
            {!reprRequested ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-600'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 3a4 4 0 10-8 0" />
                    </svg>
                  </span>
                  <div>
                    <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Work for this company?</p>
                    <p className={`text-xs mt-0.5 ${sub}`}>If you are an employee or representative of this company, you can request to be added as an approved representative.</p>
                  </div>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl p-4 mb-4 ${darkMode ? 'bg-gray-900' : 'bg-violet-50/60'}`}>
                  <InfoTile darkMode={darkMode}
                    color={darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-white text-violet-600'}
                    icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                    title="Gain Access"
                    desc="Manage the website profile and respond to reviews."
                  />
                  <InfoTile darkMode={darkMode}
                    color={darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-white text-violet-600'}
                    icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 3a4 4 0 10-8 0" /></svg>}
                    title="Build Trust"
                    desc="Show your verified role within the company."
                  />
                  <InfoTile darkMode={darkMode}
                    color={darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-white text-violet-600'}
                    icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    title="Increase Visibility"
                    desc="Help grow and maintain the company's presence on our platform."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleRequestRepresentation}
                    disabled={loading}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Sending…' : 'Request Representation'}
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border transition-colors ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                  >
                    Learn More
                  </button>
                </div>
                <p className={`flex items-center gap-1.5 text-xs mt-3 ${sub}`}>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Your request will be sent to the current website owner for approval.
                </p>
              </>
            ) : (
              <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${darkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-700'}`}>
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Your representation request has been sent. The website owner will review it shortly.
              </div>
            )}
          </div>

          <HelpCard darkMode={darkMode} />
        </>
      )}

      {/* STATE B / C — no active "claimed" lookup */}
      {!claimedInfo && (
        <>
          {/* Hero */}
          {websites.length > 0 ? (
            <div className={`${card} p-6 flex items-center gap-6 flex-wrap`}>
              <Illustration darkMode={darkMode}
                badgeColor="bg-green-500 text-white"
                badge={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                }
              />
              <div className="flex-1 min-w-[220px]">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Your Websites Are Verified!</h3>
                <p className={`text-sm mt-1 ${sub}`}>Thank you for verifying your websites. You can manage your verified websites below.</p>
              </div>
            </div>
          ) : (
            <div className={`${card} p-6 flex items-center gap-6 flex-wrap`}>
              <Illustration darkMode={darkMode}
                badgeColor="bg-violet-600 text-white"
                badge={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                }
                lockColor="bg-green-500"
              />
              <div className="flex-1 min-w-[220px]">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Verify Your Website</h3>
                <p className={`text-sm mt-1 ${sub}`}>
                  Verifying your website proves that you own it. This helps us prevent fraud and misrepresentation, keeping our community trusted and safe.
                </p>
              </div>
            </div>
          )}

          {/* Benefit tiles — first-time / empty state only */}
          {websites.length === 0 && (
            <div className={`${card} grid grid-cols-1 sm:grid-cols-3 gap-4 p-5`}>
              <InfoTile darkMode={darkMode}
                color={darkMode ? 'bg-gray-700 text-violet-300' : 'bg-violet-50 text-violet-600'}
                icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                title="Build Trust" desc="Show others you're the real owner."
              />
              <InfoTile darkMode={darkMode}
                color={darkMode ? 'bg-gray-700 text-violet-300' : 'bg-violet-50 text-violet-600'}
                icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Avoid Fraud" desc="We verify ownership to prevent misuse."
              />
              <InfoTile darkMode={darkMode}
                color={darkMode ? 'bg-gray-700 text-violet-300' : 'bg-violet-50 text-violet-600'}
                icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                title="Boost Credibility" desc="Verified websites get more visibility."
              />
            </div>
          )}

          {/* My pending representation requests (requester view — persists across refreshes) */}
          {myPendingRequests.length > 0 && (
            <div className={`rounded-2xl border p-4 space-y-2 ${darkMode ? 'border-yellow-800 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'}`}>
              <p className={`text-xs font-semibold ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                Awaiting Approval
              </p>
              {error && <p className="text-xs text-red-500">{error}</p>}
              {myPendingRequests.map((r) => {
                const ownerName = r.owner_display_name || r.owner_full_name || 'the site owner'
                return (
                  <div key={r.id} className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`text-xs flex-1 ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                      Awaiting approval from <span className="font-medium">{ownerName}</span> for{' '}
                      <span className="font-medium">{r.website_url.replace(/^https?:\/\//, '')}</span>
                    </span>
                    <button
                      onClick={() => handleCancelRequest(r.id)}
                      disabled={cancellingId === r.id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 shrink-0 font-medium"
                    >
                      {cancellingId === r.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Verified websites list */}
          {!loadingList && websites.length > 0 && (
            <div className={`${card} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Verified Websites</h4>
                <button
                  onClick={() => setAddOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-3 py-2 transition-colors shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Verify a Website
                </button>
              </div>
              {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
              <div className="space-y-2">
                {websites.map((w) => (
                  <div
                    key={w.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${darkMode ? 'bg-gray-700 text-green-400' : 'bg-white text-green-500'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <a
                      href={w.url.startsWith('http') ? w.url : `https://${w.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 text-sm font-medium text-violet-500 hover:underline truncate"
                    >
                      {w.url}
                    </a>
                    <span className={`text-xs font-semibold rounded-full px-2.5 py-1 flex items-center gap-1 shrink-0 ${darkMode ? 'text-green-400 bg-green-900/30 border border-green-800' : 'text-green-600 bg-green-50 border border-green-200'}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Verified
                    </span>
                    <button
                      onClick={() => handleRemoveClick(w)}
                      disabled={removingId === w.id}
                      className={`text-xs shrink-0 disabled:opacity-50 ${darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                    >
                      {removingId === w.id ? 'Checking…' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
              <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 mt-3 text-xs ${darkMode ? 'bg-violet-900/20 text-violet-300' : 'bg-violet-50 text-violet-700'}`}>
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                If you remove a website, it will no longer be verified and may affect your profile visibility.
              </div>
            </div>
          )}

          {/* Pending representation requests (only shown when owner has verified websites) */}
          {websites.length > 0 && pendingRequests.length > 0 && (
            <div className={`${card} p-4 space-y-3`}>
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

          {/* Approved representatives */}
          {websites.length > 0 && (
            <div className={`${card} p-5`}>
              <h4 className={`text-sm font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Authorized Representatives</h4>
              {representatives.length === 0 ? (
                <p className={`text-xs ${sub}`}>
                  No authorized representatives yet. Approve requests above to add one.
                </p>
              ) : (
                <div className="space-y-3">
                  {representatives.map((r) => {
                    const name = r.display_name || r.full_name || r.username || 'Unknown'
                    return (
                      <div key={r.user_id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-violet-500 flex items-center justify-center text-white text-sm font-bold">
                          {r.avatar_url
                            ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                            : name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>{name}</p>
                          <p className={`text-xs truncate ${sub}`}>{r.website_url}</p>
                        </div>
                        <button
                          onClick={() => handleRevokeRep(r.user_id)}
                          disabled={revokingRep === r.user_id}
                          className="text-xs text-red-500 hover:text-red-700 shrink-0 disabled:opacity-50"
                        >
                          {revokingRep === r.user_id ? 'Removing…' : 'Remove'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Why verification matters — already-verified state */}
          {websites.length > 0 && (
            <div className={`${card} p-5`}>
              <h4 className={`text-sm font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Why Verification Matters</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InfoTile darkMode={darkMode}
                  color={darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}
                  icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                  title="Prove Ownership" desc="Verification proves you own the website you claim."
                />
                <InfoTile darkMode={darkMode}
                  color={darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}
                  icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  title="Prevent Fraud" desc="Helps us prevent fraud and misrepresentation."
                />
                <InfoTile darkMode={darkMode}
                  color={darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}
                  icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                  title="Build Trust" desc="Verified websites get more visibility and trust."
                />
              </div>
            </div>
          )}

          {/* How it works — first-time / empty state only */}
          {websites.length === 0 && (
            <div className={`${card} p-5`}>
              <h4 className={`text-sm font-bold mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>How it works</h4>
              <div className="flex flex-col sm:flex-row items-stretch gap-y-6">
                <StepTile darkMode={darkMode}
                  number={1} title="Add Meta Tag"
                  desc="Copy the meta tag below and paste it into the <head> section of your website."
                  icon={<svg className={`w-5 h-5 ${darkMode ? 'text-violet-300' : 'text-violet-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16M6 8l-4 4 4 4m12-8l4 4-4 4" /></svg>}
                />
                <StepConnector darkMode={darkMode} />
                <StepTile darkMode={darkMode}
                  number={2} title="Confirm Placement"
                  desc="Once the tag is added, click the button below to let us check your website."
                  icon={<svg className={`w-5 h-5 ${darkMode ? 'text-violet-300' : 'text-violet-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>}
                />
                <StepConnector darkMode={darkMode} />
                <StepTile darkMode={darkMode}
                  number={3} title="You're Verified!"
                  desc="If everything is correct, your website will be verified and you'll get a confirmation."
                  icon={<svg className={`w-5 h-5 ${darkMode ? 'text-violet-300' : 'text-violet-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                />
              </div>
            </div>
          )}

          {/* Add-website form (step 1 / step 2) */}
          {(websites.length === 0 || addOpen) && (
            <div className={`${card} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {websites.length === 0 ? 'Verify a Website You Own' : 'Verify Another Website'}
                </h4>
                {websites.length > 0 && (
                  <button onClick={() => { resetAddForm(); setAddOpen(false) }} className={`text-xs ${sub} hover:text-gray-700`}>
                    Cancel
                  </button>
                )}
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</p>
              )}

              {step === 1 && (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://yoursite.com"
                      className={`${inp} flex-1`}
                    />
                    <button
                      onClick={handleInit}
                      disabled={loading}
                      className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors shrink-0"
                    >
                      {loading ? 'Generating…' : 'Get Meta Tag'}
                    </button>
                  </div>
                  <p className={`flex items-center gap-1.5 text-xs mt-2 ${sub}`}>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    You need to have access to your website's HTML &lt;head&gt; section to add the meta tag.
                  </p>
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

                  <div className="mt-4">
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

          <HelpCard darkMode={darkMode} />
        </>
      )}

      {/* Transfer / delete dialog */}
      {removeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            <h3 className="font-semibold text-base">Remove Website</h3>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="font-medium">{removeDialog.url}</span> has {removeDialog.reps.length} authorized {removeDialog.reps.length === 1 ? 'user' : 'users'}.
              You can transfer admin ownership to one of them, or delete the site and remove all associated users.
            </p>

            {/* Transfer option */}
            <div className={`rounded-xl border p-4 space-y-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Transfer admin to</p>
              <div className="space-y-2">
                {removeDialog.reps.map((r) => {
                  const name = r.display_name || r.full_name || r.username || 'Unknown'
                  return (
                    <label key={r.user_id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="transferTo"
                        value={r.user_id}
                        checked={transferTo === r.user_id}
                        onChange={() => setTransferTo(r.user_id)}
                        className="accent-violet-600"
                      />
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                        {r.avatar_url
                          ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                          : name[0].toUpperCase()}
                      </div>
                      <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{name}</span>
                    </label>
                  )
                })}
              </div>
              <button
                onClick={handleDialogTransfer}
                disabled={!transferTo || dialogLoading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-40 transition-colors"
              >
                {dialogLoading ? 'Transferring…' : 'Transfer Ownership'}
              </button>
            </div>

            {/* Delete option */}
            <div className="space-y-2">
              <button
                onClick={handleDialogDelete}
                disabled={dialogLoading}
                className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-40 transition-colors"
              >
                {dialogLoading ? 'Deleting…' : 'Delete Site & Remove All Users'}
              </button>
              <button
                onClick={() => { setRemoveDialog(null); setTransferTo('') }}
                disabled={dialogLoading}
                className={`w-full rounded-xl py-2 text-sm font-semibold border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
