import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { findUserByEmail } from '../db/queries/users.js'
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
