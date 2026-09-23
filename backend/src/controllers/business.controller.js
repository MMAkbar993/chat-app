import { unlink } from 'fs/promises'
import path from 'path'
import { query } from '../config/database.js'
import {
  normaliseDomain, uniqueSlug, slugify,
  getBusinessBySlug, getBusinessById, getBusinessByDomain, getBusinessesForOwner,
  createBusiness, updateBusiness, getTeamMembers,
} from '../db/queries/businesses.js'

// A business profile can only be created by the person who verified the domain — not by an
// approved representative, who speaks for the company but doesn't control the listing.
async function ownsDomain(userId, domain) {
  const result = await query(
    `SELECT id, url FROM verified_websites WHERE user_id = $1 AND verified = true`,
    [userId]
  )
  return result.rows.find((row) => normaliseDomain(row.url) === domain) || null
}

async function requireOwnedBusiness(req, res) {
  const business = await getBusinessById(req.params.id)
  if (!business) {
    res.status(404).json({ error: 'Business not found' })
    return null
  }
  if (business.owner_id !== req.user.id) {
    res.status(403).json({ error: 'Only the website owner can edit this business profile' })
    return null
  }
  return business
}

// Everything the owner needs for Settings: their profiles, plus the verified websites that
// don't have one yet, so the UI can offer "create" for exactly those.
export async function listMyBusinesses(req, res, next) {
  try {
    const [businesses, sites] = await Promise.all([
      getBusinessesForOwner(req.user.id),
      query(`SELECT id, url FROM verified_websites WHERE user_id = $1 AND verified = true ORDER BY created_at`, [req.user.id]),
    ])
    const used = new Set(businesses.map((b) => b.domain))
    const available = sites.rows
      .map((row) => ({ id: row.id, url: row.url, domain: normaliseDomain(row.url) }))
      .filter((row) => row.domain && !used.has(row.domain))
    res.json({ businesses, availableWebsites: available })
  } catch (err) {
    next(err)
  }
}

export async function createMyBusiness(req, res, next) {
  try {
    const { website_url, name } = req.body
    const domain = normaliseDomain(website_url)
    if (!domain) return res.status(400).json({ error: 'A valid website is required' })
    if (!name?.trim()) return res.status(400).json({ error: 'Business name is required' })

    const site = await ownsDomain(req.user.id, domain)
    if (!site) {
      return res.status(403).json({ error: 'You can only create a business profile for a website you have verified' })
    }
    const existing = await getBusinessByDomain(domain)
    if (existing) return res.status(409).json({ error: 'This website already has a business profile' })

    const slug = await uniqueSlug(name, domain)
    const business = await createBusiness({
      domain, slug, ownerId: req.user.id, name: name.trim(), websiteUrl: site.url,
    })
    res.status(201).json({ business })
  } catch (err) {
    next(err)
  }
}

export async function updateMyBusiness(req, res, next) {
  try {
    const business = await requireOwnedBusiness(req, res)
    if (!business) return undefined

    const patch = {}
    for (const key of ['name', 'about', 'email', 'industry', 'headquarters']) {
      if (req.body[key] !== undefined) patch[key] = String(req.body[key]).trim() || null
    }
    if (req.body.founded_on !== undefined) patch.founded_on = req.body.founded_on || null
    if (req.body.show_on_profile !== undefined) patch.show_on_profile = Boolean(req.body.show_on_profile)
    if (Array.isArray(req.body.services)) {
      patch.services = req.body.services.map((s) => String(s).trim()).filter(Boolean).slice(0, 12)
    }
    // The website can only be swapped for another domain this user has verified, and only to
    // one that has no profile of its own.
    if (req.body.website_url !== undefined) {
      const domain = normaliseDomain(req.body.website_url)
      const site = domain ? await ownsDomain(req.user.id, domain) : null
      if (!site) return res.status(400).json({ error: 'Choose one of your verified websites' })
      if (domain !== business.domain) {
        const clash = await getBusinessByDomain(domain)
        if (clash) return res.status(409).json({ error: 'That website already has a business profile' })
        await query(`UPDATE businesses SET domain = $1 WHERE id = $2`, [domain, business.id])
      }
      patch.website_url = site.url
    }
    if (req.body.slug !== undefined) {
      const wanted = slugify(req.body.slug)
      if (!wanted) return res.status(400).json({ error: 'Link must be at least 3 letters or numbers' })
      if (wanted !== business.slug) {
        const taken = await getBusinessBySlug(wanted)
        if (taken) return res.status(409).json({ error: 'That link is already taken' })
        patch.slug = wanted
      }
    }

    const updated = await updateBusiness(business.id, patch)
    res.json({ business: updated })
  } catch (err) {
    next(err)
  }
}

async function saveImage(req, res, next, column) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const business = await requireOwnedBusiness(req, res)
    if (!business) {
      await unlink(req.file.path).catch(() => {})
      return undefined
    }
    const url = `/uploads/${req.file.filename}`
    const updated = await updateBusiness(business.id, { [column]: url })
    // Drop the file the profile no longer points at, rather than leaving it on disk forever.
    const previous = business[column]
    if (previous && previous !== url) {
      await unlink(path.join(process.cwd(), previous.replace(/^\//, ''))).catch(() => {})
    }
    res.json({ business: updated })
  } catch (err) {
    next(err)
  }
}

export const uploadBusinessLogo = (req, res, next) => saveImage(req, res, next, 'logo_url')
export const uploadBusinessCover = (req, res, next) => saveImage(req, res, next, 'cover_url')

export async function deleteMyBusiness(req, res, next) {
  try {
    const business = await requireOwnedBusiness(req, res)
    if (!business) return undefined
    await query(`DELETE FROM businesses WHERE id = $1`, [business.id])
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

// Public: what a share link resolves to. No auth — the whole point is that someone outside
// Pulse can open it and see who to contact.
export async function getPublicBusiness(req, res, next) {
  try {
    const business = await getBusinessBySlug(req.params.slug)
    if (!business) return res.status(404).json({ error: 'Business not found' })
    const team = await getTeamMembers(business.domain, business.owner_id)
    res.json({ business, team })
  } catch (err) {
    next(err)
  }
}
