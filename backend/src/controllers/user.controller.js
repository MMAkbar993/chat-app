import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import axios from 'axios'
import dns from 'dns/promises'
import { query } from '../config/database.js'
import { findUserById, markTourSeen } from '../db/queries/users.js'
import {
  getSocialConnections,
  getPublicSocialConnections,
} from '../db/queries/auth_extras.js'
import { getIo } from '../socket/index.js'
import { sendPasswordChangedEmail, sendEmailChangedEmail, sendWebsiteVerifiedEmail, sendWebsiteVerifyCode } from '../config/email.js'
import {
  normaliseDomain, deleteBusinessByDomain, transferBusinessByDomain, getProfileBusiness,
  ensureBusinessForDomain,
} from '../db/queries/businesses.js'

// Catches http(s)://, www., and bare domain-looking text (e.g. "affiliateroulette.com") so people
// can't route around website-in-bio blocking just by dropping the protocol/www prefix.
const URL_PATTERN = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|net|org|io|co|info|biz|xyz|online|site|app|dev|me|ai|gg|tv|casino|bet|game|shop|club|link)\b/i

function containsUrl(text) {
  return Boolean(text) && URL_PATTERN.test(text)
}

// ─── Website verification helpers ───────────────────────────────────────────
//
// Verification fetches the customer's homepage and looks for their token. Two things
// routinely break that and used to collapse into one useless "Could not reach your website":
//   * WAFs (Cloudflare, Sucuri, Imperva) answer 403 to anything that isn't a real browser,
//     so the page is perfectly public and we still never see the HTML.
//   * apex vs. www — the URL they typed may redirect, or only one of the two may resolve.
// So we try both hostname variants, and when HTTP is walled off we fall back to a DNS TXT
// record, which no WAF can block.

const VERIFY_TXT_HOST = '_pulse-verification'

// SQL that reduces a stored website URL to its bare host: drops the scheme, any path, and a
// leading "www.". Used so all the spellings of one site compare equal, including rows stored
// before URLs were canonicalised on the way in.
const BARE_DOMAIN_SQL = (column) =>
  `regexp_replace(split_part(regexp_replace(lower(${column}), '^https?://', ''), '/', 1), '^www\\.', '')`

// JS side of BARE_DOMAIN_SQL: what to compare a stored URL against.
const bareDomain = (u) => normaliseDomain(u) || u

function hostOf(url) {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname
  } catch {
    return null
  }
}

// The typed URL first, then the other of apex/www — sites commonly serve only one.
function urlVariants(url) {
  const base = url.startsWith('http') ? url : `https://${url}`
  const out = [base]
  try {
    const u = new URL(base)
    const alt = new URL(base)
    alt.hostname = u.hostname.startsWith('www.') ? u.hostname.slice(4) : `www.${u.hostname}`
    out.push(alt.toString().replace(/\/$/, ''))
  } catch {}
  return [...new Set(out)]
}

// Cloudflare and friends serve their block/challenge page with a 200 as often as a 403,
// so a status check alone isn't enough — sniff the body too.
function looksLikeBotWall(status, body) {
  if ([401, 403, 406, 429, 503].includes(status)) return true
  const html = String(body || '').slice(0, 4000)
  return /Attention Required!|Just a moment\.\.\.|cf-browser-verification|Checking your browser|Access denied|Sucuri WebSite Firewall/i.test(html)
}

async function fetchPage(url) {
  try {
    const resp = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      // Read the body on error statuses too: we need it to tell a firewall page apart from a 404.
      validateStatus: () => true,
      headers: {
        // A plain "SiteVerifier" UA gets refused by most WAFs on sight.
        'User-Agent': 'Mozilla/5.0 (compatible; PulseSiteVerifier/1.0; +https://pulse.affiliateroulette.com)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    return { reached: true, status: resp.status, html: typeof resp.data === 'string' ? resp.data : '' }
  } catch {
    return { reached: false, status: 0, html: '' }
  }
}

// TXT lookup on both `_pulse-verification.example.com` and the apex, so either placement works.
async function dnsHasToken(host, token) {
  if (!host) return false
  const bare = host.replace(/^www\./, '')
  for (const name of [`${VERIFY_TXT_HOST}.${bare}`, bare]) {
    try {
      const records = await dns.resolveTxt(name)
      if (records.some((parts) => parts.join('').includes(token))) return true
    } catch {
      // NXDOMAIN / no TXT records — just try the next name.
    }
  }
  return false
}

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
        business: await getProfileBusiness(req.user.id),
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { display_name, bio, gender, phone, website, location, country, primary_role, primary_role_other, date_of_birth, job_title, company_name } = req.body

    if (containsUrl(bio) || containsUrl(job_title)) {
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
         company_name = CASE
           WHEN NOT website_verified AND NOT website_representation_approved
           THEN COALESCE($11, company_name)
           ELSE company_name
         END,
         updated_at = NOW()
       WHERE id = $12
       RETURNING id, full_name, username, country, location, email, primary_role, primary_role_other, phone,
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
        primary_role === 'other' ? (primary_role_other || null) : null,
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
      `SELECT u.id, u.full_name, u.username, u.primary_role, u.primary_role_other, u.avatar_url, u.display_name, u.bio,
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
      `SELECT id, full_name, username, primary_role, primary_role_other, avatar_url, display_name, bio,
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

export async function initWebsiteVerification(req, res, next) {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: 'Website URL is required' })

    // Compare (and store) the bare domain. "example.com", "www.example.com" and
    // "https://example.com/" are the same site, but as raw strings they never matched, so a
    // site already verified could be verified again under another spelling — and claimed by
    // someone else that way too.
    const normalised = normaliseDomain(url)
    if (!normalised) return res.status(400).json({ error: 'Enter a valid website address' })

    // Check if another user already verified this website
    const claimed = await query(
      `SELECT u.id, u.display_name, u.full_name
       FROM verified_websites vw
       JOIN users u ON u.id = vw.user_id
       WHERE vw.verified = true AND ${BARE_DOMAIN_SQL('vw.url')} = $1 AND vw.user_id != $2`,
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

    // A row this user already has for the same domain under any spelling — update that one
    // rather than inserting a near-duplicate that ON CONFLICT(user_id, url) wouldn't catch.
    const ownRow = await query(
      `SELECT id, verified, verify_token FROM verified_websites
        WHERE user_id = $1 AND ${BARE_DOMAIN_SQL('url')} = $2
        ORDER BY verified DESC LIMIT 1`,
      [req.user.id, normalised]
    )
    if (ownRow.rows[0]?.verified) {
      return res.status(409).json({ error: 'already_verified', websiteUrl: normalised })
    }

    const token = crypto.randomBytes(20).toString('hex')
    // Keep any token this site already has rather than minting a new one. Adding the meta tag
    // is a job for someone else's dev team and can take days — regenerating on every visit
    // silently invalidated the snippet they'd already deployed, so verification could never
    // succeed. `verified` is deliberately left untouched too, so re-opening this page can't
    // un-verify an already-verified site.
    const inserted = ownRow.rows[0]
      ? await query(
          `UPDATE verified_websites
              SET url = $1, verify_token = COALESCE(verify_token, $2), updated_at = NOW()
            WHERE id = $3
            RETURNING id, verify_token, verified`,
          [normalised, token, ownRow.rows[0].id]
        )
      : await query(
          `INSERT INTO verified_websites (user_id, url, verify_token, verified, updated_at)
           VALUES ($1, $2, $3, false, NOW())
           ON CONFLICT (user_id, url) DO UPDATE
             SET verify_token = COALESCE(verified_websites.verify_token, EXCLUDED.verify_token),
                 updated_at = NOW()
           RETURNING id, verify_token, verified`,
          [req.user.id, normalised, token]
        )
    const row = inserted.rows[0]
    const bareHost = (hostOf(normalised) || '').replace(/^www\./, '')
    res.json({
      token: row.verify_token,
      metaTag: `<meta name="site-verification" content="${row.verify_token}">`,
      // DNS is the escape hatch for sites behind a WAF that refuses our HTTP check.
      dnsHost: bareHost ? `${VERIFY_TXT_HOST}.${bareHost}` : null,
      dnsValue: row.verify_token,
      websiteId: row.id,
      verified: row.verified,
    })
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
       WHERE r.owner_id = $1 AND ${BARE_DOMAIN_SQL('r.website_url')} = $2 AND r.status = 'approved'`,
      [req.user.id, bareDomain(url)]
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
       WHERE owner_id = $1 AND requester_id = $2 AND ${BARE_DOMAIN_SQL('website_url')} = $3 AND status = 'approved'`,
      [req.user.id, newOwnerId, bareDomain(url)]
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
      [newOwnerId, bareDomain(url)]
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
       WHERE owner_id = $2 AND ${BARE_DOMAIN_SQL('website_url')} = $3`,
      [newOwnerId, req.user.id, bareDomain(url)]
    )
    // Remove the self-referential row where new owner is both owner and requester
    await query(
      `DELETE FROM website_representation_requests
       WHERE owner_id = $1 AND requester_id = $1 AND ${BARE_DOMAIN_SQL('website_url')} = $2`,
      [newOwnerId, bareDomain(url)]
    )
    // The business profile follows the domain to its new owner rather than being deleted with
    // the old owner's verified_websites row below.
    await transferBusinessByDomain(normaliseDomain(url), newOwnerId)

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

    // The business profile exists on the strength of this verification, so it goes with it.
    await deleteBusinessByDomain(normaliseDomain(url), req.user.id)

    // Revoke all approved reps for this site
    const reps = await query(
      `SELECT requester_id FROM website_representation_requests
       WHERE owner_id = $1 AND ${BARE_DOMAIN_SQL('website_url')} = $2 AND status = 'approved'`,
      [req.user.id, bareDomain(url)]
    )
    if (reps.rows.length > 0) {
      await query(
        `UPDATE website_representation_requests SET status = 'revoked'
         WHERE owner_id = $1 AND ${BARE_DOMAIN_SQL('website_url')} = $2 AND status = 'approved'`,
        [req.user.id, bareDomain(url)]
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
    // verify_token comes back for pending sites so the UI can restore the exact snippet the
    // user was given, instead of making them re-request one (which is how the old token got
    // lost in the first place).
    const result = await query(
      `SELECT id, url, verified, created_at,
              CASE WHEN verified THEN NULL ELSE verify_token END AS verify_token
       FROM verified_websites WHERE user_id = $1 ORDER BY created_at`,
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
       WHERE vw.user_id = $1 AND ${BARE_DOMAIN_SQL('vw.url')} = $2 AND vw.verified = true`,
      [ownerId, bareDomain(url)]
    )
    if (!owner.rows[0]) return res.status(404).json({ error: 'Owner not found or website no longer verified' })

    await query(
      `INSERT INTO website_representation_requests (website_url, requester_id, owner_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (website_url, requester_id) DO UPDATE SET status = 'pending', created_at = NOW()`,
      [bareDomain(url), req.user.id, ownerId]
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

    // Try the meta tag over HTTP on both apex and www, then fall back to DNS TXT. We keep
    // track of *why* HTTP failed so the error we hand back names the real obstacle instead
    // of the old catch-all "Could not reach your website", which sent people hunting for a
    // typo in a meta tag that was actually sitting there correctly behind a firewall.
    let found = false
    let anyReached = false
    let walled = false
    for (const candidate of urlVariants(url)) {
      const { reached, status, html } = await fetchPage(candidate)
      if (!reached) continue
      if (html.includes(verify_token)) { found = true; break }
      if (looksLikeBotWall(status, html)) { walled = true; continue }
      if (status >= 200 && status < 400) anyReached = true
    }

    const host = hostOf(url)
    if (!found) found = await dnsHasToken(host, verify_token)

    if (!found) {
      const bare = (host || 'yourdomain.com').replace(/^www\./, '')
      if (walled) {
        return res.status(400).json({
          error: `Your site's firewall (Cloudflare or similar) is blocking our check, so we can't read the meta tag even if it is there. Either allow the user agent "PulseSiteVerifier" in your firewall rules, or verify by DNS instead: add a TXT record on ${VERIFY_TXT_HOST}.${bare} with the value ${verify_token}, then click Verify again.`,
          reason: 'blocked',
          dnsHost: `${VERIFY_TXT_HOST}.${bare}`,
          dnsValue: verify_token,
        })
      }
      if (!anyReached) {
        return res.status(400).json({
          error: 'Could not reach your website. Make sure it is publicly accessible over https.',
          reason: 'unreachable',
        })
      }
      return res.status(400).json({
        error: 'We loaded your site but the verification tag was not in the HTML. Make sure the meta tag is in the <head> of your homepage and that the change is published live.',
        reason: 'tag_missing',
        dnsHost: `${VERIFY_TXT_HOST}.${bare}`,
        dnsValue: verify_token,
      })
    }

    // Re-check ownership at the finish line, not only when verification started: a pending row
    // may predate domain canonicalisation, or someone else may have verified the same domain
    // while this one sat waiting for a meta tag. Without this, two accounts could both end up
    // verified for one site.
    const takenMeanwhile = await query(
      `SELECT u.id, u.display_name, u.full_name
         FROM verified_websites vw
         JOIN users u ON u.id = vw.user_id
        WHERE vw.verified = true AND ${BARE_DOMAIN_SQL('vw.url')} = $1 AND vw.user_id != $2`,
      [normaliseDomain(url) || url, req.user.id]
    )
    if (takenMeanwhile.rows[0]) {
      const owner = takenMeanwhile.rows[0]
      return res.status(409).json({
        error: 'already_claimed',
        ownerName: owner.display_name || owner.full_name || 'another user',
        ownerId: owner.id,
        websiteUrl: normaliseDomain(url) || url,
      })
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
    // Representatives who verified by email before anyone claimed this domain now belong to
    // this admin, so they show up in their representatives list.
    await query(
      `UPDATE website_representation_requests SET owner_id = $1
        WHERE owner_id IS NULL AND ${BARE_DOMAIN_SQL('website_url')} = $2 AND requester_id != $1`,
      [req.user.id, bareDomain(url)]
    )
    // Admin verification creates the business profile straight away. Without this, Settings
    // opened on an empty create form and the profile only "appeared" once the owner filled it in.
    let business = null
    try {
      business = await ensureBusinessForDomain({
        domain: normaliseDomain(url),
        ownerId: req.user.id,
        websiteUrl: url,
      })
    } catch (e) {
      // A profile is a convenience here; never fail a completed verification over it.
      console.error('Could not auto-create business profile:', e.message)
    }
    sendWebsiteVerifiedEmail(req.user.email, url).catch(() => {})
    res.json({ success: true, business })
  } catch (err) {
    next(err)
  }
}

// ─── Becoming a representative by business email ────────────────────────────
//
// A company email shows that someone works there, not that they control the domain — at a
// large operator that would hand the listing to whoever signed up first, and leaving the
// company wouldn't take it back. So email verification makes someone a *representative*;
// admin rights still require a meta tag or a DNS record. No approval step: the code proves
// they receive mail at the domain, which is the whole point of it.

const EMAIL_CODE_MAX_ATTEMPTS = 5

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex')
}

export async function sendRepEmailCode(req, res, next) {
  try {
    const { url, email } = req.body
    if (!url || !email) return res.status(400).json({ error: 'url and email are required' })

    const domain = normaliseDomain(url)
    if (!domain) return res.status(400).json({ error: 'Enter a valid website address' })

    const address = String(email).trim().toLowerCase()
    const emailDomain = address.includes('@') ? address.split('@').pop() : null
    // The basis of this method: the address must be on the domain itself. A subdomain won't
    // do — mail at support.brand.com doesn't establish anything about brand.com.
    if (!emailDomain || emailDomain !== domain) {
      return res.status(400).json({
        error: `That email has to be on ${domain}. An address at another domain doesn't show you work there.`,
      })
    }

    const code = String(crypto.randomInt(100000, 1000000))
    await query(
      `INSERT INTO website_rep_email_codes (user_id, domain, email, code_hash, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '15 minutes')
       ON CONFLICT (user_id, domain) DO UPDATE
         SET email = EXCLUDED.email, code_hash = EXCLUDED.code_hash,
             expires_at = EXCLUDED.expires_at, attempts = 0, created_at = NOW()`,
      [req.user.id, domain, address, hashCode(code)]
    )
    await sendWebsiteVerifyCode(address, code, domain)
    res.json({ sentTo: address, domain })
  } catch (err) {
    next(err)
  }
}

export async function confirmRepEmailCode(req, res, next) {
  try {
    const { url, code } = req.body
    if (!url || !code) return res.status(400).json({ error: 'url and code are required' })
    const domain = normaliseDomain(url)
    if (!domain) return res.status(400).json({ error: 'Enter a valid website address' })

    const pending = await query(
      `SELECT id, code_hash, expires_at, attempts FROM website_rep_email_codes
        WHERE user_id = $1 AND domain = $2`,
      [req.user.id, domain]
    )
    const row = pending.rows[0]
    if (!row) return res.status(400).json({ error: 'Request a code first' })
    if (new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: 'That code has expired. Request a new one.' })
    }
    if (row.attempts >= EMAIL_CODE_MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Request a new code.' })
    }
    if (hashCode(String(code).trim()) !== row.code_hash) {
      await query(`UPDATE website_rep_email_codes SET attempts = attempts + 1 WHERE id = $1`, [row.id])
      return res.status(400).json({ error: 'That code is not correct.' })
    }

    // An admin who removed this person gets to make it stick. Their old company mailbox may
    // well still work, so without this, "remove" would last only until they clicked verify
    // again — useless for the case it exists for, someone who has left the company.
    const revoked = await query(
      `SELECT 1 FROM website_representation_requests
        WHERE requester_id = $1 AND status = 'revoked' AND ${BARE_DOMAIN_SQL('website_url')} = $2`,
      [req.user.id, domain]
    )
    if (revoked.rows[0]) {
      return res.status(403).json({
        error: `An admin of ${domain} removed you as a representative. Contact them if that was a mistake.`,
      })
    }

    // Whoever holds the domain today, if anyone. Nobody may have claimed it yet, in which
    // case owner_id stays null and is filled in when an admin eventually verifies.
    const ownerRow = await query(
      `SELECT user_id FROM verified_websites
        WHERE verified = true AND ${BARE_DOMAIN_SQL('url')} = $1 AND user_id != $2
        LIMIT 1`,
      [domain, req.user.id]
    )
    const ownerId = ownerRow.rows[0]?.user_id || null

    await query(
      `INSERT INTO website_representation_requests (website_url, requester_id, owner_id, status, verified_via)
       VALUES ($1, $2, $3, 'approved', 'email')
       ON CONFLICT (website_url, requester_id) DO UPDATE
         SET status = 'approved', owner_id = EXCLUDED.owner_id, verified_via = 'email', created_at = NOW()`,
      [domain, req.user.id, ownerId]
    )
    await query(
      `UPDATE users SET website_representation_approved = true,
         company_name = COALESCE(company_name, $1), updated_at = NOW()
       WHERE id = $2`,
      [domain, req.user.id]
    )
    await query(`DELETE FROM website_rep_email_codes WHERE id = $1`, [row.id])

    // Let the admin know someone now represents their company.
    if (ownerId) {
      const me = await findUserById(req.user.id)
      createNotification(ownerId, 'representation_verified', {
        websiteUrl: domain,
        requesterName: me?.display_name || me?.full_name || me?.username,
        requesterId: req.user.id,
      })
    }

    res.json({ success: true, domain, ownerClaimed: Boolean(ownerId) })
  } catch (err) {
    next(err)
  }
}

// A representative stepping back from a company, without needing the admin to do it.
export async function removeMyRepresentation(req, res, next) {
  try {
    const domain = normaliseDomain(req.query.url || req.body?.url)
    if (!domain) return res.status(400).json({ error: 'url is required' })
    await query(
      `DELETE FROM website_representation_requests
        WHERE requester_id = $1 AND ${BARE_DOMAIN_SQL('website_url')} = $2`,
      [req.user.id, domain]
    )
    const remaining = await query(
      `SELECT 1 FROM website_representation_requests
        WHERE requester_id = $1 AND status = 'approved' LIMIT 1`,
      [req.user.id]
    )
    if (remaining.rows.length === 0) {
      await query(`UPDATE users SET website_representation_approved = false WHERE id = $1`, [req.user.id])
    }
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
