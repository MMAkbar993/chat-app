import axios from 'axios'
import { config } from '../config/env.js'
import {
  findUserById,
  updateKycSession,
  updateKycStatus,
  setVerifiedName,
  clearKycSession,
} from '../db/queries/users.js'
import { sendWelcomeEmail } from '../config/email.js'

const DIDIT_BASE_URL = 'https://verification.didit.me/v3'
const FAILED_STATUSES = ['Declined', 'Expired', 'Not Finished']
// Didit statuses after which a session will not change again.
export const FINAL_STATUSES = ['Approved', ...FAILED_STATUSES]

// Verify and purge. Once a check has a final outcome, Pulse keeps the verified name and the
// status, and asks Didit to delete the session: document images, selfie, liveness video,
// extracted data, the decision and the face data (docs.didit.me/console/data-retention,
// "process and purge"). A 404 means it is already gone. Never throws: a failed purge is
// retried by jobs/purgeKycSessions.js, which finds it because kyc_session_id is still set.
export async function purgeDiditSession(userId, sessionId) {
  if (!sessionId || !config.diditApiKey) return false
  try {
    await axios.delete(`${DIDIT_BASE_URL}/session/${sessionId}/delete/`, {
      headers: { 'x-api-key': config.diditApiKey },
    })
  } catch (err) {
    if (err.response?.status !== 404) {
      console.error(`Didit purge failed for session ${sessionId}:`, err.response?.status || err.message)
      return false
    }
  }
  await clearKycSession(userId, sessionId)
  return true
}

function extractVerifiedName(decision) {
  const idv = decision.id_verifications?.[0]
  if (!idv) return null
  return idv.full_name || [idv.first_name, idv.last_name].filter(Boolean).join(' ') || null
}

// Single place that turns a Didit decision into our internal kyc_status — used by the
// create-session short-circuit, the status poll, and the webhook, so all three land on the
// same behavior (including pulling the verified legal name off the ID once Approved).
// `sessionId` is the Didit session the decision belongs to; it is purged once the outcome is
// final. A check sent to an admin ('review') is kept until the admin decides, since they need
// to see the document in the Didit dashboard (admin.controller.js kycAction purges it then).
export async function applyKycDecision(userId, decision, sessionId) {
  if (decision.status === 'Approved') {
    const user = await findUserById(userId)
    const wasAlreadyVerified = user?.kyc_status === 'verified'
    // A repeat webhook for someone already verified (by Didit or by an admin) changes nothing,
    // apart from making sure the session is gone.
    if (wasAlreadyVerified) {
      await purgeDiditSession(userId, sessionId)
      return 'verified'
    }

    // The name on Pulse must come from the ID. An approval without one goes to an admin
    // (status 'review', account stays inactive) rather than keeping the name typed at sign-up.
    const verifiedName = extractVerifiedName(decision)
    if (!verifiedName) {
      if (user?.kyc_status !== 'review') await updateKycStatus(userId, 'review')
      return 'review'
    }

    const { displayName } = await setVerifiedName(userId, verifiedName)
    await updateKycStatus(userId, 'verified')
    await purgeDiditSession(userId, sessionId)
    if (user) sendWelcomeEmail(user.email, displayName).catch(() => {})
    return 'verified'
  }
  if (FAILED_STATUSES.includes(decision.status)) {
    await updateKycStatus(userId, 'failed')
    await purgeDiditSession(userId, sessionId)
    return 'failed'
  }
  return null
}

export async function createKycSession(userId) {
  const user = await findUserById(userId)
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 })

  if (user.kyc_status === 'verified') {
    return { url: null }
  }
  if (user.kyc_status === 'review') {
    return { url: null, status: 'review' }
  }

  if (!config.diditApiKey || !config.diditWorkflowId) {
    // Dev fallback when Didit isn't configured at all — mirrors the same
    // graceful-degradation pattern used in payment.service.js.
    // (kyc_status !== 'verified' is guaranteed here, the check above already returned otherwise)
    await updateKycStatus(userId, 'verified')
    sendWelcomeEmail(user.email, user.display_name || user.full_name).catch(() => {})
    return { url: null }
  }

  // Reuse an in-flight or just-completed session instead of always creating a new one.
  // VerifyPage.jsx calls this on every mount, including the redirect back from Didit — without
  // this check, that return-trip would silently create a fresh, never-touched session and
  // orphan the one the user actually just completed, leaving the app polling a session that
  // will sit at "Not Started" forever.
  if (user.kyc_session_id) {
    try {
      const { data: decision } = await axios.get(
        `${DIDIT_BASE_URL}/session/${user.kyc_session_id}/decision/`,
        { headers: { 'x-api-key': config.diditApiKey } }
      )
      const outcome = await applyKycDecision(userId, decision, user.kyc_session_id)
      if (outcome === 'verified') {
        return { url: null }
      }
      if (outcome === null) {
        // Still in progress (Not Started / In Progress / In Review) — send them back to the
        // same session rather than starting a new one.
        return { url: decision.session_url }
      }
      // outcome === 'failed' — this attempt is done, fall through to start a fresh one.
    } catch {
      // Couldn't look it up — fall through and create a fresh session.
    }
  }

  const { data } = await axios.post(
    `${DIDIT_BASE_URL}/session/`,
    {
      workflow_id: config.diditWorkflowId,
      vendor_data: userId,
      callback: `${config.frontendUrl}/verify?session_id=${userId}`,
    },
    { headers: { 'x-api-key': config.diditApiKey } }
  )

  await updateKycSession(userId, data.session_id)
  return { url: data.url }
}
