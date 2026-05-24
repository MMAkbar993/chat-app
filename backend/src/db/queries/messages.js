import { query } from '../../config/database.js'
import { getReactionsForMessages } from './reactions.js'

export async function getMessages(conversationId, userId, limit = 50, before = null) {
  const params = [conversationId, userId, limit]
  let beforeFilter = ''
  if (before) {
    params.push(before)
    beforeFilter = `AND m.created_at < $4`
  }
  const result = await query(
    `SELECT
       m.id, m.conversation_id, m.content, m.message_type, m.media_url,
       m.is_deleted, m.created_at, m.reply_to_message_id, m.status,
       u.id AS sender_id, u.full_name AS sender_name, u.avatar_url AS sender_avatar,
       u.display_name AS sender_display_name,
       rm.content AS reply_content,
       ru.full_name AS reply_sender_name
     FROM messages m
     LEFT JOIN users u ON u.id = m.sender_id
     LEFT JOIN messages rm ON rm.id = m.reply_to_message_id
     LEFT JOIN users ru ON ru.id = rm.sender_id
     LEFT JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = $2
     WHERE m.conversation_id = $1
       AND (cp.messages_cleared_at IS NULL OR m.created_at > cp.messages_cleared_at)
       ${beforeFilter}
     ORDER BY m.created_at DESC
     LIMIT $3`,
    params
  )
  const messages = result.rows.reverse()
  if (messages.length > 0) {
    const reactionsByMessage = await getReactionsForMessages(messages.map((m) => m.id))
    messages.forEach((m) => { m.reactions = reactionsByMessage[m.id] || [] })
  }
  return messages
}

export async function createMessage({ conversationId, senderId, content, messageType = 'text', mediaUrl = null, replyToMessageId = null, status = 'sent' }) {
  const result = await query(
    `INSERT INTO messages (conversation_id, sender_id, content, message_type, media_url, reply_to_message_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, conversation_id, sender_id, content, message_type, media_url, is_deleted, created_at, reply_to_message_id, status`,
    [conversationId, senderId, content, messageType, mediaUrl, replyToMessageId || null, status]
  )
  return result.rows[0]
}

export async function markMessagesDelivered(conversationId, recipientId) {
  const result = await query(
    `UPDATE messages SET status = 'delivered'
     WHERE conversation_id = $1 AND sender_id != $2 AND status = 'sent'
     RETURNING id, sender_id`,
    [conversationId, recipientId]
  )
  return result.rows
}

export async function markMessagesRead(conversationId, userId) {
  const result = await query(
    `UPDATE messages SET status = 'read'
     WHERE conversation_id = $1 AND sender_id != $2 AND status != 'read'
     RETURNING id, sender_id`,
    [conversationId, userId]
  )
  return result.rows
}

export async function getMessageById(id) {
  const result = await query(
    `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.message_type, m.media_url, m.is_deleted, m.created_at,
            u.full_name AS sender_name, u.display_name AS sender_display_name
     FROM messages m
     LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.id = $1`,
    [id]
  )
  return result.rows[0] || null
}

export async function deleteMessage(id, userId) {
  const result = await query(
    `UPDATE messages SET is_deleted = true, content = null
     WHERE id = $1 AND sender_id = $2
     RETURNING id`,
    [id, userId]
  )
  return result.rows[0] || null
}
