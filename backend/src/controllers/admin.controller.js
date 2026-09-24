import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import { config } from '../config/env.js'
import { findUserByEmail } from '../db/queries/users.js'
import { getTwoFactorFields } from '../db/queries/auth_extras.js'
import { getIo } from '../socket/index.js'
import { query } from '../config/database.js'
import { ensureBusinessForDomain, normaliseDomain, transferBusinessByDomain } from '../db/queries/businesses.js'
import { listAds, createAd, updateAd, deleteAd } from '../db/queries/ads.js'
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
  getSystemEmailSettings,
  updateSystemEmailSetting,
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

function signAdminToken(user) {
  return jwt.sign({ id: user.id, email: user.email, isAdmin: true }, config.jwtSecret, { expiresIn: '7d' })
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

    // 2FA is mandatory for admin accounts. If it's already enabled, hold off issuing the real
    // admin token until they pass a TOTP challenge. If it's not enabled yet, still let them in
    // (never hard-lock an admin out at the login step) but flag it so the admin UI forces a
    // "set up 2FA now" screen before showing the rest of the panel.
    const twoFa = await getTwoFactorFields(user.id)
    if (twoFa?.two_factor_enabled) {
      const tempToken = jwt.sign({ id: user.id, purpose: 'admin-2fa' }, config.jwtSecret, { expiresIn: '10m' })
      return res.json({ requires2FA: true, tempToken })
    }

    const token = signAdminToken(user)
    res.json({
      token,
      mustSetup2FA: true,
      admin: { id: user.id, full_name: user.full_name, email: user.email, avatar_url: user.avatar_url },
    })
  } catch (err) {
    next(err)
  }
}

export async function adminTwoFactorVerify(req, res, next) {
  try {
    const { tempToken, code } = req.body
    if (!tempToken || !code) return res.status(400).json({ error: 'tempToken and code are required' })

    let payload
    try {
      payload = jwt.verify(tempToken, config.jwtSecret)
    } catch {
      return res.status(400).json({ error: 'Session expired, please log in again' })
    }
    if (payload.purpose !== 'admin-2fa') return res.status(400).json({ error: 'Invalid token' })

    const twoFa = await getTwoFactorFields(payload.id)
    if (!twoFa?.two_factor_secret) return res.status(400).json({ error: 'Invalid state' })

    const valid = speakeasy.totp.verify({
      secret: twoFa.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 1,
    })
    if (!valid) return res.status(400).json({ error: 'Invalid authenticator code' })

    const user = await findAdminById(payload.id)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signAdminToken(user)
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
    const user = await findAdminById(req.admin.id)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const { two_factor_enabled, ...admin } = user
    res.json({ admin: { ...admin, mustSetup2FA: !two_factor_enabled } })
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

// ── Business profiles ─────────────────────────────────────────────────────────
//
// Support needs a way in: a company may lose the person who verified the domain, or ask for a
// profile to be taken down. Admin rights otherwise only come from proving control of the
// website, which a company can't always do on demand.

export async function listBusinesses(req, res, next) {
  try {
    const search = String(req.query.search || '').trim().toLowerCase()
    const params = []
    let where = ''
    if (search) {
      params.push(`%${search}%`)
      where = `WHERE lower(b.name) LIKE $1 OR lower(b.domain) LIKE $1`
    }
    const result = await query(
      `SELECT b.id, b.name, b.domain, b.slug, b.logo_url, b.show_on_profile, b.created_at,
              u.id AS owner_id, u.username AS owner_username,
              u.full_name AS owner_full_name, u.display_name AS owner_display_name,
              (SELECT COUNT(*) FROM website_representation_requests r
                WHERE r.status = 'approved'
                  AND regexp_replace(split_part(regexp_replace(lower(r.website_url), '^https?://', ''), '/', 1), '^www\\.', '') = b.domain
              ) AS representative_count
         FROM businesses b
         JOIN users u ON u.id = b.owner_id
         ${where}
        ORDER BY b.created_at DESC
        LIMIT 100`,
      params
    )
    res.json({ businesses: result.rows })
  } catch (err) {
    next(err)
  }
}

export async function deleteBusinessAsAdmin(req, res, next) {
  try {
    const result = await query(`DELETE FROM businesses WHERE id = $1 RETURNING name, domain`, [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ error: 'Business not found' })
    res.json({ success: true, deleted: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

// Hand a verified website — and its business profile — to a different account. The old admin
// keeps nothing for that domain; the new one gets what verifying it would have given them.
export async function reassignWebsiteAdmin(req, res, next) {
  try {
    const { websiteId } = req.params
    const { newOwnerId } = req.body
    if (!newOwnerId) return res.status(400).json({ error: 'newOwnerId is required' })

    const site = await query(`SELECT id, user_id, url FROM verified_websites WHERE id = $1`, [websiteId])
    if (!site.rows[0]) return res.status(404).json({ error: 'Website not found' })
    const { user_id: previousOwnerId, url } = site.rows[0]
    if (previousOwnerId === newOwnerId) return res.status(400).json({ error: 'That account already holds this website' })

    const newOwner = await query(`SELECT id FROM users WHERE id = $1`, [newOwnerId])
    if (!newOwner.rows[0]) return res.status(404).json({ error: 'That user does not exist' })

    const domain = normaliseDomain(url) || url

    await query(
      `INSERT INTO verified_websites (user_id, url, verified, updated_at)
       VALUES ($1, $2, true, NOW())
       ON CONFLICT (user_id, url) DO UPDATE SET verified = true, updated_at = NOW()`,
      [newOwnerId, domain]
    )
    await query(`DELETE FROM verified_websites WHERE id = $1`, [websiteId])
    await query(
      `UPDATE users SET website_verified = true, website_representation_approved = false,
         company_name = COALESCE(company_name, $1), updated_at = NOW()
       WHERE id = $2`,
      [domain, newOwnerId]
    )
    // The business profile follows the domain, as it does for a user-initiated transfer. If the
    // domain never had one — an older verification, or one the previous holder deleted — the new
    // admin gets the same starter profile a fresh verification would create.
    await transferBusinessByDomain(domain, newOwnerId)
    await ensureBusinessForDomain({ domain, ownerId: newOwnerId, websiteUrl: url }).catch(() => {})
    // Representatives of this domain now answer to the new admin.
    await query(
      `UPDATE website_representation_requests SET owner_id = $1
        WHERE regexp_replace(split_part(regexp_replace(lower(website_url), '^https?://', ''), '/', 1), '^www\\.', '') = $2
          AND requester_id != $1`,
      [newOwnerId, domain]
    )
    // Clear the previous holder's flag if this was their only verified site.
    const remaining = await query(
      `SELECT 1 FROM verified_websites WHERE user_id = $1 AND verified = true LIMIT 1`,
      [previousOwnerId]
    )
    if (remaining.rows.length === 0) {
      await query(`UPDATE users SET website_verified = false, updated_at = NOW() WHERE id = $1`, [previousOwnerId])
    }

    res.json({ success: true, domain, newOwnerId })
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

// ── System emails ─────────────────────────────────────────────────────────────

export async function listSystemEmails(req, res, next) {
  try {
    const emails = await getSystemEmailSettings()
    res.json({ emails })
  } catch (err) {
    next(err)
  }
}

export async function updateSystemEmail(req, res, next) {
  try {
    const { enabled, subject, body_html } = req.body
    const updated = await updateSystemEmailSetting(req.params.key, { enabled, subject, body_html })
    if (!updated) return res.status(404).json({ error: 'Email setting not found' })
    res.json({ email: updated })
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

// ── Sponsored ads ─────────────────────────────────────────────────────────────

// Creative is stored in our own uploads directory and served from our own domain. Keeping
// it first-party is deliberate: no third-party ad script runs in a user's session, nothing
// about who saw what leaves the platform, and there is no external tag to be tampered with.
function adPayload(body) {
  const roles = Array.isArray(body.target_roles) ? body.target_roles.filter(Boolean) : []
  const weight = Number.parseInt(body.weight, 10)
  return {
    title: (body.title || '').trim(),
    body: (body.body || '').trim() || null,
    image_url: (body.image_url || '').trim() || null,
    link_url: (body.link_url || '').trim(),
    link_text: (body.link_text || '').trim() || 'Learn More',
    target_roles: roles,
    active: body.active !== false,
    starts_at: body.starts_at || null,
    ends_at: body.ends_at || null,
    weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
    logo_border: body.logo_border !== false,
  }
}

export async function adminListAds(req, res, next) {
  try {
    res.json({ ads: await listAds() })
  } catch (err) {
    next(err)
  }
}

export async function adminCreateAd(req, res, next) {
  try {
    const data = adPayload(req.body)
    if (!data.title || !data.link_url) {
      return res.status(400).json({ error: 'Title and link URL are required' })
    }
    res.json({ ad: await createAd(data) })
  } catch (err) {
    next(err)
  }
}

export async function adminUpdateAd(req, res, next) {
  try {
    const data = adPayload(req.body)
    if (!data.title || !data.link_url) {
      return res.status(400).json({ error: 'Title and link URL are required' })
    }
    const ad = await updateAd(req.params.id, data)
    if (!ad) return res.status(404).json({ error: 'Ad not found' })
    res.json({ ad })
  } catch (err) {
    next(err)
  }
}

export async function adminDeleteAd(req, res, next) {
  try {
    await deleteAd(req.params.id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function adminUploadAdImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' })
    res.json({ imageUrl: `/uploads/${req.file.filename}` })
  } catch (err) {
    next(err)
  }
}
