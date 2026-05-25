import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import axios from 'axios'
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
    const { display_name, bio, gender, phone, website, location, country, primary_role, date_of_birth } = req.body
    const result = await query(
      `UPDATE users SET
         display_name = COALESCE($1, display_name),
         bio = COALESCE($2, bio),
         gender = COALESCE($3, gender),
         phone = COALESCE($4, phone),
         website = COALESCE($5, website),
         location = COALESCE($6, location),
         country = COALESCE($7, country),
         primary_role = COALESCE($8, primary_role),
         date_of_birth = COALESCE($9::date, date_of_birth),
         updated_at = NOW()
       WHERE id = $10
       RETURNING id, full_name, username, country, location, email, primary_role, phone,
                 avatar_url, display_name, bio, gender, website, date_of_birth,
                 subscription_status, kyc_status, is_active`,
      [
        display_name !== undefined ? (display_name || null) : null,
        bio || null,
        gender || null,
        phone || null,
        website || null,
        location || null,
        country || null,
        primary_role || null,
        date_of_birth || null,
        req.user.id,
      ]
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

export async function deactivateAccount(req, res, next) {
  try {
    await query(`UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1`, [req.user.id])
    res.json({ success: true })
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

export async function changePassword(req, res, next) {
  try {
    const { old_password, new_password } = req.body
    if (!old_password || !new_password) {
      return res.status(400).json({ error: 'Old and new password are required' })
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' })
    }
    const result = await query(`SELECT password_hash FROM users WHERE id = $1`, [req.user.id])
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })
    const valid = await bcrypt.compare(old_password, result.rows[0].password_hash)
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' })
    const newHash = await bcrypt.hash(new_password, 12)
    await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [newHash, req.user.id])
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function deleteMyAccount(req, res, next) {
  try {
    await query(`DELETE FROM users WHERE id = $1`, [req.user.id])
    res.clearCookie('refreshToken')
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function clearAllChats(req, res, next) {
  try {
    await query(
      `UPDATE conversation_participants SET messages_cleared_at = NOW() WHERE user_id = $1`,
      [req.user.id]
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function deleteAllChats(req, res, next) {
  try {
    // Mark all messages as cleared (past) and soft-delete all sent messages for this user
    await query(
      `UPDATE conversation_participants SET messages_cleared_at = NOW() WHERE user_id = $1`,
      [req.user.id]
    )
    await query(
      `UPDATE messages SET is_deleted = true, content = NULL, updated_at = NOW()
       WHERE sender_id = $1 AND is_deleted = false`,
      [req.user.id]
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function initWebsiteVerification(req, res, next) {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: 'Website URL is required' })
    const token = crypto.randomBytes(20).toString('hex')
    await query(
      `UPDATE users SET website = $1, website_verify_token = $2, website_verified = false, updated_at = NOW() WHERE id = $3`,
      [url, token, req.user.id]
    )
    res.json({ token, metaTag: `<meta name="site-verification" content="${token}">` })
  } catch (err) {
    next(err)
  }
}

export async function confirmWebsiteVerification(req, res, next) {
  try {
    const result = await query(
      `SELECT website, website_verify_token FROM users WHERE id = $1`,
      [req.user.id]
    )
    const user = result.rows[0]
    if (!user?.website || !user?.website_verify_token) {
      return res.status(400).json({ error: 'No pending verification' })
    }
    let html = ''
    try {
      const resp = await axios.get(user.website, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0 SiteVerifier/1.0' } })
      html = resp.data || ''
    } catch {
      return res.status(400).json({ error: 'Could not reach your website. Make sure it is publicly accessible.' })
    }
    if (!html.includes(user.website_verify_token)) {
      return res.status(400).json({ error: 'Verification tag not found. Make sure you added the meta tag to your page <head>.' })
    }
    await query(
      `UPDATE users SET website_verified = true, updated_at = NOW() WHERE id = $1`,
      [req.user.id]
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
