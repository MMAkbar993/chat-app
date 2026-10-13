import bcrypt from 'bcryptjs'
import { query } from '../config/database.js'
import { findUserById, markTourSeen } from '../db/queries/users.js'
import { getSocialConnections, getPublicSocialConnections } from '../db/queries/auth_extras.js'
import { sendPasswordChangedEmail, sendEmailChangedEmail } from '../config/email.js'
import { isAllowedDisplayName } from '../utils/names.js'
import { getProfileBusiness } from '../db/queries/businesses.js'

// The signed-in member's own account: profile, privacy, avatar, email, password, and the
// account-wide chat actions. Websites and representatives live in website.controller.js.

// Catches http(s)://, www., and bare domain-looking text (e.g. "affiliateroulette.com") so people
// can't route around website-in-bio blocking just by dropping the protocol/www prefix.
const URL_PATTERN = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|net|org|io|co|info|biz|xyz|online|site|app|dev|me|ai|gg|tv|casino|bet|game|shop|club|link)\b/i

function containsUrl(text) {
  return Boolean(text) && URL_PATTERN.test(text)
}


export async function markTourSeenHandler(req, res, next) {
  try {
    await markTourSeen(req.user.id)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function getProfile(req, res, next) {
  try {
    const user = await findUserById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const ext = await query(
      `SELECT avatar_url, display_name, bio, gender, website, location, status FROM users WHERE id = $1`,
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
        business: await getProfileBusiness(req.user.id),
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { display_name, bio, gender, phone, website, location, country, primary_role, primary_role_other, date_of_birth, job_title, company_name, status } = req.body

    // Same rule as bio and job title: a free-text field on a profile is not a way around
    // website verification.
    // The name others see must come from the ID: display_name can only be one of the renderings
    // of full_name the Settings dropdown offers. Checked here, not only in the dropdown.
    if (display_name !== undefined && display_name !== null && display_name !== '') {
      const current = await findUserById(req.user.id)
      if (!isAllowedDisplayName(current?.full_name, display_name)) {
        return res.status(400).json({ error: 'Your display name must be taken from your verified name.' })
      }
    }

    if (containsUrl(bio) || containsUrl(job_title) || containsUrl(status)) {
      return res.status(400).json({
        error: 'You cannot include website URLs in your description. All websites must be verified under Settings → Website Verification before they can be added to your profile.',
      })
    }

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
         primary_role_other = CASE WHEN $8::text IS NOT NULL THEN $13 ELSE primary_role_other END,
         date_of_birth = COALESCE($9::date, date_of_birth),
         job_title = COALESCE($10, job_title),
         status = CASE WHEN $14::text IS NULL THEN status ELSE NULLIF(left($14, 100), '') END,
         company_name = CASE
           WHEN NOT website_verified AND NOT website_representation_approved
           THEN COALESCE($11, company_name)
           ELSE company_name
         END,
         updated_at = NOW()
       WHERE id = $12
       RETURNING id, full_name, username, country, location, email, primary_role, primary_role_other, phone,
                 avatar_url, display_name, bio, gender, website, date_of_birth,
                 job_title, company_name, status, website_verified, website_representation_approved,
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
        primary_role === 'other' ? (primary_role_other || null) : null,
        status !== undefined ? String(status).trim() : null,
      ]
    )
    res.json({ user: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

// Kept off PATCH /me: that query COALESCEs every field so an omitted one keeps its old value,
// which makes setting a boolean back to false impossible to express. These take the value as
// given, and only a real boolean counts — anything else leaves the setting alone.
// The browser reports its own IANA zone; we store it so other people can be shown this user's
// actual local time. Validated against the runtime's own zone list so a junk value can't be
// written and then blow up Intl.DateTimeFormat for whoever views the profile.
export async function updateTimezone(req, res, next) {
  try {
    const { timezone } = req.body
    if (typeof timezone !== 'string' || !timezone) {
      return res.status(400).json({ error: 'timezone required' })
    }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone })
    } catch {
      return res.status(400).json({ error: 'Unknown timezone' })
    }
    await query(`UPDATE users SET timezone = $1, updated_at = NOW() WHERE id = $2`, [timezone, req.user.id])
    res.json({ timezone })
  } catch (err) {
    next(err)
  }
}

export async function getPrivacy(req, res, next) {
  try {
    const result = await query(
      `SELECT hide_from_search, restrict_group_add FROM users WHERE id = $1`,
      [req.user.id]
    )
    res.json({ privacy: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

export async function updatePrivacy(req, res, next) {
  try {
    const { hide_from_search, restrict_group_add } = req.body
    const result = await query(
      `UPDATE users SET
         hide_from_search   = COALESCE($1::boolean, hide_from_search),
         restrict_group_add = COALESCE($2::boolean, restrict_group_add),
         updated_at = NOW()
       WHERE id = $3
       RETURNING hide_from_search, restrict_group_add`,
      [
        typeof hide_from_search === 'boolean' ? hide_from_search : null,
        typeof restrict_group_add === 'boolean' ? restrict_group_add : null,
        req.user.id,
      ]
    )
    res.json({ privacy: result.rows[0] })
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
      `SELECT u.id, u.full_name, u.username, u.primary_role, u.primary_role_other, u.avatar_url, u.display_name, u.bio, u.status,
              u.country, u.location, u.website, u.created_at, u.date_of_birth,
              u.job_title, u.company_name, u.website_verified, u.website_representation_approved, u.timezone,
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
      socialMap[`${s.platform}_url`] = s.profile_url
        || (s.social_username && s.platform !== 'youtube' ? `https://${s.platform}.com/${s.social_username}` : null)
    })

    const business = await getProfileBusiness(user.id)
    res.json({ user: { ...user, ...socialMap, verified_websites: websitesResult.rows, rep_websites: repWebsitesResult.rows, business } })
  } catch (err) {
    next(err)
  }
}

export async function getPublicProfile(req, res, next) {
  try {
    const result = await query(
      `SELECT id, full_name, username, primary_role, primary_role_other, avatar_url, display_name, bio, status,
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
        primary_role_other: user.primary_role_other,
        avatar_url: user.avatar_url,
        bio: user.bio,
        status: user.status,
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
    sendEmailChangedEmail(req.user.email, new_email).catch(() => {})
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
    sendPasswordChangedEmail(req.user.email).catch(() => {})
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
