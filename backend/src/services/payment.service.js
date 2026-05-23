import { stripe } from '../config/stripe.js'
import { config } from '../config/env.js'
import { findUserById, updateSubscription, updateSubscriptionStatus, updateStripeCustomer } from '../db/queries/users.js'

function isStripeConfigured(key) {
  return Boolean(key) && /^sk_(test|live)_[A-Za-z0-9]{20,}/.test(key)
}

export async function createSubscription(userId, planType) {
  const user = await findUserById(userId)
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 })

  if (!isStripeConfigured(config.stripeSecretKey)) {
    await updateSubscription(userId, {
      subscriptionId: 'dev_bypass',
      plan: planType,
      status: 'active',
    })
    await updateSubscriptionStatus(userId, 'active')
    return { subscriptionId: 'dev_bypass', clientSecret: null }
  }

  let customerId = user.stripe_customer_id
  if (!customerId) {
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      name: user.full_name,
      metadata: { userId: user.id },
    })
    await updateStripeCustomer(userId, stripeCustomer.id)
    customerId = stripeCustomer.id
  }

  const priceId = planType === 'yearly' ? config.stripeYearlyPriceId : config.stripeMonthlyPriceId

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
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
