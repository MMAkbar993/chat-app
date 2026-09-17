import crypto from 'crypto'
import {
  createConversation,
  addParticipant,
  getParticipants,
  isParticipant,
  updateConversation,
  setAdminsOnlyMessaging,
  removeParticipant,
  setParticipantRole,
  getConversationById,
  getConversationsForUser,
  setInviteCode,
  getGroupByInviteCode,
  deleteConversation,
} from '../db/queries/conversations.js'
import { getIo } from '../socket/index.js'
import { isProUser } from '../utils/plan.js'
import { isContact } from '../db/queries/contacts.js'
import { query } from '../config/database.js'

// Someone with restrict_group_add on can only be pulled into a group by a person they have
// already added as a contact — otherwise any stranger who finds them can drop them into any
// group unannounced, which is the whole thing the setting exists to stop. Checked server-side
// because the client hiding a name from a picker is a courtesy, not a boundary.
async function canAddToGroup(targetUserId, inviterId) {
  const result = await query(
    `SELECT restrict_group_add FROM users WHERE id = $1`,
    [targetUserId]
  )
  if (!result.rows[0]?.restrict_group_add) return true
  return isContact(targetUserId, inviterId)
}

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
    let skipped = 0
    for (const id of ids) {
      if (id === req.user.id) continue
      if (!(await canAddToGroup(id, req.user.id))) { skipped++; continue }
      await addParticipant(group.id, id)
    }

    const participants = await getParticipants(group.id)
    // The group is still created — one restricted invitee shouldn't fail the whole thing —
    // but the count is reported so the creator isn't left wondering who went missing.
    res.status(201).json({ group: { ...group, participants }, skipped })
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
    const { name, description, adminsOnlyMessaging } = req.body
    let updated = await updateConversation(req.params.id, { name, description })

    // Gated separately and only when present: this toggle controls who can post at all, unlike
    // the name/description above which any member can already change, so it needs its own
    // admin check rather than inheriting theirs.
    if (adminsOnlyMessaging !== undefined) {
      const participants = await getParticipants(req.params.id)
      const role = participants.find((p) => p.id === req.user.id)?.role
      if (role !== 'admin') return res.status(403).json({ error: 'Only admins can change this setting' })
      updated = await setAdminsOnlyMessaging(req.params.id, Boolean(adminsOnlyMessaging))
    }

    const io = getIo()
    if (io) {
      const participants = await getParticipants(req.params.id)
      participants.forEach((p) => io.to(`user:${p.id}`).emit('reload-conversations'))
    }

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
    if (!(await canAddToGroup(userId, req.user.id))) {
      return res.status(403).json({
        error: 'This person only accepts group invites from their own contacts.',
        code: 'GROUP_ADD_RESTRICTED',
      })
    }
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

// ── Invite links ─────────────────────────────────────────────────────────────

// 16 bytes of randomness, URL-safe. The code IS the credential — anyone holding the link can
// join — so it must not be guessable or derivable from the group id.
function newInviteCode() {
  return crypto.randomBytes(16).toString('base64url')
}

async function requireGroupAdmin(conversationId, userId) {
  const participants = await getParticipants(conversationId)
  const me = participants.find((p) => p.id === userId)
  return me?.role === 'admin'
}

// Creates the link, or rotates it. Rotating is how you revoke: every previously shared copy
// stops working the moment a new code replaces it.
export async function createInviteLink(req, res, next) {
  try {
    if (!(await requireGroupAdmin(req.params.id, req.user.id))) {
      return res.status(403).json({ error: 'Only admins can manage the invite link' })
    }
    const updated = await setInviteCode(req.params.id, newInviteCode())
    if (!updated) return res.status(404).json({ error: 'Group not found' })
    res.json({ inviteCode: updated.invite_code })
  } catch (err) {
    next(err)
  }
}

export async function revokeInviteLink(req, res, next) {
  try {
    if (!(await requireGroupAdmin(req.params.id, req.user.id))) {
      return res.status(403).json({ error: 'Only admins can manage the invite link' })
    }
    await setInviteCode(req.params.id, null)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// Preview for the join page — deliberately minimal, since the caller is not a member yet.
// Reachable signed-out (see the route's optionalAuthMiddleware), so req.user may not exist —
// "already a member" is meaningless for a visitor with no account yet, so it's just false.
export async function getInvitePreview(req, res, next) {
  try {
    const group = await getGroupByInviteCode(req.params.code)
    if (!group) return res.status(404).json({ error: 'This invite link is no longer valid' })
    res.json({
      group: {
        id: group.id,
        name: group.name,
        avatarUrl: group.avatar_url,
        memberCount: group.member_count,
        adminsOnlyMessaging: group.admins_only_messaging,
      },
      alreadyMember: req.user ? await isParticipant(group.id, req.user.id) : false,
    })
  } catch (err) {
    next(err)
  }
}

export async function joinByInvite(req, res, next) {
  try {
    const group = await getGroupByInviteCode(req.params.code)
    if (!group) return res.status(404).json({ error: 'This invite link is no longer valid' })

    const already = await isParticipant(group.id, req.user.id)
    if (!already) {
      await addParticipant(group.id, req.user.id)
      const participants = await getParticipants(group.id)
      const io = getIo()
      if (io) {
        io.to(`user:${req.user.id}`).emit('reload-conversations')
        participants.forEach((p) =>
          io.to(`user:${p.id}`).emit('group-members-updated', { conversationId: group.id, participants })
        )
      }
    }
    res.json({ conversationId: group.id, alreadyMember: already })
  } catch (err) {
    next(err)
  }
}

// ── Delete ───────────────────────────────────────────────────────────────────

// Admin-only, and irreversible: the group and its whole message history go, for everyone.
// Distinct from "Exit Group", which only removes the caller.
export async function deleteGroup(req, res, next) {
  try {
    const conversationId = req.params.id
    if (!(await requireGroupAdmin(conversationId, req.user.id))) {
      return res.status(403).json({ error: 'Only admins can delete this group' })
    }
    const participants = await getParticipants(conversationId)
    await deleteConversation(conversationId)

    const io = getIo()
    if (io) {
      // Tell everyone before their client next asks for a conversation that no longer exists.
      participants.forEach((p) => {
        io.to(`user:${p.id}`).emit('group-deleted', { conversationId })
        io.to(`user:${p.id}`).emit('reload-conversations')
      })
    }
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
