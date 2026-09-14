import {
  getConversationsForUser,
  getDirectConversation,
  createConversation,
  addParticipant,
  getParticipants,
  isParticipant,
  markRead,
  markUnread,
  getConversationById,
  toggleArchive,
  togglePin,
  toggleFavorite,
  toggleMute,
  deleteConversationForUser,
  clearConversationMessages,
  setPinnedMessage,
  getPinnedMessage,
} from '../db/queries/conversations.js'
import { isContact } from '../db/queries/contacts.js'
import { searchMessages, getMessageById } from '../db/queries/messages.js'
import { getIo } from '../socket/index.js'

export async function searchMessagesHandler(req, res, next) {
  try {
    const term = (req.query.q || '').trim()
    if (term.length < 2) return res.json({ messages: [] })
    const messages = await searchMessages(req.user.id, term)
    res.json({ messages })
  } catch (err) {
    next(err)
  }
}

export async function listConversations(req, res, next) {
  try {
    const conversations = await getConversationsForUser(req.user.id)
    res.json({ conversations })
  } catch (err) {
    next(err)
  }
}

export async function getOrCreateDirect(req, res, next) {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: 'userId required' })
    if (userId === req.user.id) return res.status(400).json({ error: 'Cannot chat with yourself' })

    let conv = await getDirectConversation(req.user.id, userId)
    if (!conv) {
      conv = await createConversation({ type: 'direct', createdBy: req.user.id })
      await addParticipant(conv.id, req.user.id)
      await addParticipant(conv.id, userId)
    }
    const participants = await getParticipants(conv.id)
    const other = participants.find((p) => p.id !== req.user.id)
    const alreadyContact = other ? await isContact(req.user.id, other.id) : true
    res.json({
      conversation: {
        ...conv,
        participants,
        other_user_id: other?.id || null,
        other_user_name: other?.full_name || null,
        other_user_display_name: other?.display_name || null,
        other_user_avatar: other?.avatar_url || null,
        is_contact: alreadyContact,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getConversation(req, res, next) {
  try {
    const conv = await getConversationById(req.params.id)
    if (!conv) return res.status(404).json({ error: 'Conversation not found' })
    const ok = await isParticipant(conv.id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a participant' })
    const participants = await getParticipants(conv.id)
    // The list endpoint (getConversationsForUser) flattens a direct chat's other participant
    // onto the row as other_user_* plus is_contact, which the header, avatar and "Add Contact"
    // banner all read directly. This single-conversation fetch had returned none of that —
    // fine for a group (name comes from the row itself) but for a direct chat it left the
    // header with nothing to show except its "Account Deleted" fallback, for someone very
    // much not deleted.
    let extra = {}
    if (conv.type === 'direct') {
      const other = participants.find((p) => p.id !== req.user.id)
      if (other) {
        extra = {
          other_user_id: other.id,
          other_user_name: other.full_name,
          other_user_display_name: other.display_name,
          other_user_avatar: other.avatar_url,
          is_contact: await isContact(req.user.id, other.id),
        }
      }
    }
    res.json({ conversation: { ...conv, ...extra, participants } })
  } catch (err) {
    next(err)
  }
}

export async function markConversationRead(req, res, next) {
  try {
    await markRead(req.params.id, req.user.id)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function markConversationUnread(req, res, next) {
  try {
    const ok = await isParticipant(req.params.id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a participant' })
    await markUnread(req.params.id, req.user.id)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function archiveConversation(req, res, next) {
  try {
    const ok = await isParticipant(req.params.id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a participant' })
    const result = await toggleArchive(req.params.id, req.user.id)
    res.json({ is_archived: result.is_archived })
  } catch (err) {
    next(err)
  }
}

export async function pinConversation(req, res, next) {
  try {
    const ok = await isParticipant(req.params.id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a participant' })
    const result = await togglePin(req.params.id, req.user.id)
    res.json({ is_pinned: result.is_pinned })
  } catch (err) {
    next(err)
  }
}

export async function favoriteConversation(req, res, next) {
  try {
    const ok = await isParticipant(req.params.id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a participant' })
    const result = await toggleFavorite(req.params.id, req.user.id)
    res.json({ is_favorite: result.is_favorite })
  } catch (err) {
    next(err)
  }
}

export async function muteConversation(req, res, next) {
  try {
    const ok = await isParticipant(req.params.id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a participant' })
    const result = await toggleMute(req.params.id, req.user.id)
    res.json({ is_muted: result.is_muted })
  } catch (err) {
    next(err)
  }
}

export async function deleteConversation(req, res, next) {
  try {
    const ok = await isParticipant(req.params.id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a participant' })
    await deleteConversationForUser(req.params.id, req.user.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function clearConversation(req, res, next) {
  try {
    const ok = await isParticipant(req.params.id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a participant' })
    await clearConversationMessages(req.params.id, req.user.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

// Who may change the pin: in a group, admins only — the pin is the group's notice board, and
// letting any member overwrite it turns it into a race. In a DM both people are equals, so
// either side can set it.
async function canPin(conversation, userId) {
  if (conversation.type !== 'group') return isParticipant(conversation.id, userId)
  const participants = await getParticipants(conversation.id)
  return participants.find((p) => p.id === userId)?.role === 'admin'
}

async function broadcastPin(conversationId, pinned) {
  const participants = await getParticipants(conversationId)
  const io = getIo()
  participants.forEach((p) => io.to(`user:${p.id}`).emit('pinned-message-changed', { conversationId, pinned }))
}

export async function getPinnedMessageHandler(req, res, next) {
  try {
    if (!(await isParticipant(req.params.id, req.user.id))) {
      return res.status(403).json({ error: 'Not a participant' })
    }
    res.json({ pinned: await getPinnedMessage(req.params.id) })
  } catch (err) {
    next(err)
  }
}

export async function pinMessage(req, res, next) {
  try {
    const conversation = await getConversationById(req.params.id)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    if (!(await canPin(conversation, req.user.id))) {
      return res.status(403).json({ error: 'Only group admins can pin a message' })
    }
    // The message has to belong to this conversation, or a pin becomes a way to pull an
    // arbitrary message id out of a thread you are not in.
    const message = await getMessageById(req.body.messageId)
    if (!message || message.conversation_id !== conversation.id || message.is_deleted) {
      return res.status(404).json({ error: 'Message not found in this conversation' })
    }
    await setPinnedMessage(conversation.id, message.id, req.user.id)
    const pinned = await getPinnedMessage(conversation.id)
    await broadcastPin(conversation.id, pinned)
    res.json({ pinned })
  } catch (err) {
    next(err)
  }
}

export async function unpinMessage(req, res, next) {
  try {
    const conversation = await getConversationById(req.params.id)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    if (!(await canPin(conversation, req.user.id))) {
      return res.status(403).json({ error: 'Only group admins can unpin a message' })
    }
    await setPinnedMessage(conversation.id, null, null)
    await broadcastPin(conversation.id, null)
    res.json({ pinned: null })
  } catch (err) {
    next(err)
  }
}
