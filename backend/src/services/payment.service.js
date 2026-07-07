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

export async function getBillingInfo(userId) {
  const user = await findUserById(userId)
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 })

  const base = {
    plan: user.subscription_plan || null,
    status: user.subscription_status || 'inactive',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    paymentMethod: null,
    invoices: [],
  }

  const hasRealStripeSubscription =
    isStripeConfigured(config.stripeSecretKey) &&
    user.stripe_customer_id &&
    user.stripe_subscription_id &&
    user.stripe_subscription_id !== 'dev_bypass'

  if (!hasRealStripeSubscription) return base

  try {
    const [subscription, customer, invoicesResult] = await Promise.all([
      stripe.subscriptions.retrieve(user.stripe_subscription_id),
      stripe.customers.retrieve(user.stripe_customer_id, {
        expand: ['invoice_settings.default_payment_method'],
      }),
      stripe.invoices.list({ customer: user.stripe_customer_id, limit: 12 }),
    ])

    base.currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null
    base.cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end)

    const pm = customer.invoice_settings?.default_payment_method
    if (pm?.card) {
      base.paymentMethod = {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      }
    }

    base.invoices = invoicesResult.data.map((inv) => ({
      id: inv.id,
      date: new Date(inv.created * 1000).toISOString(),
      amount: (inv.amount_paid ?? inv.total ?? 0) / 100,
      currency: (inv.currency || 'eur').toUpperCase(),
      status: inv.status,
      hostedInvoiceUrl: inv.hosted_invoice_url || null,
      invoicePdf: inv.invoice_pdf || null,
    }))
  } catch (err) {
    console.error('Failed to load billing info from Stripe:', err.message)
  }

  return base
}
