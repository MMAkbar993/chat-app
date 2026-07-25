import axios from 'axios'
import { createKycSession } from '../services/kyc.service.js'
import { findUserById, updateKycStatus } from '../db/queries/users.js'
import { config } from '../config/env.js'
import { verifyDiditSignature, handleDiditWebhook } from '../webhooks/diditWebhook.js'

const DIDIT_BASE_URL = 'https://verification.didit.me/v3'
const APPROVED_STATUSES = ['Approved']
const FAILED_STATUSES = ['Declined', 'Expired', 'Not Finished']

export async function createSessionHandler(req, res, next) {
  try {
    const result = await createKycSession(req.user.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function statusHandler(req, res, next) {
  try {
    const user = await findUserById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Check Didit directly when pending — handles cases where the webhook hasn't fired yet
    if (user.kyc_status === 'pending' && user.kyc_session_id) {
      try {
        const { data } = await axios.get(
          `${DIDIT_BASE_URL}/session/${user.kyc_session_id}/decision/`,
          { headers: { 'x-api-key': config.diditApiKey } }
        )
        if (APPROVED_STATUSES.includes(data.status)) {
          await updateKycStatus(user.id, 'verified')
          user.kyc_status = 'verified'
        } else if (FAILED_STATUSES.includes(data.status)) {
          await updateKycStatus(user.id, 'failed')
          user.kyc_status = 'failed'
        }
      } catch {
        // Didit unreachable or key not set — use DB status as-is
      }
    }

    res.json({
      kyc_status: user.kyc_status,
      subscription_status: user.subscription_status,
      is_active: user.is_active,
    })
  } catch (err) {
    next(err)
  }
}

export async function webhookHandler(req, res) {
  const signature = req.headers['x-signature-v2']
  const timestamp = req.headers['x-timestamp']

  if (!verifyDiditSignature(req.body, signature, timestamp, config.diditWebhookSecret)) {
    console.error('KYC webhook signature failed')
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  let payload
  try {
    payload = JSON.parse(req.body.toString())
  } catch {
    return res.status(400).json({ error: 'Invalid webhook payload' })
  }

  try {
    await handleDiditWebhook(payload)
  } catch (err) {
    console.error('KYC webhook handler error:', err)
  }

  res.json({ received: true })
}
