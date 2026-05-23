import { query } from '../../config/database.js'

export async function toggleReaction(messageId, userId, emoji) {
  const del = await query(
    `DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3 RETURNING *`,
    [messageId, userId, emoji]
  )
  if (del.rows.length === 0) {
    await query(
      `INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)`,
      [messageId, userId, emoji]
    )
  }
}

export async function getReactionsForMessage(messageId) {
  const result = await query(
    `SELECT emoji, COUNT(*)::int AS count, ARRAY_AGG(user_id::text) AS reactors
     FROM message_reactions
     WHERE message_id = $1
     GROUP BY emoji`,
    [messageId]
  )
  return result.rows
}

export async function getReactionsForMessages(messageIds) {
  if (!messageIds.length) return {}
  const result = await query(
    `SELECT message_id::text, emoji, COUNT(*)::int AS count, ARRAY_AGG(user_id::text) AS reactors
     FROM message_reactions
     WHERE message_id = ANY($1::uuid[])
     GROUP BY message_id, emoji`,
    [messageIds]
  )
  const byMessage = {}
  for (const row of result.rows) {
    if (!byMessage[row.message_id]) byMessage[row.message_id] = []
    byMessage[row.message_id].push({ emoji: row.emoji, count: row.count, reactors: row.reactors })
  }
  return byMessage
}
