// The Christmas giveaway admin panel: numbers, entries, winners, and the changes an admin can make
// (block an entry, mark a prize delivered, change a prize's limits). `tests` switches every count
// and list to preview mode data (testers on GIVEAWAY_PREVIEW_EMAILS) instead of real data.
import { query } from '../../config/database.js'

// A prize that is Pulse Pro is delivered by the claim itself; everything else is delivered by hand.
const AUTO_DELIVERED = '(p.pro_months IS NOT NULL OR p.pro_lifetime)'

export async function giveawayOverview(today, tests = false) {
  const { rows: [n] } = await query(
    `SELECT
       (SELECT COUNT(*) FROM giveaway_entrants)::int AS entrants,
       (SELECT COUNT(*) FROM giveaway_entrants WHERE (created_at AT TIME ZONE 'UTC')::date = $1)::int AS entrants_today,
       (SELECT COUNT(*) FROM giveaway_entrants WHERE blocked_at IS NOT NULL)::int AS blocked,
       (SELECT COUNT(*) FROM giveaway_spins WHERE is_preview = $2)::int AS spins,
       (SELECT COUNT(*) FROM giveaway_spins WHERE is_preview = $2 AND spin_day = $1)::int AS spins_today,
       (SELECT COUNT(*) FROM giveaway_wins WHERE is_preview = $2)::int AS wins,
       (SELECT COUNT(*) FROM giveaway_wins WHERE is_preview = $2 AND won_day = $1)::int AS wins_today,
       (SELECT COUNT(*) FROM giveaway_wins WHERE is_preview = $2 AND claimed_at IS NOT NULL)::int AS claimed,
       (SELECT COUNT(*) FROM giveaway_wins w JOIN giveaway_prizes p ON p.key = w.prize_key
         WHERE w.is_preview = $2 AND w.claimed_at IS NOT NULL AND w.fulfilled_at IS NULL AND NOT ${AUTO_DELIVERED})::int AS to_deliver`,
    [today, tests]
  )
  const { rows: categories } = await query(
    `SELECT category, COUNT(*)::int AS count FROM giveaway_entrants GROUP BY category ORDER BY count DESC`
  )
  return { ...n, categories }
}

export async function listGiveawayEntrants({ q = '', category = '', status = '', page = 1, limit = 25 } = {}) {
  const where = []
  const params = []
  if (q) { params.push(`%${q.toLowerCase()}%`); where.push(`(LOWER(e.email) LIKE $${params.length} OR e.ip LIKE $${params.length})`) }
  if (category) { params.push(category); where.push(`e.category = $${params.length}`) }
  if (status === 'blocked') where.push('e.blocked_at IS NOT NULL')
  if (status === 'finished') where.push('e.finished_at IS NOT NULL')
  if (status === 'active') where.push('e.blocked_at IS NULL AND e.finished_at IS NULL')
  params.push(limit, (page - 1) * limit)
  const { rows } = await query(
    `SELECT e.id, e.email, e.category, e.country, e.ip, e.created_at, e.finished_at, e.blocked_at,
            (SELECT COUNT(*) FROM giveaway_spins s WHERE s.entrant_id = e.id AND NOT s.is_preview)::int AS spins,
            (SELECT COUNT(*) FROM giveaway_wins w WHERE w.entrant_id = e.id AND NOT w.is_preview)::int AS wins,
            (SELECT COALESCE(SUM(s.entries), 0) FROM giveaway_spins s WHERE s.entrant_id = e.id AND NOT s.is_preview)::int AS entries,
            (SELECT COUNT(*) FROM giveaway_entrants e2 WHERE e2.ip = e.ip)::int AS same_ip,
            (SELECT u.username FROM giveaway_wins w JOIN users u ON u.id = w.claimed_by
              WHERE w.entrant_id = e.id LIMIT 1) AS pulse_username,
            COUNT(*) OVER()::int AS total
     FROM giveaway_entrants e
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY e.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )
  return { entrants: rows.map(({ total: _t, ...r }) => r), total: rows[0]?.total || 0 }
}

export async function setGiveawayEntrantBlocked(id, blocked) {
  const { rows } = await query(
    `UPDATE giveaway_entrants SET blocked_at = ${blocked ? 'COALESCE(blocked_at, NOW())' : 'NULL'}
     WHERE id = $1 RETURNING id, blocked_at`,
    [id]
  )
  return rows[0] || null
}

export async function listGiveawayWins({ q = '', status = '', prize = '', tests = false, page = 1, limit = 25 } = {}) {
  const where = ['w.is_preview = $1']
  const params = [tests]
  if (q) {
    params.push(`%${q.toLowerCase()}%`)
    const n = params.length
    where.push(`(LOWER(w.code) LIKE $${n} OR LOWER(e.email) LIKE $${n} OR LOWER(u.username) LIKE $${n} OR LOWER(u.full_name) LIKE $${n})`)
  }
  if (prize) { params.push(prize); where.push(`w.prize_key = $${params.length}`) }
  if (status === 'unclaimed') where.push('w.claimed_at IS NULL')
  if (status === 'to_deliver') where.push(`w.claimed_at IS NOT NULL AND w.fulfilled_at IS NULL AND NOT ${AUTO_DELIVERED}`)
  if (status === 'delivered') where.push(`(w.fulfilled_at IS NOT NULL OR (w.claimed_at IS NOT NULL AND ${AUTO_DELIVERED}))`)
  params.push(limit, (page - 1) * limit)
  const { rows } = await query(
    `SELECT w.id, w.code, to_char(w.won_day, 'YYYY-MM-DD') AS won_day, w.claimed_at, w.wallet_address,
            w.fulfilled_at, w.fulfilled_by, w.admin_note, w.conversation_id,
            p.key AS prize_key, p.name AS prize_name, p.prize_group, ${AUTO_DELIVERED} AS auto_delivered,
            e.id AS entrant_id, e.email AS entrant_email, e.blocked_at AS entrant_blocked_at,
            u.id AS user_id, u.username, u.full_name, u.email AS user_email,
            COUNT(*) OVER()::int AS total
     FROM giveaway_wins w
     JOIN giveaway_prizes p ON p.key = w.prize_key
     JOIN giveaway_entrants e ON e.id = w.entrant_id
     LEFT JOIN users u ON u.id = w.claimed_by
     WHERE ${where.join(' AND ')}
     ORDER BY w.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )
  return { wins: rows.map(({ total: _t, ...r }) => r), total: rows[0]?.total || 0 }
}

// Delivered (or undone), and the admin's note. Pulse Pro prizes need no delivery and are refused.
export async function updateGiveawayWin(id, { delivered, note }, adminEmail) {
  const sets = []
  const params = [id]
  if (delivered !== undefined) {
    if (delivered) { params.push(adminEmail); sets.push(`fulfilled_at = COALESCE(w.fulfilled_at, NOW()), fulfilled_by = COALESCE(w.fulfilled_by, $${params.length})`) }
    else sets.push('fulfilled_at = NULL, fulfilled_by = NULL')
  }
  if (note !== undefined) { params.push(note); sets.push(`admin_note = $${params.length}`) }
  if (!sets.length) return null
  const { rows } = await query(
    `UPDATE giveaway_wins w SET ${sets.join(', ')}
     FROM giveaway_prizes p
     WHERE w.id = $1 AND p.key = w.prize_key ${delivered ? `AND w.claimed_at IS NOT NULL AND NOT ${AUTO_DELIVERED}` : ''}
     RETURNING w.id, w.fulfilled_at, w.fulfilled_by, w.admin_note`,
    params
  )
  return rows[0] || null
}

// Daily and total limits (null = no limit) and on/off. Chances are not editable here: they are
// published on the page and in the terms.
export async function updateGiveawayPrize(key, { daily_limit, total_limit, active }) {
  const sets = []
  const params = [key]
  if (daily_limit !== undefined) { params.push(daily_limit); sets.push(`daily_limit = $${params.length}`) }
  if (total_limit !== undefined) { params.push(total_limit); sets.push(`total_limit = $${params.length}`) }
  if (active !== undefined) { params.push(active); sets.push(`active = $${params.length}`) }
  if (!sets.length) return null
  const { rows } = await query(
    `UPDATE giveaway_prizes SET ${sets.join(', ')}, updated_at = NOW() WHERE key = $1
     RETURNING key, daily_limit, total_limit, active`,
    params
  )
  return rows[0] || null
}

// Everything, for the CSV downloads.
export async function exportGiveawayEntrants() {
  const { rows } = await query(
    `SELECT e.email, e.category, e.country, e.ip, e.created_at, e.finished_at, e.blocked_at,
            (SELECT COUNT(*) FROM giveaway_spins s WHERE s.entrant_id = e.id AND NOT s.is_preview)::int AS spins,
            (SELECT COUNT(*) FROM giveaway_wins w WHERE w.entrant_id = e.id AND NOT w.is_preview)::int AS wins,
            (SELECT COALESCE(SUM(s.entries), 0) FROM giveaway_spins s WHERE s.entrant_id = e.id AND NOT s.is_preview)::int AS draw_entries
     FROM giveaway_entrants e ORDER BY e.created_at`
  )
  return rows
}

export async function exportGiveawayWins(tests = false) {
  const { rows } = await query(
    `SELECT w.code, p.name AS prize, to_char(w.won_day, 'YYYY-MM-DD') AS won_day, e.email AS entrant_email,
            w.claimed_at, u.username AS pulse_username, u.full_name AS pulse_name, w.wallet_address,
            CASE WHEN w.fulfilled_at IS NOT NULL OR (w.claimed_at IS NOT NULL AND ${AUTO_DELIVERED}) THEN 'yes' ELSE 'no' END AS delivered,
            w.fulfilled_at, w.fulfilled_by, w.admin_note
     FROM giveaway_wins w
     JOIN giveaway_prizes p ON p.key = w.prize_key
     JOIN giveaway_entrants e ON e.id = w.entrant_id
     LEFT JOIN users u ON u.id = w.claimed_by
     WHERE w.is_preview = $1
     ORDER BY w.created_at`,
    [tests]
  )
  return rows
}

// For the admin user page: giveaway prizes this Pulse account claimed.
export async function listUserGiveawayWins(userId) {
  const { rows } = await query(
    `SELECT w.code, p.name AS prize_name, w.claimed_at, w.is_preview
     FROM giveaway_wins w JOIN giveaway_prizes p ON p.key = w.prize_key
     WHERE w.claimed_by = $1 ORDER BY w.claimed_at DESC`,
    [userId]
  )
  return rows
}
