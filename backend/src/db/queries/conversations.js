import { query } from '../../config/database.js'

export async function getConversationsForUser(userId) {
  const result = await query(
    `SELECT
       c.id, c.type, c.name, c.avatar_url, c.created_at, c.updated_at,
       m.id AS last_message_id,
       m.content AS last_message,
       m.message_type AS last_message_type,
       m.created_at AS last_message_at,
       m.status AS last_message_status,
       m.sender_id AS last_message_sender_id,
       sender.full_name AS last_sender_name,
       cp.last_read_at,
       cp.is_archived, cp.is_pinned, cp.is_favorite, cp.is_muted,
       other_user.id AS other_user_id,
       other_user.full_name AS other_user_name,
       other_user.avatar_url AS other_user_avatar,
       other_user.display_name AS other_user_display_name,
       COUNT(unread.id) FILTER (WHERE unread.created_at > cp.last_read_at) AS unread_count
     FROM conversations c
     JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1 AND NOT cp.is_hidden
     LEFT JOIN LATERAL (
       SELECT * FROM messages WHERE conversation_id = c.id AND is_deleted = false
       ORDER BY created_at DESC LIMIT 1
     ) m ON true
     LEFT JOIN users sender ON sender.id = m.sender_id
     LEFT JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id != $1 AND c.type = 'direct'
     LEFT JOIN users other_user ON other_user.id = cp2.user_id
     LEFT JOIN messages unread ON unread.conversation_id = c.id AND unread.sender_id != $1
     GROUP BY c.id, c.type, c.name, c.avatar_url, c.created_at, c.updated_at,
              m.id, m.content, m.message_type, m.created_at, m.status, m.sender_id, sender.full_name, cp.last_read_at,
              cp.is_archived, cp.is_pinned, cp.is_favorite, cp.is_muted,
              other_user.id, other_user.full_name, other_user.avatar_url, other_user.display_name
     ORDER BY COALESCE(m.created_at, c.created_at) DESC`,
    [userId]
  )
  return result.rows
}

export async function toggleArchive(conversationId, userId) {
  const result = await query(
    `UPDATE conversation_participants SET is_archived = NOT is_archived
     WHERE conversation_id = $1 AND user_id = $2 RETURNING is_archived`,
    [conversationId, userId]
  )
  return result.rows[0]
}

export async function togglePin(conversationId, userId) {
  const result = await query(
    `UPDATE conversation_participants SET is_pinned = NOT is_pinned
     WHERE conversation_id = $1 AND user_id = $2 RETURNING is_pinned`,
    [conversationId, userId]
  )
  return result.rows[0]
}

export async function toggleFavorite(conversationId, userId) {
  const result = await query(
    `UPDATE conversation_participants SET is_favorite = NOT is_favorite
     WHERE conversation_id = $1 AND user_id = $2 RETURNING is_favorite`,
    [conversationId, userId]
  )
  return result.rows[0]
}

export async function toggleMute(conversationId, userId) {
  const result = await query(
    `UPDATE conversation_participants SET is_muted = NOT is_muted
     WHERE conversation_id = $1 AND user_id = $2 RETURNING is_muted`,
    [conversationId, userId]
  )
  return result.rows[0]
}

export async function deleteConversationForUser(conversationId, userId) {
  await query(
    `UPDATE conversation_participants SET is_hidden = true WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  )
}

export async function unhideParticipants(conversationId) {
  await query(
    `UPDATE conversation_participants SET is_hidden = false WHERE conversation_id = $1 AND is_hidden = true`,
    [conversationId]
  )
}

export async function clearConversationMessages(conversationId, userId) {
  await query(
    `UPDATE conversation_participants SET messages_cleared_at = NOW()
     WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  )
}

export async function getDirectConversation(userA, userB) {
  const result = await query(
    `SELECT c.id FROM conversations c
     JOIN conversation_participants p1 ON p1.conversation_id = c.id AND p1.user_id = $1
     JOIN conversation_participants p2 ON p2.conversation_id = c.id AND p2.user_id = $2
     WHERE c.type = 'direct'
     LIMIT 1`,
    [userA, userB]
  )
  if (!result.rows[0]) return null
  // Restore the conversation for userA if they had hidden it
  await query(
    `UPDATE conversation_participants SET is_hidden = false WHERE conversation_id = $1 AND user_id = $2 AND is_hidden = true`,
    [result.rows[0].id, userA]
  )
  return result.rows[0]
}

export async function createConversation({ type, name, avatarUrl, createdBy }) {
  const result = await query(
    `INSERT INTO conversations (type, name, avatar_url, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [type, name || null, avatarUrl || null, createdBy]
  )
  return result.rows[0]
}

export async function addParticipant(conversationId, userId, role = 'member') {
  await query(
    `INSERT INTO conversation_participants (conversation_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [conversationId, userId, role]
  )
}

export async function getParticipants(conversationId) {
  const result = await query(
    `SELECT u.id, u.full_name, u.username, u.avatar_url, u.display_name, cp.role, cp.last_read_at
     FROM conversation_participants cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.conversation_id = $1`,
    [conversationId]
  )
  return result.rows
}

export async function isParticipant(conversationId, userId) {
  const result = await query(
    `SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  )
  return result.rows.length > 0
}

export async function markRead(conversationId, userId) {
  await query(
    `UPDATE conversation_participants SET last_read_at = NOW()
     WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  )
}

export async function getConversationById(id) {
  const result = await query(
    `SELECT * FROM conversations WHERE id = $1`,
    [id]
  )
  return result.rows[0] || null
}

export async function removeParticipant(conversationId, userId) {
  await query(
    `DELETE FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  )
}

export async function updateConversation(id, { name, avatarUrl }) {
  const result = await query(
    `UPDATE conversations SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url)
     WHERE id = $3 RETURNING *`,
    [name || null, avatarUrl || null, id]
  )
  return result.rows[0]
}
