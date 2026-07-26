import axios from 'axios'
import { config } from '../config/env.js'
import {
  findUserById,
  updateKycSession,
  updateKycStatus,
  updateFullName,
} from '../db/queries/users.js'

const DIDIT_BASE_URL = 'https://verification.didit.me/v3'
const FAILED_STATUSES = ['Declined', 'Expired', 'Not Finished']

function extractVerifiedName(decision) {
  const idv = decision.id_verifications?.[0]
  if (!idv) return null
  return idv.full_name || [idv.first_name, idv.last_name].filter(Boolean).join(' ') || null
}

// Single place that turns a Didit decision into our internal kyc_status — used by the
// create-session short-circuit, the status poll, and the webhook, so all three land on the
// same behavior (including pulling the verified legal name off the ID once Approved).
export async function applyKycDecision(userId, decision) {
  if (decision.status === 'Approved') {
    await updateKycStatus(userId, 'verified')
    const verifiedName = extractVerifiedName(decision)
    if (verifiedName) await updateFullName(userId, verifiedName)
    return 'verified'
  }
  if (FAILED_STATUSES.includes(decision.status)) {
    await updateKycStatus(userId, 'failed')
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

  if (!config.diditApiKey || !config.diditWorkflowId) {
    // Dev fallback when Didit isn't configured at all — mirrors the same
    // graceful-degradation pattern used in payment.service.js.
    await updateKycStatus(userId, 'verified')
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
      const outcome = await applyKycDecision(userId, decision)
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
