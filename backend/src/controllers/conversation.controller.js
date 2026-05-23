import {
  getConversationsForUser,
  getDirectConversation,
  createConversation,
  addParticipant,
  getParticipants,
  isParticipant,
  markRead,
  getConversationById,
  toggleArchive,
  togglePin,
  toggleFavorite,
  toggleMute,
  deleteConversationForUser,
  clearConversationMessages,
} from '../db/queries/conversations.js'

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
    res.json({
      conversation: {
        ...conv,
        participants,
        other_user_id: other?.id || null,
        other_user_name: other?.full_name || null,
        other_user_display_name: other?.display_name || null,
        other_user_avatar: other?.avatar_url || null,
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
    res.json({ conversation: { ...conv, participants } })
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
