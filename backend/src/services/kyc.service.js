import axios from 'axios'
import { config } from '../config/env.js'
import {
  findUserById,
  updateKycSession,
  updateKycStatus,
} from '../db/queries/users.js'

const DIDIT_BASE_URL = 'https://verification.didit.me/v3'

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
