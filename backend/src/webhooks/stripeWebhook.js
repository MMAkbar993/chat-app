import { findUserByStripeCustomer, updateSubscriptionStatus } from '../db/queries/users.js'

export async function handlePaymentWebhook(event) {
  switch (event.type) {
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object
      const customerId = invoice.customer
      const user = await findUserByStripeCustomer(customerId)
      if (user) await updateSubscriptionStatus(user.id, 'active')
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const customerId = invoice.customer
      const user = await findUserByStripeCustomer(customerId)
      if (user) await updateSubscriptionStatus(user.id, 'past_due')
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const customerId = subscription.customer
      const user = await findUserByStripeCustomer(customerId)
      if (user) await updateSubscriptionStatus(user.id, 'cancelled')
      break
    }
    default:
      break
  }
}
