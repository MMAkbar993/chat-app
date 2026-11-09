import { query } from '../config/database.js'
import { sendProEndingSoonEmail } from '../config/email.js'

// Emails members whose free Pro time (users.pro_ends_at, e.g. won in the Christmas giveaway) ends
// within the next 7 days, once per end date. Skips Pro for life and anyone also on a paid plan,
// who will not lose Pro when the free time ends. Runs hourly from index.js.
const REMIND_BEFORE = '7 days'
const LIFETIME_FROM = '9999-01-01'

export async function remindProEndingSoon() {
  // Claim the rows first (set pro_reminder_sent_at), so two runs never email the same person.
  const { rows } = await query(
    `UPDATE users SET pro_reminder_sent_at = NOW()
     WHERE id IN (
       SELECT id FROM users
       WHERE pro_ends_at > NOW() AND pro_ends_at <= NOW() + $1::interval AND pro_ends_at < $2
         AND pro_reminder_sent_at IS NULL AND blocked_at IS NULL
         AND NOT (subscription_plan IN ('monthly','yearly') AND subscription_status IN ('active','past_due'))
       LIMIT 200
     )
     RETURNING id, email, display_name, full_name, pro_ends_at`,
    [REMIND_BEFORE, LIFETIME_FROM]
  )
  for (const u of rows) {
    try {
      await sendProEndingSoonEmail(u.email, u.display_name || u.full_name, u.pro_ends_at)
    } catch (err) {
      // Let a later run try again.
      await query(`UPDATE users SET pro_reminder_sent_at = NULL WHERE id = $1`, [u.id]).catch(() => {})
      console.error('Pro ending reminder failed for', u.id, err.message)
    }
  }
  return rows.length
}
