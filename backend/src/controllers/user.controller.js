import { query } from '../config/database.js'
import { findUserById } from '../db/queries/users.js'
import {
  getSocialConnections,
  getPublicSocialConnections,
} from '../db/queries/auth_extras.js'

export async function getProfile(req, res, next) {
  try {
    const user = await findUserById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const ext = await query(
      `SELECT avatar_url, display_name, bio, gender, website, location FROM users WHERE id = $1`,
      [req.user.id]
    )
    const extra = ext.rows[0] || {}
    res.json({ user: { ...user, ...extra } })
  } catch (err) {
    next(err)
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { display_name, bio, gender, phone, website, location } = req.body
    const result = await query(
      `UPDATE users SET
         display_name = COALESCE($1, display_name),
         bio = COALESCE($2, bio),
         gender = COALESCE($3, gender),
         phone = COALESCE($4, phone),
         website = COALESCE($5, website),
         location = COALESCE($6, location),
         updated_at = NOW()
       WHERE id = $7
       RETURNING id, full_name, username, country, location, email, primary_role, phone,
                 avatar_url, display_name, bio, gender, website, subscription_status, kyc_status, is_active`,
      [display_name || null, bio || null, gender || null, phone || null, website || null, location || null, req.user.id]
    )
    res.json({ user: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const avatarUrl = `/uploads/${req.file.filename}`
    await query(`UPDATE users SET avatar_url = $1 WHERE id = $2`, [avatarUrl, req.user.id])
    res.json({ avatarUrl })
  } catch (err) {
    next(err)
  }
}

export async function getUserById(req, res, next) {
  try {
    const result = await query(
      `SELECT id, full_name, username, primary_role, avatar_url, display_name, bio,
              country, location, website, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })
    res.json({ user: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

export async function getPublicProfile(req, res, next) {
  try {
    const result = await query(
      `SELECT id, full_name, username, primary_role, avatar_url, display_name, bio,
              country, kyc_status, created_at
       FROM users WHERE username = $1`,
      [req.params.username]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })

    const user = result.rows[0]
    const socialConnections = await getPublicSocialConnections(user.id)

    res.json({
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        display_name: user.display_name,
        primary_role: user.primary_role,
        avatar_url: user.avatar_url,
        bio: user.bio,
        country: user.country,
        is_verified: user.kyc_status === 'verified',
        joined: user.created_at,
        social_connections: socialConnections,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getBlockedUsers(req, res, next) {
  try {
    const result = await query(
      `SELECT blocked_id::text AS id FROM blocked_users WHERE blocker_id = $1`,
      [req.user.id]
    )
    res.json({ blockedIds: result.rows.map((r) => r.id) })
  } catch (err) {
    next(err)
  }
}

export async function getMySocialConnections(req, res, next) {
  try {
    const connections = await getSocialConnections(req.user.id)
    res.json({ connections })
  } catch (err) {
    next(err)
  }
}
