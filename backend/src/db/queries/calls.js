import { query } from '../../config/database.js'

export async function getCallHistory(userId, limit = 50) {
  const result = await query(
    `SELECT
       c.id, c.call_type, c.status, c.started_at, c.ended_at, c.duration_seconds,
       caller.id AS caller_id, caller.full_name AS caller_name, caller.avatar_url AS caller_avatar,
       callee.id AS callee_id, callee.full_name AS callee_name, callee.avatar_url AS callee_avatar,
       c.conversation_id,
       conv.name AS conversation_name, conv.avatar_url AS conversation_avatar, conv.type AS conversation_type
     FROM calls c
     LEFT JOIN users caller ON caller.id = c.caller_id
     LEFT JOIN users callee ON callee.id = c.callee_id
     LEFT JOIN conversations conv ON conv.id = c.conversation_id
     WHERE c.caller_id = $1 OR c.callee_id = $1
     ORDER BY c.started_at DESC
     LIMIT $2`,
    [userId, limit]
  )
  return result.rows
}

export async function createCall({ callerId, calleeId, conversationId, callType }) {
  const result = await query(
    `INSERT INTO calls (caller_id, callee_id, conversation_id, call_type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [callerId, calleeId, conversationId || null, callType]
  )
  return result.rows[0]
}

export async function updateCallStatus(callId, status, endedAt = null, durationSeconds = null) {
  const result = await query(
    `UPDATE calls
     SET status = $2, ended_at = COALESCE($3, ended_at), duration_seconds = COALESCE($4, duration_seconds)
     WHERE id = $1
     RETURNING *`,
    [callId, status, endedAt, durationSeconds]
  )
  return result.rows[0] || null
}

export async function getCallById(callId) {
  const result = await query(
    `SELECT * FROM calls WHERE id = $1`,
    [callId]
  )
  return result.rows[0] || null
}
