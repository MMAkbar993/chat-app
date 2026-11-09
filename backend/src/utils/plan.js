const PAID_PLANS = ['monthly', 'yearly']
const PAID_STATUSES = ['active', 'past_due']

// Pro by a paid plan, or for a set time (pro_ends_at, e.g. won in the Christmas giveaway). Time
// based Pro needs no switching off: it simply stops counting once the date has passed.
export function isProUser(user) {
  if (PAID_PLANS.includes(user?.subscription_plan) && PAID_STATUSES.includes(user?.subscription_status)) return true
  return Boolean(user?.pro_ends_at) && new Date(user.pro_ends_at).getTime() > Date.now()
}

export const FREE_CALL_SECONDS_PER_MONTH = 30 * 60
export const FREE_FILE_SIZE_BYTES = 5 * 1024 * 1024
