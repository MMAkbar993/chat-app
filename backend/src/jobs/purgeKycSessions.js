import { query } from '../config/database.js'
import { config } from '../config/env.js'
import { purgeDiditSession, purgeExpiredFailedSessions } from '../services/kyc.service.js'

const BATCH = 100

// The safety net behind "verify and purge" (kyc.service.js), run hourly:
//   - a verified member whose check is still at Didit (a purge that failed at the time, or a
//     check made before purging was introduced) has it deleted
//   - a failed check is kept 30 days for review (kyc_failed_sessions), then deleted; sooner if
//     the member has since been verified
// 'review' and 'pending' are left alone: an admin or the member still needs them.
export async function purgeFinishedKycSessions() {
  if (!config.diditApiKey) return
  let after = '00000000-0000-0000-0000-000000000000'
  for (;;) {
    const { rows } = await query(
      `SELECT id, kyc_session_id FROM users
       WHERE kyc_session_id IS NOT NULL AND kyc_status = 'verified' AND id > $1
       ORDER BY id
       LIMIT ${BATCH}`,
      [after]
    )
    if (!rows.length) break
    after = rows[rows.length - 1].id
    for (const u of rows) await purgeDiditSession(u.id, u.kyc_session_id)
  }
  await purgeExpiredFailedSessions()
}
