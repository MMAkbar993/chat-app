import { createKycSession } from '../services/kyc.service.js'
import { findUserById, updateKycStatus } from '../db/queries/users.js'
import { stripe } from '../config/stripe.js'
import { config } from '../config/env.js'
import { handleIdentityWebhook } from '../webhooks/stripeIdentityWebhook.js'

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

    // Check Stripe directly when pending — handles cases where webhook hasn't fired yet
    if (user.kyc_status === 'pending' && user.kyc_session_id) {
      try {
        const session = await stripe.identity.verificationSessions.retrieve(user.kyc_session_id)
        if (session.status === 'verified') {
          await updateKycStatus(user.id, 'verified')
          user.kyc_status = 'verified'
        } else if (session.status === 'requires_input') {
          await updateKycStatus(user.id, 'failed')
          user.kyc_status = 'failed'
        }
      } catch {
        // Stripe unreachable or key not set — use DB status as-is
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
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripeIdentityWebhookSecret)
  } catch (err) {
    console.error('KYC webhook signature failed:', err.message)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  try {
    await handleIdentityWebhook(event)
  } catch (err) {
    console.error('KYC webhook handler error:', err)
  }

  res.json({ received: true })
}
