import { useState, useEffect } from 'react'
import {
  getMyVerifiedWebsites, initWebsiteVerify, confirmWebsiteVerify, removeWebsiteVerify, getRepresentationRequests, handleRepresentationRequest, removeMyRepresentationFor, getWebsiteRepresentatives, transferWebsiteOwnership, getMyRepresentationStatus, cancelRepresentationRequest, getApprovedRepresentatives, revokeRepresentative, sendRepEmailCode, confirmRepEmailCode,
} from '../api/users'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { apiErrorMessage } from '../utils/apiError'

// Everything the website verification screen knows and does: the member's websites, the
// add-a-website flow (meta tag, DNS record or emailed code), representative requests both ways,
// and the remove/transfer dialog. Kept apart from the markup so the screen only renders.

// Mirrors the backend's TXT record naming so a restored pending verification shows the same
// DNS instructions the user saw when they first generated the token.
export function dnsInfoFor(url, token) {
  if (!url || !token) return null
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '')
    return { host: `_pulse-verification.${host}`, value: token }
  } catch {
    return null
  }
}

export function useWebsiteVerification({ profile, onProfileChange }) {
  const { socket } = useSocket()
  const { refreshUser, setUser } = useAuth()
  const { showToast } = useToast()
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
  // Filled in alongside the meta tag: sites behind a WAF can't be checked over HTTP at all,
  // so we always offer a DNS TXT record as an equivalent second route.
  const [dnsInfo, setDnsInfo] = useState(null)
  // Which of the three routes they chose on the picker; decides what step 2 shows.
  const [method, setMethod] = useState('meta')
  // Third route: a code emailed to an address on the domain itself.
  const [verifyEmail, setVerifyEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [codeSentTo, setCodeSentTo] = useState(null)
  const [emailBusy, setEmailBusy] = useState(false)
  const [websiteId, setWebsiteId] = useState(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [claimedInfo, setClaimedInfo] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  // Holds the url currently being removed, so only that row shows its spinner.
  const [revokingRepr, setRevokingRepr] = useState(null)
  const [reprRevoked, setReprRevoked] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)
  // Transfer/delete dialog
  const [removeDialog, setRemoveDialog] = useState(null) // { id, url, reps }
  const [transferTo, setTransferTo] = useState('')
  const [dialogLoading, setDialogLoading] = useState(false)

  const approved = profile?.website_representation_approved || false
  // `websites` includes pending (unverified) rows too — only `.verified` rows count as actually owned.
  const verifiedWebsites = websites.filter((w) => w.verified)
  // Sites that have a token but aren't verified yet. These had no home in the UI at all
  // before, so a verification left half-finished simply vanished from the page.
  const pendingWebsites = websites.filter((w) => !w.verified && w.verify_token)

  useEffect(() => {
    getMyVerifiedWebsites()
      .then((d) => {
        const list = d.websites || []
        setWebsites(list)
        // Pick up where they left off: a site awaiting verification still has its snippet, and
        // adding the meta tag can take a customer's dev team days. Dropping back to step 1 on
        // every visit is what made people re-request and invalidate the tag already deployed.
        const pending = list.find((w) => !w.verified && w.verify_token)
        if (pending) {
          setUrl(pending.url)
          setMetaTag(`<meta name="site-verification" content="${pending.verify_token}">`)
          setDnsInfo(dnsInfoFor(pending.url, pending.verify_token))
          setWebsiteId(pending.id)
          setStep(2)
        }
      })
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
    if (verifiedWebsites.length > 0) {
      getRepresentationRequests()
        .then((d) => setPendingRequests(d.requests || []))
        .catch(() => {})
    }
  }, [verifiedWebsites.length])

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
      // Whatever the decision was, the request is no longer outstanding, so the lookup state
      // that produced it has to go. Only 'revoked' used to clear this, which is why an
      // approval left "This website is already verified" and "Your representation request has
      // been sent" sitting underneath the new "You're an Authorized Representative" card —
      // three panels disagreeing about the same request.
      setClaimedInfo(null)
        if (action === 'approve') setReprRevoked(false)
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
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not remove this representative'), 'error')
    }
    setRevokingRep(null)
  }

  function resetAddForm() {
    setUrl('')
    setMetaTag(null)
    setDnsInfo(null)
    setMethod('meta')
    setWebsiteId(null)
    setStep(1)
    setError('')
    setClaimedInfo(null)
    setVerifyEmail('')
    setEmailCode('')
    setCodeSentTo(null)
  }

  async function handleInit() {
    if (!url.trim()) { setError('Please enter your website URL.'); return }
    setError('')
    setClaimedInfo(null)
    setLoading(true)
    try {
      const data = await initWebsiteVerify(url.trim())
      setMetaTag(data.metaTag)
      setDnsInfo(
        data.dnsHost
          ? { host: data.dnsHost, value: data.dnsValue }
          : dnsInfoFor(url.trim(), data.dnsValue || data.metaTag?.match(/content="([^"]+)"/)?.[1])
      )
      setWebsiteId(data.websiteId)
      setStep(2)
    } catch (err) {
      const res = err.response?.data
      if (res?.error === 'already_claimed') {
        setClaimedInfo({ ownerName: res.ownerName, ownerId: res.ownerId, websiteUrl: res.websiteUrl })
      } else if (res?.error === 'already_verified') {
        setError(`You have already verified ${res.websiteUrl}. It is listed above.`)
      } else {
        setError(res?.error || 'Failed to start verification.')
      }
    }
    setLoading(false)
  }

  async function handleChooseMethod() {
    setError('')
    if (method === 'email') {
      setStep(2)
      return
    }
    await handleInit()
  }

  async function handleVerify() {
    setError('')
    setLoading(true)
    try {
      await confirmWebsiteVerify(websiteId)
      const d = await getMyVerifiedWebsites()
      setWebsites(d.websites || [])
      await refreshUser?.()
      await onProfileChange?.()
      // The Business Profile entry in the settings menu keys off website_verified, and
      // refreshUser swallows a failed /auth/me — so set the flag locally as well. Otherwise
      // verifying works but the new section only turns up after a page reload.
      setUser?.((u) => (u && !u.website_verified ? { ...u, website_verified: true } : u))
      resetAddForm()
      setAddOpen(false)
    } catch (err) {
      const res = err.response?.data
      setError(res?.error || 'Verification failed.')
      // The server tells us when a firewall — not a missing tag — is what stopped it. Open the
      // DNS panel for them rather than leaving them to re-check a meta tag that is already correct.
      if (res?.dnsHost) setDnsInfo({ host: res.dnsHost, value: res.dnsValue })
      if (res?.reason === 'blocked') setMethod('dns')
    }
    setLoading(false)
  }

  // The domain the email address has to be on, shown in the form and enforced server-side.
  const emailDomain = (url || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '') || 'your domain'

  async function handleSendEmailCode(targetUrl) {
    setError('')
    setEmailBusy(true)
    try {
      const { sentTo } = await sendRepEmailCode(targetUrl || url, verifyEmail.trim())
      setCodeSentTo(sentTo)
      setEmailCode('')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send the code.')
    }
    setEmailBusy(false)
  }

  // Verifying by email makes you a representative of the company, not its admin — admin
  // rights come only from the meta tag or the DNS record.
  async function handleConfirmEmailCode(targetUrl) {
    setError('')
    setEmailBusy(true)
    try {
      await confirmRepEmailCode(targetUrl || url, emailCode.trim())
      const d = await getMyVerifiedWebsites()
      setWebsites(d.websites || [])
      await refreshUser?.()
      // rep_websites lives on the panel's profile, not on the auth user.
      await onProfileChange?.()
      resetAddForm()
      setAddOpen(false)
      setClaimedInfo(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not verify that code.')
    }
    setEmailBusy(false)
  }

  // Pending sites skip the representative and transfer machinery entirely: nothing is
  // verified, so nobody can be representing it and there is nothing to hand over. Without
  // this there was no way to get rid of a half-finished verification at all — testing a few
  // URLs left them stuck on the page permanently.
  async function handleCancelPending(website) {
    if (!window.confirm(`Cancel verification for ${website.url}? You can start again later.`)) return
    setRemovingId(website.id)
    try {
      await removeWebsiteVerify(website.id)
      setWebsites((prev) => prev.filter((w) => w.id !== website.id))
      // If the form was open on this site, it now points at a row that no longer exists.
      if (websiteId === website.id) resetAddForm()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel verification.')
    }
    setRemovingId(null)
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

  async function handleReprAction(id, action) {
    try {
      await handleRepresentationRequest(id, action)
      setPendingRequests((prev) => prev.filter((r) => r.id !== id))
      if (action === 'approve') {
        getApprovedRepresentatives()
          .then((d) => setRepresentatives(d.representatives || []))
          .catch(() => {})
      }
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not update this request'), 'error')
    }
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

  async function handleRemoveRep(websiteUrl) {
    setRevokingRepr(websiteUrl)
    try {
      await removeMyRepresentationFor(websiteUrl)
      await refreshUser?.()
      await onProfileChange?.()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove that representation.')
    }
    setRevokingRepr(null)
  }

  return {
    loadingList,
    pendingRequests,
    myPendingRequests,
    representatives,
    revokingRep,
    addOpen,
    setAddOpen,
    url,
    setUrl,
    metaTag,
    setMetaTag,
    dnsInfo,
    setDnsInfo,
    method,
    setMethod,
    verifyEmail,
    setVerifyEmail,
    emailCode,
    setEmailCode,
    codeSentTo,
    emailBusy,
    setWebsiteId,
    step,
    setStep,
    loading,
    error,
    setError,
    claimedInfo,
    setClaimedInfo,
    removingId,
    revokingRepr,
    reprRevoked,
    cancellingId,
    removeDialog,
    setRemoveDialog,
    transferTo,
    setTransferTo,
    dialogLoading,
    approved,
    verifiedWebsites,
    pendingWebsites,
    handleRevokeRep,
    resetAddForm,
    handleChooseMethod,
    handleVerify,
    emailDomain,
    handleSendEmailCode,
    handleConfirmEmailCode,
    handleCancelPending,
    handleRemoveClick,
    handleDialogDelete,
    handleDialogTransfer,
    handleReprAction,
    handleCancelRequest,
    handleRemoveRep,
  }
}
