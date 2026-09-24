import { query } from '../../config/database.js'

// Bare host, lowercased, no www — the form a user types ("https://www.Example.com/") and the
// form stored on verified_websites both normalise to the same key.
export function normaliseDomain(url) {
  if (!url) return null
  try {
    const raw = String(url).trim()
    // Case-insensitive: "HTTP://Example.com" would otherwise fail the prefix test, get
    // "https://" prepended, and normalise to the domain "http".
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

const RESERVED_SLUGS = new Set([
  'u', 'b', 'chat', 'api', 'login', 'signup', 'admin', 'join', 'verify', 'settings',
  'privacy', 'terms', 'cookies', 'kyc-policy', 'how-it-works', 'uploads', 'payment',
])

export function slugify(name) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return base.length >= 3 ? base : null
}

// Appends -2, -3 … until free. Also steps over reserved words so a business can't take a slug
// that would shadow an app route.
export async function uniqueSlug(name, fallback) {
  const base = slugify(name) || slugify(fallback) || 'business'
  let candidate = base
  let n = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!RESERVED_SLUGS.has(candidate)) {
      const taken = await query(`SELECT 1 FROM businesses WHERE slug = $1`, [candidate])
      if (taken.rows.length === 0) return candidate
    }
    n += 1
    candidate = `${base}-${n}`
  }
}

const COLUMNS = `id, domain, slug, owner_id, name, about, logo_url, cover_url, website_url,
                 founded_on, email, industry, headquarters, services, show_on_profile, created_at`

export async function getBusinessBySlug(slug) {
  const result = await query(`SELECT ${COLUMNS} FROM businesses WHERE slug = $1`, [slug])
  return result.rows[0] || null
}

export async function getBusinessByDomain(domain) {
  const result = await query(`SELECT ${COLUMNS} FROM businesses WHERE domain = $1`, [domain])
  return result.rows[0] || null
}

export async function getBusinessById(id) {
  const result = await query(`SELECT ${COLUMNS} FROM businesses WHERE id = $1`, [id])
  return result.rows[0] || null
}

export async function getBusinessesForOwner(ownerId) {
  const result = await query(
    `SELECT ${COLUMNS} FROM businesses WHERE owner_id = $1 ORDER BY created_at`,
    [ownerId]
  )
  return result.rows
}

export async function createBusiness({ domain, slug, ownerId, name, websiteUrl }) {
  const result = await query(
    `INSERT INTO businesses (domain, slug, owner_id, name, website_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNS}`,
    [domain, slug, ownerId, name, websiteUrl]
  )
  return result.rows[0]
}

// "gamblehow.co.uk" -> "Gamblehow". Only a starting point for the auto-created profile; the
// owner renames it from Settings, and the name is not what identifies the business (domain is).
export function businessNameFromDomain(domain) {
  const label = String(domain || '').split('.')[0].replace(/[-_]+/g, ' ').trim()
  if (!label) return 'Business'
  return label.replace(/(^| )[a-z]/g, (c) => c.toUpperCase())
}

// Verifying a domain as its admin is itself the proof a business profile needs, so the profile
// exists from that moment rather than after the owner fills in a create form. Returns the
// existing profile untouched when the domain already has one — including one that changed hands,
// which must keep its current owner's content.
export async function ensureBusinessForDomain({ domain, ownerId, websiteUrl }) {
  if (!domain || !ownerId) return null
  const existing = await getBusinessByDomain(domain)
  if (existing) return existing
  const name = businessNameFromDomain(domain)
  const result = await query(
    `INSERT INTO businesses (domain, slug, owner_id, name, website_url)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (domain) DO NOTHING
     RETURNING ${COLUMNS}`,
    [domain, await uniqueSlug(name, domain), ownerId, name, websiteUrl || `https://${domain}`]
  )
  // A concurrent verification of the same domain won the insert; hand back whatever landed.
  return result.rows[0] || (await getBusinessByDomain(domain))
}

const EDITABLE = {
  name: 'name',
  about: 'about',
  website_url: 'website_url',
  founded_on: 'founded_on',
  email: 'email',
  industry: 'industry',
  headquarters: 'headquarters',
  services: 'services',
  show_on_profile: 'show_on_profile',
  logo_url: 'logo_url',
  cover_url: 'cover_url',
  slug: 'slug',
}

// Only the fields actually present in `patch` are written, so clearing one field can't blank
// the rest and an unknown key can't reach the query at all.
export async function updateBusiness(id, patch) {
  const sets = []
  const values = []
  for (const [key, column] of Object.entries(EDITABLE)) {
    if (patch[key] === undefined) continue
    values.push(patch[key])
    sets.push(`${column} = $${values.length}`)
  }
  if (sets.length === 0) return getBusinessById(id)
  values.push(id)
  const result = await query(
    `UPDATE businesses SET ${sets.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING ${COLUMNS}`,
    values
  )
  return result.rows[0] || null
}

export async function deleteBusinessByDomain(domain, ownerId) {
  await query(`DELETE FROM businesses WHERE domain = $1 AND owner_id = $2`, [domain, ownerId])
}

export async function transferBusinessByDomain(domain, newOwnerId) {
  await query(
    `UPDATE businesses SET owner_id = $1, updated_at = NOW() WHERE domain = $2`,
    [newOwnerId, domain]
  )
}

// The owner plus everyone approved to represent the domain. Anyone who has hidden themselves
// from search is left out here too — being unlisted shouldn't be undone by a colleague's
// business page listing you.
export async function getTeamMembers(domain, ownerId) {
  const result = await query(
    `SELECT DISTINCT u.id, u.full_name, u.display_name, u.username, u.avatar_url, u.job_title,
            (u.id = $2) AS is_owner
       FROM users u
      WHERE u.is_active = true
        AND u.hide_from_search = false
        AND (
          u.id = $2
          OR EXISTS (
            SELECT 1 FROM website_representation_requests r
             WHERE r.requester_id = u.id
               AND r.status = 'approved'
               -- Exact host match. A prefix match would let an approved rep of
               -- "brand.com.attacker.net" appear on brand.com's team page.
               AND regexp_replace(split_part(regexp_replace(lower(r.website_url), '^https?://', ''), '/', 1), '^www\\.', '') = $1
          )
        )
      ORDER BY is_owner DESC, u.full_name`,
    [domain, ownerId]
  )
  return result.rows
}

// The card on someone's personal profile: their first business they've chosen to show there.
export async function getProfileBusiness(ownerId) {
  const result = await query(
    `SELECT name, slug, logo_url, domain FROM businesses
      WHERE owner_id = $1 AND show_on_profile = true
      ORDER BY created_at LIMIT 1`,
    [ownerId]
  )
  return result.rows[0] || null
}

export async function searchBusinesses(term, limit = 5) {
  const needle = String(term || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!needle) return []
  const result = await query(
    `SELECT ${COLUMNS} FROM businesses
      WHERE regexp_replace(lower(name), '[^a-z0-9]', '', 'g') LIKE '%' || $1 || '%'
         OR regexp_replace(lower(domain), '[^a-z0-9]', '', 'g') LIKE '%' || $1 || '%'
      LIMIT $2`,
    [needle, limit]
  )
  return result.rows
}
