import { query } from '../../config/database.js'

export const DISMISS_DAYS = 7

// Weighted random pick (Efraimidis–Spirakis): ordering by random()^(1/weight) descending
// gives each row a chance proportional to its weight, so a weight-3 ad is shown three times
// as often as a weight-1 one without needing a separate rotation cursor.
export async function pickAdForUser(userId, role) {
  const result = await query(
    `SELECT id, title, body, image_url, link_url, link_text
       FROM ads a
      WHERE a.active = true
        AND (a.starts_at IS NULL OR a.starts_at <= NOW())
        AND (a.ends_at   IS NULL OR a.ends_at   >= NOW())
        AND (cardinality(a.target_roles) = 0 OR $2 = ANY(a.target_roles))
        AND NOT EXISTS (
          SELECT 1 FROM ad_dismissals d
           WHERE d.ad_id = a.id AND d.user_id = $1
             AND d.dismissed_at > NOW() - ($3 || ' days')::interval
        )
      ORDER BY random() ^ (1.0 / a.weight) DESC
      LIMIT 1`,
    [userId, role || '', String(DISMISS_DAYS)]
  )
  return result.rows[0] || null
}

// Returns true only when this was the user's first view of the ad today, which is what the
// caller reports as an impression.
export async function recordImpression(adId, userId) {
  const result = await query(
    `INSERT INTO ad_impressions (ad_id, user_id, day)
     VALUES ($1, $2, CURRENT_DATE)
     ON CONFLICT DO NOTHING
     RETURNING ad_id`,
    [adId, userId]
  )
  return result.rowCount > 0
}

export async function recordClick(adId) {
  await query(`UPDATE ads SET clicks = clicks + 1 WHERE id = $1`, [adId])
}

export async function dismissAd(adId, userId) {
  await query(
    `INSERT INTO ad_dismissals (ad_id, user_id, dismissed_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (ad_id, user_id) DO UPDATE SET dismissed_at = NOW()`,
    [adId, userId]
  )
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function listAds() {
  const result = await query(
    `SELECT a.*,
            COALESCE(i.total, 0)   AS impressions,
            COALESCE(d.total, 0)   AS dismissals
       FROM ads a
       LEFT JOIN (SELECT ad_id, COUNT(*) AS total FROM ad_impressions GROUP BY ad_id) i ON i.ad_id = a.id
       LEFT JOIN (SELECT ad_id, COUNT(*) AS total FROM ad_dismissals  GROUP BY ad_id) d ON d.ad_id = a.id
      ORDER BY a.active DESC, a.created_at DESC`
  )
  return result.rows
}

export async function createAd(data) {
  const result = await query(
    `INSERT INTO ads (title, body, image_url, link_url, link_text, target_roles, active, starts_at, ends_at, weight)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [data.title, data.body, data.image_url, data.link_url, data.link_text,
     data.target_roles, data.active, data.starts_at, data.ends_at, data.weight]
  )
  return result.rows[0]
}

export async function updateAd(id, data) {
  const result = await query(
    `UPDATE ads SET title = $2, body = $3, image_url = $4, link_url = $5, link_text = $6,
            target_roles = $7, active = $8, starts_at = $9, ends_at = $10, weight = $11,
            updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
    [id, data.title, data.body, data.image_url, data.link_url, data.link_text,
     data.target_roles, data.active, data.starts_at, data.ends_at, data.weight]
  )
  return result.rows[0]
}

export async function deleteAd(id) {
  await query(`DELETE FROM ads WHERE id = $1`, [id])
}
