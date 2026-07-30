import { query } from '../config/database.js'
import { sendUnreadMessageEmail } from '../config/email.js'

// Finds participants sitting on an unread message older than 24h and emails them once —
// unread_notified_at is only cleared by last_read_at moving forward (i.e. they actually read),
// so a participant who never opens the app doesn't get re-emailed every poll cycle.
export async function checkUnreadMessages() {
  const result = await query(`
    SELECT
      cp.user_id, cp.conversation_id,
      u.email, u.display_name, u.full_name,
      m.id AS message_id, m.created_at AS message_created_at,
      su.display_name AS sender_display_name, su.full_name AS sender_full_name
    FROM conversation_participants cp
    JOIN users u ON u.id = cp.user_id
    JOIN LATERAL (
      SELECT id, sender_id, created_at
      FROM messages
      WHERE conversation_id = cp.conversation_id
        AND created_at > cp.last_read_at
        AND sender_id != cp.user_id
        AND is_deleted = false
      ORDER BY created_at DESC
      LIMIT 1
    ) m ON true
    JOIN users su ON su.id = m.sender_id
    WHERE m.created_at < NOW() - INTERVAL '24 hours'
      AND (cp.unread_notified_at IS NULL OR cp.unread_notified_at < cp.last_read_at)
  `)

  for (const row of result.rows) {
    try {
      await sendUnreadMessageEmail(
        row.email,
        row.display_name || row.full_name,
        row.sender_display_name || row.sender_full_name
      )
      await query(
        `UPDATE conversation_participants SET unread_notified_at = NOW() WHERE user_id = $1 AND conversation_id = $2`,
        [row.user_id, row.conversation_id]
      )
    } catch (err) {
      console.error('Unread message email failed for', row.user_id, err.message)
    }
  }

  return result.rows.length
}
