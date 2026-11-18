// The Christmas giveaway's Grand Prize Draw: one winner of Free Pulse Pro for Life, drawn after the
// last door closes (25 December, UTC). Every spin earned 1 entry, the "+2 entries" slice 2 more
// (giveaway_spins.entries); each entry is one equal chance, picked with a secure random number.
//
// It runs by itself an hour or less after the giveaway ends (runAutomaticDraw, from index.js), or
// from the admin panel. Preview mode has its own draw over testers' preview spins, which an admin
// can run any time to try it out. A draw can be voided (say the winner was cheating) if its prize
// has not been claimed; that person is then left out of the next draw.
import { randomInt } from 'crypto'
import { getClient, query } from '../config/database.js'
import { giveawayToday, giveawayDates, giveawayPhase, newClaimCode } from './giveaway.service.js'
import { sendGiveawayDrawWinnerEmail } from '../config/email.js'

export const DRAW_PRIZE_KEY = 'pro_lifetime'

function fail(status, message, reason) {
  return Object.assign(new Error(message), { status, reason })
}

// When the draw happens: midnight UTC after the last giveaway day.
export function drawAt() {
  const end = new Date(`${giveawayDates().end}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() + 1)
  return end.toISOString()
}

export async function entrantEntries(entrantId, preview = false) {
  const { rows: [r] } = await query(
    `SELECT COALESCE(SUM(entries), 0)::int AS entries FROM giveaway_spins WHERE entrant_id = $1 AND is_preview = $2`,
    [entrantId, preview]
  )
  return r.entries
}

// The live draw with its winner, or null.
export async function getLiveDraw(preview = false) {
  const { rows: [d] } = await query(
    `SELECT d.id, d.entrant_id, d.winner_entries, d.total_entries, d.entrant_count, d.drawn_by, d.created_at,
            e.email AS winner_email, w.code, w.claimed_at, p.name AS prize_name,
            u.username AS claimed_username
     FROM giveaway_draws d
     JOIN giveaway_entrants e ON e.id = d.entrant_id
     JOIN giveaway_prizes p ON p.key = d.prize_key
     LEFT JOIN giveaway_wins w ON w.id = d.win_id
     LEFT JOIN users u ON u.id = w.claimed_by
     WHERE d.is_preview = $1 AND d.voided_at IS NULL`,
    [preview]
  )
  return d || null
}

export async function listVoidedDraws(preview = false) {
  const { rows } = await query(
    `SELECT d.id, e.email AS winner_email, d.created_at, d.voided_at, d.voided_by, d.void_reason
     FROM giveaway_draws d JOIN giveaway_entrants e ON e.id = d.entrant_id
     WHERE d.is_preview = $1 AND d.voided_at IS NOT NULL ORDER BY d.voided_at DESC`,
    [preview]
  )
  return rows
}

// Everyone's entries, as the draw would see them (for the admin panel and the draw).
const POOL_SQL = `
  SELECT s.entrant_id, SUM(s.entries)::int AS entries
  FROM giveaway_spins s
  JOIN giveaway_entrants e ON e.id = s.entrant_id
  WHERE s.is_preview = $1
    AND e.blocked_at IS NULL
    AND s.entrant_id NOT IN (SELECT entrant_id FROM giveaway_draws WHERE is_preview = $1 AND voided_at IS NOT NULL)
    AND s.entrant_id NOT IN (SELECT entrant_id FROM giveaway_wins WHERE prize_key = $2 AND is_preview = $1)
  GROUP BY s.entrant_id
  ORDER BY s.entrant_id`

export async function drawPoolSummary(preview = false) {
  const { rows: [r] } = await query(
    `SELECT COUNT(*)::int AS entrants, COALESCE(SUM(entries), 0)::int AS entries FROM (${POOL_SQL}) pool`,
    [preview, DRAW_PRIZE_KEY]
  )
  return r
}

// Picks the winner from [{ entrant_id, entries }] for a roll from 0 to total - 1. Pure, so the
// weighting can be checked without a database.
export function pickWinner(pool, roll) {
  let edge = 0
  for (const p of pool) {
    edge += p.entries
    if (roll < edge) return p
  }
  return null
}

// Runs the draw. by: 'automatic' or the admin's email. roll: tests only.
export async function runDraw({ preview = false, by, roll } = {}) {
  if (!preview && giveawayPhase(giveawayToday()) !== 'ended') {
    throw fail(400, 'The Grand Prize Draw can only run after the last door has closed.', 'too_early')
  }
  const client = await getClient()
  let result
  try {
    await client.query('BEGIN')
    // One draw at a time, for real and for preview each.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`giveaway_draw_${preview}`])
    const { rows: [live] } = await client.query(
      'SELECT 1 FROM giveaway_draws WHERE is_preview = $1 AND voided_at IS NULL', [preview]
    )
    if (live) throw fail(409, 'The Grand Prize has already been drawn.', 'already_drawn')

    const { rows: pool } = await client.query(POOL_SQL, [preview, DRAW_PRIZE_KEY])
    const total = pool.reduce((sum, p) => sum + p.entries, 0)
    if (!total) throw fail(400, 'There are no entries to draw from.', 'no_entries')
    const r = roll ?? randomInt(0, total)
    const winner = pickWinner(pool, r)

    const { rows: [e] } = await client.query('SELECT email FROM giveaway_entrants WHERE id = $1', [winner.entrant_id])
    const wonDay = preview ? giveawayToday() : giveawayDates().end
    let win
    for (let attempt = 0; attempt < 5 && !win; attempt++) {
      await client.query('SAVEPOINT draw_code')
      try {
        const { rows: [row] } = await client.query(
          `INSERT INTO giveaway_wins (entrant_id, prize_key, won_day, code, is_preview) VALUES ($1, $2, $3, $4, $5) RETURNING id, code`,
          [winner.entrant_id, DRAW_PRIZE_KEY, wonDay, newClaimCode(preview), preview]
        )
        await client.query('RELEASE SAVEPOINT draw_code')
        win = row
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT draw_code')
        if (!(err.code === '23505' && err.constraint === 'giveaway_wins_code_key')) throw err
      }
    }
    if (!win) throw new Error('Could not create a unique claim code')

    await client.query(
      `INSERT INTO giveaway_draws (is_preview, prize_key, entrant_id, win_id, winner_entries, total_entries, entrant_count, roll, drawn_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [preview, DRAW_PRIZE_KEY, winner.entrant_id, win.id, winner.entries, total, pool.length, r, by]
    )
    await client.query('COMMIT')
    result = { email: e.email, code: win.code, winnerEntries: winner.entries, totalEntries: total, entrants: pool.length }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }

  // The prize is drawn even if the email cannot go out; the winner also sees it on the page.
  try {
    const { rows: [p] } = await query('SELECT name FROM giveaway_prizes WHERE key = $1', [DRAW_PRIZE_KEY])
    await sendGiveawayDrawWinnerEmail(result.email, { code: result.code, prizeName: p.name, claimDeadline: giveawayDates().claimDeadline })
  } catch (err) {
    console.error('Grand Prize Draw: could not email the winner:', err.message)
  }
  return result
}

// Voids the live draw (its prize must not be claimed yet): the prize code is removed and the
// winner is left out of the next draw.
export async function voidDraw({ preview = false, by, reason }) {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const { rows: [d] } = await client.query(
      `SELECT d.id, d.win_id, w.claimed_at FROM giveaway_draws d LEFT JOIN giveaway_wins w ON w.id = d.win_id
       WHERE d.is_preview = $1 AND d.voided_at IS NULL FOR UPDATE OF d`,
      [preview]
    )
    if (!d) throw fail(404, 'There is no draw to void.', 'no_draw')
    if (d.claimed_at) throw fail(409, 'This prize has already been claimed, so the draw cannot be voided.', 'claimed')
    await client.query(
      'UPDATE giveaway_draws SET voided_at = NOW(), voided_by = $2, void_reason = $3, win_id = NULL WHERE id = $1',
      [d.id, by, reason]
    )
    if (d.win_id) await client.query('DELETE FROM giveaway_wins WHERE id = $1', [d.win_id])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// From index.js every hour: once the giveaway has ended, draw by itself if nobody has drawn yet.
// After a voided draw it waits for an admin to redraw.
export async function runAutomaticDraw() {
  if (giveawayPhase(giveawayToday()) !== 'ended') return
  const { rows: [any] } = await query('SELECT 1 FROM giveaway_draws WHERE NOT is_preview LIMIT 1')
  if (any) return
  try {
    const r = await runDraw({ by: 'automatic' })
    console.log(`Grand Prize Draw: winner drawn (${r.winnerEntries} of ${r.totalEntries} entries, ${r.entrants} people).`)
  } catch (err) {
    if (err.reason !== 'already_drawn' && err.reason !== 'no_entries') throw err
  }
}
