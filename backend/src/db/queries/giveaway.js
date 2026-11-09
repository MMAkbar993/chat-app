import { query } from '../../config/database.js'

// Every prize with how many have gone, in total and on `day`, for the page's prize list and
// its "Limit Reached" labels. preview: count preview mode wins instead of real ones.
export async function listPrizesWithStock(day, preview = false) {
  const { rows } = await query(
    `SELECT p.key, p.name, p.prize_group, p.chance, p.total_limit, p.daily_limit, p.ends_game,
            p.needs_wallet, p.active,
            COUNT(w.id)::int AS won_total,
            COUNT(w.id) FILTER (WHERE w.won_day = $1)::int AS won_today
     FROM giveaway_prizes p
     LEFT JOIN giveaway_wins w ON w.prize_key = p.key AND w.is_preview = $2
     GROUP BY p.key
     ORDER BY p.sort_order, p.key`,
    [day, preview]
  )
  return rows
}

export async function findEntrantById(id) {
  const { rows } = await query(
    `SELECT id, email, category, finished_at, blocked_at, created_at FROM giveaway_entrants WHERE id = $1`,
    [id]
  )
  return rows[0] || null
}

export async function listEntrantSpins(entrantId, preview = false) {
  const { rows } = await query(
    `SELECT to_char(spin_day, 'YYYY-MM-DD') AS day, outcome, drawn_prize
     FROM giveaway_spins WHERE entrant_id = $1 AND is_preview = $2 ORDER BY spin_day`,
    [entrantId, preview]
  )
  return rows
}

export async function listEntrantWins(entrantId, preview = false) {
  const { rows } = await query(
    `SELECT w.code, w.prize_key, to_char(w.won_day, 'YYYY-MM-DD') AS day, w.claimed_at,
            p.name, p.prize_group, p.ends_game, p.needs_wallet
     FROM giveaway_wins w JOIN giveaway_prizes p ON p.key = w.prize_key
     WHERE w.entrant_id = $1 AND w.is_preview = $2 ORDER BY w.created_at`,
    [entrantId, preview]
  )
  return rows
}

// Preview mode: a tester clearing their own test spins and prizes to try again.
export async function deleteEntrantPreviewData(entrantId) {
  await query(`DELETE FROM giveaway_spins WHERE entrant_id = $1 AND is_preview`, [entrantId])
  await query(`DELETE FROM giveaway_wins WHERE entrant_id = $1 AND is_preview`, [entrantId])
}
