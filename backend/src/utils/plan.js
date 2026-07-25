const PAID_PLANS = ['monthly', 'yearly']
const PAID_STATUSES = ['active', 'past_due']

export function isProUser(user) {
  return PAID_PLANS.includes(user?.subscription_plan) && PAID_STATUSES.includes(user?.subscription_status)
}

export const FREE_CALL_SECONDS_PER_MONTH = 30 * 60
export const FREE_FILE_SIZE_BYTES = 5 * 1024 * 1024
