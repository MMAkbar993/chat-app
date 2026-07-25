import {
  createConversation,
  addParticipant,
  getParticipants,
  isParticipant,
  updateConversation,
  removeParticipant,
  setParticipantRole,
  getConversationById,
  getConversationsForUser,
} from '../db/queries/conversations.js'
import { getIo } from '../socket/index.js'
import { isProUser } from '../utils/plan.js'

export async function listGroups(req, res, next) {
  try {
    const all = await getConversationsForUser(req.user.id)
    res.json({ groups: all.filter((c) => c.type === 'group') })
  } catch (err) {
    next(err)
  }
}

export async function createGroup(req, res, next) {
  try {
    if (!isProUser(req.user)) {
      return res.status(403).json({ error: 'Groups are a Pro feature', code: 'PRO_REQUIRED' })
    }
    const { name, memberIds } = req.body
    if (!name) return res.status(400).json({ error: 'name required' })

    const group = await createConversation({ type: 'group', name, createdBy: req.user.id })
    await addParticipant(group.id, req.user.id, 'admin')

    const ids = Array.isArray(memberIds) ? memberIds : []
    for (const id of ids) {
      if (id !== req.user.id) await addParticipant(group.id, id)
    }

    const participants = await getParticipants(group.id)
    res.status(201).json({ group: { ...group, participants } })
  } catch (err) {
    next(err)
  }
}

export async function getGroup(req, res, next) {
  try {
    const group = await getConversationById(req.params.id)
    if (!group || group.type !== 'group') return res.status(404).json({ error: 'Group not found' })
    const ok = await isParticipant(group.id, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a member' })
    const participants = await getParticipants(group.id)
    res.json({ group: { ...group, participants } })
  } catch (err) {
    next(err)
  }
}

export async function updateGroup(req, res, next) {
  try {
    const { name, description } = req.body
    const updated = await updateConversation(req.params.id, { name, description })
    res.json({ group: updated })
  } catch (err) {
    next(err)
  }
}

export async function uploadGroupAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const avatarUrl = `/uploads/${req.file.filename}`
    const updated = await updateConversation(req.params.id, { avatarUrl })
    res.json({ avatarUrl, group: updated })
  } catch (err) {
    next(err)
  }
}

export async function addMember(req, res, next) {
  try {
    const { userId } = req.body
    await addParticipant(req.params.id, userId)
    const participants = await getParticipants(req.params.id)
    const io = getIo()
    if (io) {
      io.to(`user:${userId}`).emit('reload-conversations')
      participants.forEach((p) =>
        io.to(`user:${p.id}`).emit('group-members-updated', { conversationId: req.params.id, participants })
      )
    }
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function removeMember(req, res, next) {
  try {
    const conversationId = req.params.id
    const userId = req.params.userId
    await removeParticipant(conversationId, userId)
    const participants = await getParticipants(conversationId)
    const io = getIo()
    if (io) {
      io.to(`user:${userId}`).emit('conversation-removed', { conversationId })
      participants.forEach((p) =>
        io.to(`user:${p.id}`).emit('group-members-updated', { conversationId, participants })
      )
    }
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function leaveGroup(req, res, next) {
  try {
    const conversationId = req.params.id
    const participants = await getParticipants(conversationId)
    const me = participants.find((p) => p.id === req.user.id)
    const others = participants.filter((p) => p.id !== req.user.id)

    // If I'm the only admin and other members remain, hand off admin before I go —
    // otherwise the group is left with no one able to manage it.
    if (me?.role === 'admin' && others.length > 0 && !others.some((p) => p.role === 'admin')) {
      const successor = [...others].sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at))[0]
      await setParticipantRole(conversationId, successor.id, 'admin')
    }

    await removeParticipant(conversationId, req.user.id)

    const io = getIo()
    if (io && others.length > 0) {
      const remaining = await getParticipants(conversationId)
      remaining.forEach((p) =>
        io.to(`user:${p.id}`).emit('group-members-updated', { conversationId, participants: remaining })
      )
    }
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
