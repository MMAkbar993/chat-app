const PAID_PLANS = ['monthly', 'yearly']
const PAID_STATUSES = ['active', 'past_due']

// Pro by a paid plan, or for a set time (pro_ends_at, e.g. won in the Christmas giveaway). Time
// based Pro needs no switching off: it simply stops counting once the date has passed.
export function isProUser(user) {
  if (PAID_PLANS.includes(user?.subscription_plan) && PAID_STATUSES.includes(user?.subscription_status)) return true
  return Boolean(user?.pro_ends_at) && new Date(user.pro_ends_at).getTime() > Date.now()
}

// Pro given for free for a set time (the Christmas giveaway), when it is not also a paid plan:
// the date it ends, or null. Lifetime gifts end in the year 9999.
export function giftProEnd(user) {
  if (PAID_PLANS.includes(user?.subscription_plan) && PAID_STATUSES.includes(user?.subscription_status)) return null
  const end = user?.pro_ends_at ? new Date(user.pro_ends_at) : null
  return end && end.getTime() > Date.now() ? end : null
}

export function giftProText(end) {
  if (!end) return ''
  return end.getUTCFullYear() >= 9999
    ? 'for life'
    : `until ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`
}
