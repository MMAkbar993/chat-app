import { query } from '../../config/database.js'

// Every prize with how many have gone, in total and on `day`, for the page's prize list and
// its "Limit Reached" labels.
export async function listPrizesWithStock(day) {
  const { rows } = await query(
    `SELECT p.key, p.name, p.prize_group, p.chance, p.total_limit, p.daily_limit, p.ends_game,
            p.needs_wallet, p.active,
            COUNT(w.id)::int AS won_total,
            COUNT(w.id) FILTER (WHERE w.won_day = $1)::int AS won_today
     FROM giveaway_prizes p
     LEFT JOIN giveaway_wins w ON w.prize_key = p.key
     GROUP BY p.key
     ORDER BY p.sort_order, p.key`,
    [day]
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

export async function listEntrantSpins(entrantId) {
  const { rows } = await query(
    `SELECT to_char(spin_day, 'YYYY-MM-DD') AS day, outcome, drawn_prize
     FROM giveaway_spins WHERE entrant_id = $1 ORDER BY spin_day`,
    [entrantId]
  )
  return rows
}

export async function listEntrantWins(entrantId) {
  const { rows } = await query(
    `SELECT w.code, w.prize_key, to_char(w.won_day, 'YYYY-MM-DD') AS day, w.claimed_at,
            p.name, p.prize_group, p.ends_game, p.needs_wallet
     FROM giveaway_wins w JOIN giveaway_prizes p ON p.key = w.prize_key
     WHERE w.entrant_id = $1 ORDER BY w.created_at`,
    [entrantId]
  )
  return rows
}
