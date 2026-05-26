import {
  createConversation,
  addParticipant,
  getParticipants,
  isParticipant,
  updateConversation,
  removeParticipant,
  getConversationById,
  getConversationsForUser,
} from '../db/queries/conversations.js'

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
    const { name } = req.body
    const updated = await updateConversation(req.params.id, { name })
    res.json({ group: updated })
  } catch (err) {
    next(err)
  }
}

export async function addMember(req, res, next) {
  try {
    const { userId } = req.body
    await addParticipant(req.params.id, userId)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function removeMember(req, res, next) {
  try {
    await removeParticipant(req.params.id, req.params.userId)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function leaveGroup(req, res, next) {
  try {
    await removeParticipant(req.params.id, req.user.id)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
