import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { findUserByEmail } from '../db/queries/users.js'
import { getIo } from '../socket/index.js'
import {
  findAdminById,
  getDashboardStats,
  getRecentUsers,
  getRecentGroups,
  getAllUsers,
  createManagedUser,
  updateManagedUser,
  deleteManagedUser,
  blockManagedUser,
  unblockManagedUser,
  getAllGroups,
  getAllConversations,
  getAllCalls,
  updateAdminProfile,
  countAdmins,
  createAdminUser,
  getUserDetail,
  setUserPackage,
  getAllReports,
  getBillingOverview,
  getAllVerifiedWebsites,
  getAllRepresentationRequests,
  adminSetRepresentative,
  getBroadcastAudienceIds,
  insertBroadcastNotifications,
  getBroadcastHistory,
} from '../db/queries/admin.js'

// ── Auth ──────────────────────────────────────────────────────────────────────

// Bootstrap-only: creates the very first admin account. Once any admin exists, this route
// permanently refuses — otherwise it would be an unauthenticated "become admin" endpoint sitting
// on a live server. Further admins have to be created by an existing admin, not self-service.
export async function adminSignup(req, res, next) {
  try {
    const { full_name, email, password } = req.body
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const existingAdmins = await countAdmins()
    if (existingAdmins > 0) {
      return res.status(403).json({ error: 'An admin account already exists. Ask an existing admin to create your account.' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await findUserByEmail(normalizedEmail)
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const password_hash = await bcrypt.hash(password, 12)
    const admin = await createAdminUser({ full_name: full_name.trim(), email: normalizedEmail, password_hash })

    const token = jwt.sign(
      { id: admin.id, email: admin.email, isAdmin: true },
      config.jwtSecret,
      { expiresIn: '7d' }
    )
    res.status(201).json({
      token,
      admin: { id: admin.id, full_name: admin.full_name, email: admin.email, avatar_url: admin.avatar_url },
    })
  } catch (err) {
    next(err)
  }
}

export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const user = await findUserByEmail(email.trim().toLowerCase())
    if (!user || !user.is_admin) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: true },
      config.jwtSecret,
      { expiresIn: '7d' }
    )
    res.json({
      token,
      admin: { id: user.id, full_name: user.full_name, email: user.email, avatar_url: user.avatar_url },
    })
  } catch (err) {
    next(err)
  }
}

export async function adminMe(req, res, next) {
  try {
    const admin = await findAdminById(req.admin.id)
    res.json({ admin })
  } catch (err) {
    next(err)
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function dashboard(req, res, next) {
  try {
    const [stats, recentUsers, recentGroups] = await Promise.all([
      getDashboardStats(),
      getRecentUsers(5),
      getRecentGroups(5),
    ])
    res.json({ stats, recentUsers, recentGroups })
  } catch (err) {
    next(err)
  }
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function listUsers(req, res, next) {
  try {
    const { search = '', page = 1, limit = 20 } = req.query
    const result = await getAllUsers({ search, page: parseInt(page), limit: parseInt(limit) })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function createUser(req, res, next) {
  try {
    const { full_name, email, phone, country, password } = req.body
    if (!full_name || !email || !country) {
      return res.status(400).json({ error: 'full_name, email and country are required' })
    }
    const rawPassword = password || 'Welcome@123'
    const password_hash = await bcrypt.hash(rawPassword, 12)
    const user = await createManagedUser({ full_name, email, phone, country, password_hash })
    res.status(201).json({ user })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' })
    next(err)
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params
    const { full_name, email, phone, country } = req.body
    if (!full_name || !email || !country) {
      return res.status(400).json({ error: 'full_name, email and country are required' })
    }
    const user = await updateManagedUser(id, { full_name, email, phone, country })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ user })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' })
    next(err)
  }
}

export async function deleteUser(req, res, next) {
  try {
    await deleteManagedUser(req.params.id)
    res.json({ message: 'User deleted' })
  } catch (err) {
    next(err)
  }
}

export async function blockUser(req, res, next) {
  try {
    await blockManagedUser(req.params.id)
    res.json({ message: 'User blocked' })
  } catch (err) {
    next(err)
  }
}

export async function unblockUser(req, res, next) {
  try {
    await unblockManagedUser(req.params.id)
    res.json({ message: 'User unblocked' })
  } catch (err) {
    next(err)
  }
}

export async function getUserDetailHandler(req, res, next) {
  try {
    const user = await getUserDetail(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ user })
  } catch (err) {
    next(err)
  }
}

export async function changeUserPackage(req, res, next) {
  try {
    const { plan } = req.body
    if (!['free', 'pro'].includes(plan)) return res.status(400).json({ error: 'plan must be "free" or "pro"' })
    const updated = await setUserPackage(req.params.id, plan)
    if (!updated) return res.status(404).json({ error: 'User not found' })
    res.json({ user: updated })
  } catch (err) {
    next(err)
  }
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function listReports(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query
    const result = await getAllReports({ page: parseInt(page), limit: parseInt(limit) })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

// ── Billing ───────────────────────────────────────────────────────────────────

export async function billingOverview(req, res, next) {
  try {
    const overview = await getBillingOverview()
    res.json(overview)
  } catch (err) {
    next(err)
  }
}

// ── Website verification ─────────────────────────────────────────────────────

export async function listVerifiedWebsites(req, res, next) {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query
    const result = await getAllVerifiedWebsites({ status, page: parseInt(page), limit: parseInt(limit) })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function listRepresentationRequests(req, res, next) {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query
    const result = await getAllRepresentationRequests({ status, page: parseInt(page), limit: parseInt(limit) })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function representationAction(req, res, next) {
  try {
    const { action } = req.body
    if (!['approve', 'reject', 'revoke'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approve", "reject" or "revoke"' })
    }
    const updated = await adminSetRepresentative(req.params.id, action)
    if (!updated) return res.status(404).json({ error: 'Request not found' })
    res.json({ request: updated })
  } catch (err) {
    next(err)
  }
}

// ── Broadcasts ────────────────────────────────────────────────────────────────

export async function createBroadcast(req, res, next) {
  try {
    const { audience, title, body } = req.body
    if (!['all', 'pro', 'free'].includes(audience)) {
      return res.status(400).json({ error: 'audience must be "all", "pro" or "free"' })
    }
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'Title and body are required' })
    }

    const userIds = await getBroadcastAudienceIds(audience)
    const data = { broadcastId: crypto.randomUUID(), title: title.trim(), body: body.trim(), audience }
    const inserted = await insertBroadcastNotifications(userIds, data)

    const io = getIo()
    if (io) {
      inserted.forEach((row) => {
        io.to(`user:${row.user_id}`).emit('notification', { id: row.id, type: 'broadcast', data })
      })
    }

    res.status(201).json({ recipientCount: userIds.length })
  } catch (err) {
    next(err)
  }
}

export async function listBroadcasts(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query
    const broadcasts = await getBroadcastHistory({ page: parseInt(page), limit: parseInt(limit) })
    res.json({ broadcasts })
  } catch (err) {
    next(err)
  }
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function listGroups(req, res, next) {
  try {
    const { search = '', page = 1, limit = 20 } = req.query
    const result = await getAllGroups({ search, page: parseInt(page), limit: parseInt(limit) })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

// ── Conversations ─────────────────────────────────────────────────────────────

export async function listConversations(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query
    const result = await getAllConversations({ page: parseInt(page), limit: parseInt(limit) })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

// ── Calls ─────────────────────────────────────────────────────────────────────

export async function listCalls(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query
    const result = await getAllCalls({ page: parseInt(page), limit: parseInt(limit) })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function updateProfile(req, res, next) {
  try {
    const { full_name, avatar_url } = req.body
    if (!full_name) return res.status(400).json({ error: 'full_name is required' })
    const admin = await updateAdminProfile(req.admin.id, { full_name, avatar_url })
    res.json({ admin })
  } catch (err) {
    next(err)
  }
}

export async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'current_password and new_password required' })
    }
    const user = await findUserByEmail(req.admin.email)
    const valid = await bcrypt.compare(current_password, user.password_hash)
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' })
    const hash = await bcrypt.hash(new_password, 12)
    const { query } = await import('../config/database.js')
    await query(`UPDATE users SET password_hash=$1 WHERE id=$2`, [hash, req.admin.id])
    res.json({ message: 'Password changed' })
  } catch (err) {
    next(err)
  }
}
