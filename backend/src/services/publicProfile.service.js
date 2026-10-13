import { query } from '../config/database.js'
import { getPublicSocialConnections } from '../db/queries/auth_extras.js'
import { createTtlCache } from '../utils/ttlCache.js'

// A member's public profile: what anyone opening pulse.../u/<username> sees, signed in or not.
// It is the same for every viewer, so it is cached by username. Each view used to cost four
// queries, and a shared profile link can be opened by many people at once.
//
// Out of date by at most PROFILE_TTL_MS, and usually not at all: every request that can change
// a profile (profile and settings, social accounts, websites and representatives, businesses,
// the ID check, admin edits) clears the cache when it finishes. See clearProfilesAfterWrite.
const PROFILE_TTL_MS = 60 * 1000
const cache = createTtlCache({ ttlMs: PROFILE_TTL_MS, maxEntries: 1000 })

export async function loadPublicProfile(username) {
  const cached = cache.get(username)
  if (cached !== undefined) return cached

  const result = await query(
    `SELECT id, full_name, username, primary_role, primary_role_other, avatar_url, display_name, bio, status,
            country, kyc_status, created_at, website_verified, website_representation_approved
     FROM users WHERE username = $1`,
    [username]
  )
  const user = result.rows[0]
  if (!user) {
    // Not cached: a username can be taken a moment later, and misses are cheap.
    return null
  }

  const [socialConnections, websitesResult, repWebsitesResult] = await Promise.all([
    getPublicSocialConnections(user.id),
    query(`SELECT id, url FROM verified_websites WHERE user_id = $1 AND verified = true ORDER BY created_at`, [user.id]),
    query(`SELECT website_url AS url FROM website_representation_requests WHERE requester_id = $1 AND status = 'approved'`, [user.id]),
  ])

  const profile = {
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
  }
  cache.set(username, profile)
  return profile
}

export function clearPublicProfiles() {
  cache.clear()
}

// Middleware for the routers whose requests can change what a public profile shows. Clears the
// whole cache once a request succeeds: one change can touch other members' profiles too (an
// owner approving a representative changes the representative's profile), and these requests
// are rare next to profile views, so clearing everything is both simplest and always correct.
// `everyMethod` covers routes that write on a GET, such as the social OAuth callbacks.
export function clearProfilesAfterWrite({ everyMethod = false } = {}) {
  return (req, res, next) => {
    if (everyMethod || req.method !== 'GET') {
      res.on('finish', () => {
        if (res.statusCode < 400) cache.clear()
      })
    }
    next()
  }
}
