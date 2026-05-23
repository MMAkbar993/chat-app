import { stripe } from '../config/stripe.js'
import { config } from '../config/env.js'
import {
  findUserById,
  updateKycSession,
  updateKycStatus,
  updateSubscriptionStatus,
} from '../db/queries/users.js'

const stripeConfigured = (key) => key && !key.startsWith('sk_test_...')

export async function createKycSession(userId) {
  const user = await findUserById(userId)
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 })

  // TODO: re-enable KYC + subscription check when ready — bypass for now
  await updateSubscriptionStatus(userId, 'active')
  await updateKycStatus(userId, 'verified')
  return { url: null }
}
