import axios from 'axios'
import { query } from '../config/database.js'
import { config } from '../config/env.js'
import { purgeDiditSession, FINAL_STATUSES } from '../services/kyc.service.js'

const DIDIT_BASE_URL = 'https://verification.didit.me/v3'
const BATCH = 100

// The safety net behind "verify and purge" (kyc.service.js). Deletes, at Didit, any finished
// identity check that is still there: a purge that failed at decision time, and every check made
// before purging was introduced. A member still holding a kyc_session_id means it has not been
// purged yet.
//   - verified members: always finished (a verified member never starts another check)
//   - failed members: may already be on a new attempt, so Didit is asked first and only a
//     session with a final outcome is deleted
//   - 'review' and 'pending' are left alone: an admin or the member still needs them
export async function purgeFinishedKycSessions() {
  if (!config.diditApiKey) return
  // Walks every candidate once per run, a batch at a time (members still mid-check are skipped,
  // so a cursor rather than "first N" keeps them from blocking everyone after them).
  let after = '00000000-0000-0000-0000-000000000000'
  for (;;) {
    const { rows } = await query(
      `SELECT id, kyc_status, kyc_session_id FROM users
       WHERE kyc_session_id IS NOT NULL AND kyc_status IN ('verified', 'failed') AND id > $1
       ORDER BY id
       LIMIT ${BATCH}`,
      [after]
    )
    if (!rows.length) return
    after = rows[rows.length - 1].id
    await purgeBatch(rows)
  }
}

async function purgeBatch(rows) {
  for (const u of rows) {
    if (u.kyc_status === 'failed') {
      let finished = false
      try {
        const { data } = await axios.get(`${DIDIT_BASE_URL}/session/${u.kyc_session_id}/decision/`, {
          headers: { 'x-api-key': config.diditApiKey },
        })
        finished = FINAL_STATUSES.includes(data.status)
      } catch (err) {
        // Already deleted at Didit: just forget the id.
        finished = err.response?.status === 404
      }
      if (!finished) continue
    }
    await purgeDiditSession(u.id, u.kyc_session_id)
  }
}
