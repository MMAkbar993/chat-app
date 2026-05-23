import { body } from 'express-validator'
import { validate } from '../middleware/validate.js'
import { createSubscription } from '../services/payment.service.js'
import { stripe } from '../config/stripe.js'
import { config } from '../config/env.js'
import { handlePaymentWebhook } from '../webhooks/stripeWebhook.js'

export const createSubscriptionValidators = [
  body('planType').isIn(['monthly', 'yearly']).withMessage('planType must be monthly or yearly'),
]

export async function createSubscriptionHandler(req, res, next) {
  try {
    const { planType } = req.body
    const result = await createSubscription(req.user.id, planType)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function webhookHandler(req, res) {
  const sig = req.headers['stripe-signature']
  let event
  if (config.stripeWebhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret)
    } catch (err) {
      console.error('Payment webhook signature failed:', err.message)
      return res.status(400).json({ error: 'Webhook signature verification failed' })
    }
  } else {
    try {
      event = JSON.parse(req.body.toString())
    } catch {
      return res.status(400).json({ error: 'Invalid webhook payload' })
    }
  }

  try {
    await handlePaymentWebhook(event)
  } catch (err) {
    console.error('Payment webhook handler error:', err)
  }

  res.json({ received: true })
}
