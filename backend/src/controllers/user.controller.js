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
    const { display_name, bio, gender, phone, website, location, country, primary_role, date_of_birth, job_title, company_name } = req.body
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
         job_title = COALESCE($10, job_title),
         company_name = COALESCE($11, company_name),
         updated_at = NOW()
       WHERE id = $12
       RETURNING id, full_name, username, country, location, email, primary_role, phone,
                 avatar_url, display_name, bio, gender, website, date_of_birth,
                 job_title, company_name, website_verified, website_representation_approved,
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
        job_title !== undefined ? (job_title || null) : null,
        company_name !== undefined ? (company_name || null) : null,
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
      `SELECT u.id, u.full_name, u.username, u.primary_role, u.avatar_url, u.display_name, u.bio,
              u.country, u.location, u.website, u.created_at, u.date_of_birth,
              u.job_title, u.company_name, u.website_verified, u.website_representation_approved,
              u.kyc_status,
              EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = $2 AND blocked_id = u.id) AS is_blocked_by_me
       FROM users u WHERE u.id = $1`,
      [req.params.id, req.user.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })

    const user = result.rows[0]
    const socialResult = await query(
      `SELECT platform, profile_url, username AS social_username
       FROM social_connections WHERE user_id = $1`,
      [user.id]
    )
    const socialMap = {}
    socialResult.rows.forEach((s) => {
      socialMap[`${s.platform}_url`] = s.profile_url || (s.social_username ? `https://${s.platform}.com/${s.social_username}` : null)
    })

    res.json({ user: { ...user, ...socialMap } })
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
      `SELECT u.id, u.full_name, u.username, u.display_name, u.avatar_url
       FROM blocked_users b
       JOIN users u ON u.id = b.blocked_id
       WHERE b.blocker_id = $1
       ORDER BY u.full_name`,
      [req.user.id]
    )
    res.json({ blockedUsers: result.rows })
  } catch (err) {
    next(err)
  }
}

export async function changeEmail(req, res, next) {
  try {
    const { new_email, password } = req.body
    if (!new_email || !password) return res.status(400).json({ error: 'New email and current password are required' })
    if (!new_email.includes('@')) return res.status(400).json({ error: 'Invalid email address' })

    const existing = await query(`SELECT 1 FROM users WHERE email = $1 AND id != $2`, [new_email, req.user.id])
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email is already in use' })

    const result = await query(`SELECT password_hash FROM users WHERE id = $1`, [req.user.id])
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })
    const valid = await bcrypt.compare(password, result.rows[0].password_hash)
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' })

    await query(`UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2`, [new_email, req.user.id])
    res.json({ success: true })
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

    // Normalise to bare URL for comparison
    let normalised = url.trim().replace(/\/+$/, '')

    // Check if another user already verified this website
    const claimed = await query(
      `SELECT id, display_name, full_name FROM users
       WHERE website_verified = true AND LOWER(TRIM(TRAILING '/' FROM website)) = LOWER($1) AND id != $2`,
      [normalised, req.user.id]
    )
    if (claimed.rows[0]) {
      const owner = claimed.rows[0]
      return res.status(409).json({
        error: 'already_claimed',
        ownerName: owner.display_name || owner.full_name || 'another user',
        ownerId: owner.id,
        websiteUrl: normalised,
      })
    }

    const token = crypto.randomBytes(20).toString('hex')
    await query(
      `UPDATE users SET website = $1, website_verify_token = $2, website_verified = false, updated_at = NOW() WHERE id = $3`,
      [normalised, token, req.user.id]
    )
    res.json({ token, metaTag: `<meta name="site-verification" content="${token}">` })
  } catch (err) {
    next(err)
  }
}

export async function removeWebsiteVerification(req, res, next) {
  try {
    await query(
      `UPDATE users SET website = NULL, website_verify_token = NULL, website_verified = false,
       website_representation_approved = false, updated_at = NOW() WHERE id = $1`,
      [req.user.id]
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function requestRepresentation(req, res, next) {
  try {
    const { url, ownerId } = req.body
    if (!url || !ownerId) return res.status(400).json({ error: 'url and ownerId are required' })

    // Verify the owner still has this verified
    const owner = await query(
      `SELECT id FROM users WHERE id = $1 AND website_verified = true`,
      [ownerId]
    )
    if (!owner.rows[0]) return res.status(404).json({ error: 'Owner not found or website no longer verified' })

    await query(
      `INSERT INTO website_representation_requests (website_url, requester_id, owner_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (website_url, requester_id) DO UPDATE SET status = 'pending', created_at = NOW()`,
      [url, req.user.id, ownerId]
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function getRepresentationRequests(req, res, next) {
  try {
    // Requests where current user is the owner
    const result = await query(
      `SELECT r.id, r.website_url, r.status, r.created_at,
              u.id AS requester_id, u.display_name, u.full_name, u.avatar_url, u.username
       FROM website_representation_requests r
       JOIN users u ON u.id = r.requester_id
       WHERE r.owner_id = $1 AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [req.user.id]
    )
    res.json({ requests: result.rows })
  } catch (err) {
    next(err)
  }
}

export async function handleRepresentationRequest(req, res, next) {
  try {
    const { id } = req.params
    const { action } = req.body // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action' })

    const reqResult = await query(
      `SELECT * FROM website_representation_requests WHERE id = $1 AND owner_id = $2`,
      [id, req.user.id]
    )
    if (!reqResult.rows[0]) return res.status(404).json({ error: 'Request not found' })

    const repReq = reqResult.rows[0]
    const status = action === 'approve' ? 'approved' : 'rejected'

    await query(
      `UPDATE website_representation_requests SET status = $1 WHERE id = $2`,
      [status, id]
    )

    if (action === 'approve') {
      // Grant the requester representation status; copy company info from owner
      const ownerResult = await query(
        `SELECT company_name FROM users WHERE id = $1`,
        [req.user.id]
      )
      const ownerCompany = ownerResult.rows[0]?.company_name || null
      await query(
        `UPDATE users SET website_representation_approved = true,
         company_name = COALESCE(company_name, $1), updated_at = NOW()
         WHERE id = $2`,
        [ownerCompany, repReq.requester_id]
      )
    }

    res.json({ success: true })
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
