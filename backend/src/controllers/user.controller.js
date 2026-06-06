import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import axios from 'axios'
import { query } from '../config/database.js'
import { findUserById } from '../db/queries/users.js'
import {
  getSocialConnections,
  getPublicSocialConnections,
} from '../db/queries/auth_extras.js'
import { getIo } from '../socket/index.js'

async function createNotification(userId, type, data = {}) {
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, type, data) VALUES ($1, $2, $3) RETURNING id`,
      [userId, type, JSON.stringify(data)]
    )
    const io = getIo()
    if (io) {
      io.to(`user:${userId}`).emit('notification', { id: result.rows[0].id, type, data })
    }
  } catch {}
}

export async function getProfile(req, res, next) {
  try {
    const user = await findUserById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const ext = await query(
      `SELECT avatar_url, display_name, bio, gender, website, location FROM users WHERE id = $1`,
      [req.user.id]
    )
    const extra = ext.rows[0] || {}
    const [websitesResult, repWebsitesResult] = await Promise.all([
      query(`SELECT id, url FROM verified_websites WHERE user_id = $1 AND verified = true ORDER BY created_at`, [req.user.id]),
      query(`SELECT website_url AS url FROM website_representation_requests WHERE requester_id = $1 AND status = 'approved'`, [req.user.id]),
    ])
    res.json({
      user: {
        ...user,
        ...extra,
        verified_websites: websitesResult.rows,
        rep_websites: repWebsitesResult.rows,
      },
    })
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
         company_name = CASE
           WHEN NOT website_verified AND NOT website_representation_approved
           THEN COALESCE($11, company_name)
           ELSE company_name
         END,
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
    const [socialResult, websitesResult, repWebsitesResult] = await Promise.all([
      query(`SELECT platform, profile_url, username AS social_username FROM social_connections WHERE user_id = $1`, [user.id]),
      query(`SELECT id, url FROM verified_websites WHERE user_id = $1 AND verified = true ORDER BY created_at`, [user.id]),
      query(`SELECT website_url AS url FROM website_representation_requests WHERE requester_id = $1 AND status = 'approved'`, [user.id]),
    ])
    const socialMap = {}
    socialResult.rows.forEach((s) => {
      socialMap[`${s.platform}_url`] = s.profile_url || (s.social_username ? `https://${s.platform}.com/${s.social_username}` : null)
    })

    res.json({ user: { ...user, ...socialMap, verified_websites: websitesResult.rows, rep_websites: repWebsitesResult.rows } })
  } catch (err) {
    next(err)
  }
}

export async function getPublicProfile(req, res, next) {
  try {
    const result = await query(
      `SELECT id, full_name, username, primary_role, avatar_url, display_name, bio,
              country, kyc_status, created_at, website_verified, website_representation_approved
       FROM users WHERE username = $1`,
      [req.params.username]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })

    const user = result.rows[0]
    const [socialConnections, websitesResult, repWebsitesResult] = await Promise.all([
      getPublicSocialConnections(user.id),
      query(`SELECT id, url FROM verified_websites WHERE user_id = $1 AND verified = true ORDER BY created_at`, [user.id]),
      query(`SELECT website_url AS url FROM website_representation_requests WHERE requester_id = $1 AND status = 'approved'`, [user.id]),
    ])

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
        website_verified: user.website_verified,
        website_representation_approved: user.website_representation_approved,
        joined: user.created_at,
        social_connections: socialConnections,
        verified_websites: websitesResult.rows,
        rep_websites: repWebsitesResult.rows,
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
      `UPDATE messages SET is_deleted = true, content = NULL
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

    const normalised = url.trim().replace(/\/+$/, '')

    // Check if another user already verified this website
    const claimed = await query(
      `SELECT u.id, u.display_name, u.full_name
       FROM verified_websites vw
       JOIN users u ON u.id = vw.user_id
       WHERE vw.verified = true AND LOWER(vw.url) = LOWER($1) AND vw.user_id != $2`,
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
    const inserted = await query(
      `INSERT INTO verified_websites (user_id, url, verify_token, verified, updated_at)
       VALUES ($1, $2, $3, false, NOW())
       ON CONFLICT (user_id, url) DO UPDATE
         SET verify_token = EXCLUDED.verify_token, verified = false, updated_at = NOW()
       RETURNING id`,
      [req.user.id, normalised, token]
    )
    res.json({ token, metaTag: `<meta name="site-verification" content="${token}">`, websiteId: inserted.rows[0].id })
  } catch (err) {
    next(err)
  }
}

export async function getWebsiteRepresentatives(req, res, next) {
  try {
    const { id } = req.params
    const site = await query(
      `SELECT url FROM verified_websites WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    )
    if (!site.rows[0]) return res.status(404).json({ error: 'Website not found' })
    const { url } = site.rows[0]
    const result = await query(
      `SELECT u.id AS user_id, u.display_name, u.full_name, u.avatar_url, u.username
       FROM website_representation_requests r
       JOIN users u ON u.id = r.requester_id
       WHERE r.owner_id = $1 AND LOWER(r.website_url) = LOWER($2) AND r.status = 'approved'`,
      [req.user.id, url]
    )
    res.json({ representatives: result.rows, url })
  } catch (err) {
    next(err)
  }
}

export async function transferWebsiteOwnership(req, res, next) {
  try {
    const { id } = req.params
    const { newOwnerId } = req.body
    if (!newOwnerId) return res.status(400).json({ error: 'newOwnerId is required' })

    const site = await query(
      `SELECT url FROM verified_websites WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    )
    if (!site.rows[0]) return res.status(404).json({ error: 'Website not found' })
    const { url } = site.rows[0]

    // Verify the new owner is an approved rep for this site
    const repCheck = await query(
      `SELECT id FROM website_representation_requests
       WHERE owner_id = $1 AND requester_id = $2 AND LOWER(website_url) = LOWER($3) AND status = 'approved'`,
      [req.user.id, newOwnerId, url]
    )
    if (!repCheck.rows[0]) return res.status(400).json({ error: 'Selected user is not an approved representative of this site' })

    let domainName = null
    try {
      const raw = url.startsWith('http') ? url : `https://${url}`
      domainName = new URL(raw).hostname.replace(/^www\./, '')
    } catch {}

    // Give new owner a verified_websites entry
    await query(
      `INSERT INTO verified_websites (user_id, url, verified, updated_at)
       VALUES ($1, $2, true, NOW())
       ON CONFLICT (user_id, url) DO UPDATE SET verified = true, updated_at = NOW()`,
      [newOwnerId, url]
    )
    // Mark new owner as website verified; clear their rep status since they're now the owner
    await query(
      `UPDATE users SET website_verified = true, website_representation_approved = false,
       company_name = COALESCE(company_name, $1), updated_at = NOW() WHERE id = $2`,
      [domainName, newOwnerId]
    )
    // Transfer all representation requests for this site to new owner
    await query(
      `UPDATE website_representation_requests SET owner_id = $1
       WHERE owner_id = $2 AND LOWER(website_url) = LOWER($3)`,
      [newOwnerId, req.user.id, url]
    )
    // Remove the self-referential row where new owner is both owner and requester
    await query(
      `DELETE FROM website_representation_requests
       WHERE owner_id = $1 AND requester_id = $1 AND LOWER(website_url) = LOWER($2)`,
      [newOwnerId, url]
    )
    // Remove current owner's verified_websites entry
    await query(`DELETE FROM verified_websites WHERE id = $1`, [id])
    // Clear current owner's flags if no more verified sites
    const remaining = await query(
      `SELECT id FROM verified_websites WHERE user_id = $1 AND verified = true LIMIT 1`,
      [req.user.id]
    )
    if (remaining.rows.length === 0) {
      await query(
        `UPDATE users SET website_verified = false, company_name = NULL, updated_at = NOW() WHERE id = $1`,
        [req.user.id]
      )
    }
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function removeWebsiteVerification(req, res, next) {
  try {
    const { id } = req.params
    const site = await query(
      `SELECT url FROM verified_websites WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    )
    if (!site.rows[0]) return res.status(404).json({ error: 'Website not found' })
    const { url } = site.rows[0]

    // Revoke all approved reps for this site
    const reps = await query(
      `SELECT requester_id FROM website_representation_requests
       WHERE owner_id = $1 AND LOWER(website_url) = LOWER($2) AND status = 'approved'`,
      [req.user.id, url]
    )
    if (reps.rows.length > 0) {
      await query(
        `UPDATE website_representation_requests SET status = 'revoked'
         WHERE owner_id = $1 AND LOWER(website_url) = LOWER($2) AND status = 'approved'`,
        [req.user.id, url]
      )
      for (const { requester_id } of reps.rows) {
        const otherApprovals = await query(
          `SELECT id FROM website_representation_requests WHERE requester_id = $1 AND status = 'approved'`,
          [requester_id]
        )
        if (otherApprovals.rows.length === 0) {
          await query(
            `UPDATE users SET website_representation_approved = false, company_name = NULL, updated_at = NOW() WHERE id = $1`,
            [requester_id]
          )
        }
      }
    }

    await query(`DELETE FROM verified_websites WHERE id = $1`, [id])
    const remaining = await query(
      `SELECT id FROM verified_websites WHERE user_id = $1 AND verified = true LIMIT 1`,
      [req.user.id]
    )
    if (remaining.rows.length === 0) {
      await query(
        `UPDATE users SET website_verified = false, company_name = NULL, updated_at = NOW() WHERE id = $1`,
        [req.user.id]
      )
    }
    // Clear users.website if it still holds the deleted URL
    await query(
      `UPDATE users SET website = NULL, updated_at = NOW()
       WHERE id = $1 AND LOWER(TRIM(TRAILING '/' FROM COALESCE(website,''))) = LOWER($2)`,
      [req.user.id, url.replace(/\/+$/, '').toLowerCase()]
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function revokeRepresentation(req, res, next) {
  try {
    // Get owners before clearing so we can notify them
    const ownerships = await query(
      `SELECT owner_id FROM website_representation_requests WHERE requester_id = $1 AND status = 'approved'`,
      [req.user.id]
    )
    await query(
      `UPDATE users SET website_representation_approved = false, company_name = NULL, updated_at = NOW() WHERE id = $1`,
      [req.user.id]
    )
    await query(
      `UPDATE website_representation_requests SET status = 'revoked' WHERE requester_id = $1 AND status = 'approved'`,
      [req.user.id]
    )
    const io = getIo()
    if (io) {
      ownerships.rows.forEach(({ owner_id }) => {
        io.to(`user:${owner_id}`).emit('rep-revoked', { requesterId: req.user.id })
      })
    }
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function getMyVerifiedWebsites(req, res, next) {
  try {
    const result = await query(
      `SELECT id, url, verified, created_at FROM verified_websites WHERE user_id = $1 ORDER BY created_at`,
      [req.user.id]
    )
    res.json({ websites: result.rows })
  } catch (err) {
    next(err)
  }
}

export async function requestRepresentation(req, res, next) {
  try {
    const { url, ownerId } = req.body
    if (!url || !ownerId) return res.status(400).json({ error: 'url and ownerId are required' })

    // Verify the owner still has this website verified
    const owner = await query(
      `SELECT u.id FROM verified_websites vw JOIN users u ON u.id = vw.user_id
       WHERE vw.user_id = $1 AND LOWER(vw.url) = LOWER($2) AND vw.verified = true`,
      [ownerId, url.trim().replace(/\/+$/, '')]
    )
    if (!owner.rows[0]) return res.status(404).json({ error: 'Owner not found or website no longer verified' })

    await query(
      `INSERT INTO website_representation_requests (website_url, requester_id, owner_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (website_url, requester_id) DO UPDATE SET status = 'pending', created_at = NOW()`,
      [url, req.user.id, ownerId]
    )

    const requester = await findUserById(req.user.id)
    const requesterName = requester?.display_name || requester?.full_name || requester?.username || 'Someone'
    await createNotification(ownerId, 'rep_request', {
      requesterName,
      requesterId: req.user.id,
      websiteUrl: url,
    })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function getApprovedRepresentatives(req, res, next) {
  try {
    const result = await query(
      `SELECT r.id, r.website_url, r.created_at,
              u.id AS user_id, u.display_name, u.full_name, u.avatar_url, u.username
       FROM website_representation_requests r
       JOIN users u ON u.id = r.requester_id
       WHERE r.owner_id = $1 AND r.status = 'approved'
       ORDER BY r.created_at DESC`,
      [req.user.id]
    )
    res.json({ representatives: result.rows })
  } catch (err) {
    next(err)
  }
}

export async function revokeRepresentative(req, res, next) {
  try {
    const { userId } = req.params
    await query(
      `UPDATE website_representation_requests SET status = 'revoked'
       WHERE owner_id = $1 AND requester_id = $2`,
      [req.user.id, userId]
    )
    const otherApprovals = await query(
      `SELECT id FROM website_representation_requests WHERE requester_id = $1 AND status = 'approved'`,
      [userId]
    )
    if (otherApprovals.rows.length === 0) {
      await query(
        `UPDATE users SET website_representation_approved = false, company_name = NULL, updated_at = NOW() WHERE id = $1`,
        [userId]
      )
    }
    const io = getIo()
    if (io) {
      io.to(`user:${userId}`).emit('rep-request-update', { action: 'revoked' })
    }
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function getMyRepresentationStatus(req, res, next) {
  try {
    const result = await query(
      `SELECT r.id, r.website_url, r.status, r.created_at,
              u.display_name AS owner_display_name, u.full_name AS owner_full_name
       FROM website_representation_requests r
       JOIN users u ON u.id = r.owner_id
       WHERE r.requester_id = $1 AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [req.user.id]
    )
    res.json({ requests: result.rows })
  } catch (err) {
    next(err)
  }
}

export async function cancelRepresentationRequest(req, res, next) {
  try {
    const { id } = req.params
    const result = await query(
      `DELETE FROM website_representation_requests
       WHERE id = $1 AND requester_id = $2 AND status = 'pending'
       RETURNING id`,
      [id, req.user.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Request not found or already processed' })
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

    const owner = await findUserById(req.user.id)
    const ownerName = owner?.display_name || owner?.full_name || owner?.username || 'The website owner'

    if (action === 'approve') {
      // Grant the requester representation status; copy company info from owner
      await query(
        `UPDATE users SET website_representation_approved = true,
         company_name = COALESCE(company_name, $1), updated_at = NOW()
         WHERE id = $2`,
        [owner?.company_name || null, repReq.requester_id]
      )
    }

    await createNotification(repReq.requester_id, 'rep_decision', {
      action,
      ownerName,
      websiteUrl: repReq.website_url,
    })

    const io = getIo()
    if (io) {
      io.to(`user:${repReq.requester_id}`).emit('rep-request-update', { action, websiteUrl: repReq.website_url })
    }

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function confirmWebsiteVerification(req, res, next) {
  try {
    const { websiteId } = req.body
    if (!websiteId) return res.status(400).json({ error: 'websiteId is required' })

    const pending = await query(
      `SELECT id, url, verify_token FROM verified_websites WHERE id = $1 AND user_id = $2 AND verified = false`,
      [websiteId, req.user.id]
    )
    if (!pending.rows[0]) return res.status(400).json({ error: 'No pending verification found' })

    const { url, verify_token } = pending.rows[0]
    let html = ''
    try {
      const resp = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0 SiteVerifier/1.0' } })
      html = resp.data || ''
    } catch {
      return res.status(400).json({ error: 'Could not reach your website. Make sure it is publicly accessible.' })
    }
    if (!html.includes(verify_token)) {
      return res.status(400).json({ error: 'Verification tag not found. Make sure you added the meta tag to your page <head>.' })
    }

    await query(
      `UPDATE verified_websites SET verified = true, verify_token = NULL, updated_at = NOW() WHERE id = $1`,
      [websiteId]
    )

    let domainName = null
    try {
      const raw = url.startsWith('http') ? url : `https://${url}`
      domainName = new URL(raw).hostname.replace(/^www\./, '')
    } catch {}

    await query(
      `UPDATE users SET website_verified = true,
       company_name = COALESCE(company_name, $1),
       updated_at = NOW() WHERE id = $2`,
      [domainName, req.user.id]
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function getNotifications(req, res, next) {
  try {
    const result = await query(
      `SELECT id, type, data, read, created_at FROM notifications
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    )
    res.json({ notifications: result.rows })
  } catch (err) {
    next(err)
  }
}

export async function markNotificationsRead(req, res, next) {
  try {
    await query(
      `UPDATE notifications SET read = true WHERE user_id = $1`,
      [req.user.id]
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function clearNotifications(req, res, next) {
  try {
    await query(`DELETE FROM notifications WHERE user_id = $1`, [req.user.id])
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
