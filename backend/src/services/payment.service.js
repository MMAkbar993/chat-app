import { stripe } from '../config/stripe.js'
import { config } from '../config/env.js'
import { findUserById, updateSubscription, updateSubscriptionStatus } from '../db/queries/users.js'

const stripeConfigured = (key) => key && !key.startsWith('sk_test_...')

export async function createSubscription(userId, planType) {
  const user = await findUserById(userId)
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 })

  if (!stripeConfigured(config.stripeSecretKey)) {
    await updateSubscription(userId, {
      subscriptionId: 'dev_bypass',
      plan: planType,
      status: 'active',
    })
    await updateSubscriptionStatus(userId, 'active')
    return { subscriptionId: 'dev_bypass', clientSecret: null }
  }

  if (!user.stripe_customer_id) throw Object.assign(new Error('Stripe customer not set up'), { status: 400 })

  const priceId = planType === 'yearly' ? config.stripeYearlyPriceId : config.stripeMonthlyPriceId

  const subscription = await stripe.subscriptions.create({
    customer: user.stripe_customer_id,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })

  await updateSubscription(userId, {
    subscriptionId: subscription.id,
    plan: planType,
    status: 'incomplete',
  })

  return {
    subscriptionId: subscription.id,
    clientSecret: subscription.latest_invoice.payment_intent.client_secret,
  }
}
