const PAID_PLANS = ['monthly', 'yearly']
const PAID_STATUSES = ['active', 'past_due']

export function isProUser(user) {
  return PAID_PLANS.includes(user?.subscription_plan) && PAID_STATUSES.includes(user?.subscription_status)
}
