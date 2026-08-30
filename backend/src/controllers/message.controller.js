import { getMessages, getMessageById, createMessage, deleteMessage, deleteMessageForMe, editMessage } from '../db/queries/messages.js'
import { isParticipant, getParticipants } from '../db/queries/conversations.js'
import { toggleReaction, getReactionsForMessage } from '../db/queries/reactions.js'
import { getIo } from '../socket/index.js'

export async function listMessages(req, res, next) {
  try {
    const ok = await isParticipant(req.params.conversationId, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a participant' })
    const { before } = req.query
    const messages = await getMessages(req.params.conversationId, req.user.id, 50, before || null)
    res.json({ messages })
  } catch (err) {
    next(err)
  }
}

export async function sendMessage(req, res, next) {
  try {
    const { conversationId } = req.params
    const { content, messageType = 'text', mediaUrl, replyToMessageId } = req.body
    if (!content && !mediaUrl) return res.status(400).json({ error: 'content required' })

    const ok = await isParticipant(conversationId, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a participant' })

    const msg = await createMessage({ conversationId, senderId: req.user.id, content, messageType, mediaUrl, replyToMessageId })

    const fullMsg = {
      ...msg,
      sender_id: req.user.id,
      sender_name: req.user.full_name,
      sender_avatar: req.user.avatar_url,
      sender_display_name: req.user.display_name,
    }

    const participants = await getParticipants(conversationId)
    const io = getIo()
    participants.forEach((p) => {
      if (p.id !== req.user.id) {
        io.to(`user:${p.id}`).emit('new-message', fullMsg)
      }
    })

    res.status(201).json({ message: fullMsg })
  } catch (err) {
    next(err)
  }
}

export async function forwardMessage(req, res, next) {
  try {
    const { messageId } = req.params
    const { targetConversationId } = req.body
    if (!targetConversationId) return res.status(400).json({ error: 'targetConversationId required' })

    const ok = await isParticipant(targetConversationId, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a participant in target conversation' })

    const original = await getMessageById(messageId)
    if (!original) return res.status(404).json({ error: 'Message not found' })

    const msg = await createMessage({
      conversationId: targetConversationId,
      senderId: req.user.id,
      content: original.content,
      messageType: original.message_type,
      mediaUrl: original.media_url,
    })

    const fullMsg = {
      ...msg,
      sender_id: req.user.id,
      sender_name: req.user.full_name,
      sender_avatar: req.user.avatar_url,
      sender_display_name: req.user.display_name,
    }

    const participants = await getParticipants(targetConversationId)
    const io = getIo()
    participants.forEach((p) => {
      io.to(`user:${p.id}`).emit('new-message', fullMsg)
    })

    res.status(201).json({ message: fullMsg })
  } catch (err) {
    next(err)
  }
}

export async function toggleReactionHandler(req, res, next) {
  try {
    const { messageId } = req.params
    const { emoji } = req.body
    if (!emoji) return res.status(400).json({ error: 'emoji required' })

    const msg = await getMessageById(messageId)
    if (!msg) return res.status(404).json({ error: 'Message not found' })

    const ok = await isParticipant(msg.conversation_id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a participant' })

    await toggleReaction(messageId, req.user.id, emoji)
    const reactions = await getReactionsForMessage(messageId)

    const participants = await getParticipants(msg.conversation_id)
    const io = getIo()
    participants.forEach((p) => {
      io.to(`user:${p.id}`).emit('reaction-updated', {
        messageId,
        conversationId: msg.conversation_id,
        reactions,
      })
    })

    res.json({ reactions })
  } catch (err) {
    next(err)
  }
}

export async function editMessageHandler(req, res, next) {
  try {
    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ error: 'content required' })

    const msg = await getMessageById(req.params.id)
    if (!msg) return res.status(404).json({ error: 'Message not found' })

    const ok = await isParticipant(msg.conversation_id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a participant' })

    const updated = await editMessage(req.params.id, req.user.id, content.trim())
    if (!updated) return res.status(403).json({ error: 'Cannot edit this message' })

    const participants = await getParticipants(updated.conversation_id)
    const io = getIo()
    participants.forEach((p) => {
      io.to(`user:${p.id}`).emit('message-edited', {
        messageId: updated.id,
        conversationId: updated.conversation_id,
        content: updated.content,
        edited_at: updated.edited_at,
      })
    })

    res.json({ message: updated })
  } catch (err) {
    next(err)
  }
}

export async function removeMessage(req, res, next) {
  try {
    const deleted = await deleteMessage(req.params.id, req.user.id)
    if (!deleted) return res.status(403).json({ error: 'Cannot delete this message' })

    // Same broadcast pattern as editMessageHandler — without this, the other participant's
    // open chat never learns the message was deleted (no live update at all until they reopen
    // the conversation), and nobody's sidebar preview re-syncs to whatever is now the true last
    // message.
    const participants = await getParticipants(deleted.conversation_id)
    const io = getIo()
    participants.forEach((p) => {
      io.to(`user:${p.id}`).emit('message-deleted', {
        messageId: deleted.id,
        conversationId: deleted.conversation_id,
      })
    })

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function removeMessageForMe(req, res, next) {
  try {
    await deleteMessageForMe(req.params.id, req.user.id)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
