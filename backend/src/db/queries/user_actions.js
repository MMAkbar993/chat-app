import { query } from '../../config/database.js'

export async function blockUser(blockerId, blockedId) {
  await query(
    `INSERT INTO blocked_users (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [blockerId, blockedId]
  )
}

export async function unblockUser(blockerId, blockedId) {
  await query(
    `DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2`,
    [blockerId, blockedId]
  )
}

export async function isBlocked(blockerId, blockedId) {
  const result = await query(
    `SELECT 1 FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2`,
    [blockerId, blockedId]
  )
  return result.rows.length > 0
}

export async function reportUser({ reporterId, reportedUserId, reason }) {
  await query(
    `INSERT INTO reports (reporter_id, reported_user_id, reason) VALUES ($1, $2, $3)`,
    [reporterId, reportedUserId, reason || null]
  )
}
