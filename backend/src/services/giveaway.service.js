// The Christmas giveaway's rules, decided here on the server and never in the browser.
//
// One spin per entrant per UTC day from GIVEAWAY_START to GIVEAWAY_END. Each spin draws one prize
// by its chance (out of 100,000; the rest is No Prize) with a secure random number. Then:
//   - a prize that has run out, in total or for today, counts as No Prize ("Limit Reached")
//   - a voucher that does not end the game (5%, 10%) and that they already hold counts as No Prize
//   - any other prize is theirs, gets a claim code, and ends their game
// A prize that is switched off (active = false) is left out of the draw, so its chance also
// becomes No Prize.
import { randomInt } from 'crypto'
import { getClient } from '../config/database.js'
import { config } from '../config/env.js'

export const CHANCE_SCALE = 100000

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const START_DAY = DAY_RE.test(process.env.GIVEAWAY_START || '') ? process.env.GIVEAWAY_START : '2026-12-01'
const END_DAY = DAY_RE.test(process.env.GIVEAWAY_END || '') ? process.env.GIVEAWAY_END : '2026-12-25'
const CLAIM_DEADLINE_DAY = DAY_RE.test(process.env.GIVEAWAY_CLAIM_DEADLINE || '') ? process.env.GIVEAWAY_CLAIM_DEADLINE : '2027-01-31'

export const ENTRANT_CATEGORIES = [
  'affiliate_publisher',
  'casino_affiliate_manager',
  'event_organizer',
  'affiliate_network',
  'other',
]

// Today's giveaway day as a UTC date (YYYY-MM-DD). Outside production GIVEAWAY_TODAY can pretend
// it is another day, so the whole of December can be tried before it starts. Production ignores
// it: a forgotten setting there would let people spin on the wrong day.
export function giveawayToday(now = new Date()) {
  const fake = process.env.GIVEAWAY_TODAY
  if (config.nodeEnv !== 'production' && DAY_RE.test(fake || '')) return fake
  return now.toISOString().slice(0, 10)
}

export function giveawayDates() {
  return { start: START_DAY, end: END_DAY, claimDeadline: CLAIM_DEADLINE_DAY }
}

// 'before', 'open' or 'ended'. Dates in YYYY-MM-DD compare correctly as strings.
export function giveawayPhase(day = giveawayToday()) {
  if (day < START_DAY) return 'before'
  if (day > END_DAY) return 'ended'
  return 'open'
}

// When the next spin unlocks: the coming midnight UTC.
export function nextResetAt(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return d.toISOString()
}

// Picks a prize from the list by chance, or null for No Prize. Pure, so the odds can be checked
// with a simulation without a database. roll is 0 to CHANCE_SCALE - 1.
export function drawPrize(prizes, roll = randomInt(0, CHANCE_SCALE)) {
  let edge = 0
  for (const p of prizes) {
    if (!p.active || p.chance <= 0) continue
    edge += p.chance
    if (roll < edge) return p
  }
  return null
}

// Claim codes like XMAS-7K2Q-M9TD. No 0/O, 1/I/L, so they are easy to type from a screenshot.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export function newClaimCode() {
  const part = () => Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]).join('')
  return `XMAS-${part()}-${part()}`
}

function fail(status, message, reason) {
  return Object.assign(new Error(message), { status, reason })
}

// Spins once for this entrant today. Returns { outcome, prize, win, finished } where outcome is
// 'none' | 'prize' | 'duplicate' | 'limit', prize is the drawn prize (null for No Prize) and win
// is { code, prizeKey } when they won something.
//
// Runs in one transaction. The entrant's row is locked first, so two clicks at once spin once;
// the drawn prize's row is locked while its stock is counted, so the last unit of a prize cannot
// go to two people.
export async function spinForEntrant(entrantId, { today = giveawayToday(), roll } = {}) {
  if (giveawayPhase(today) === 'before') throw fail(400, 'The giveaway has not started yet.', 'not_started')
  if (giveawayPhase(today) === 'ended') throw fail(400, 'The giveaway has ended.', 'ended')

  const client = await getClient()
  try {
    await client.query('BEGIN')

    const { rows: [entrant] } = await client.query(
      `SELECT id, finished_at, blocked_at FROM giveaway_entrants WHERE id = $1 FOR UPDATE`,
      [entrantId]
    )
    if (!entrant) throw fail(404, 'Entry not found.', 'no_entrant')
    if (entrant.blocked_at) throw fail(403, 'This entry can no longer take part.', 'blocked')
    if (entrant.finished_at) throw fail(409, 'You have already won your prize. Thanks for playing!', 'finished')

    const { rows: [already] } = await client.query(
      `SELECT 1 FROM giveaway_spins WHERE entrant_id = $1 AND spin_day = $2`,
      [entrantId, today]
    )
    if (already) throw fail(409, 'You have already spun today. Come back tomorrow!', 'spun_today')

    const { rows: prizes } = await client.query(
      `SELECT key, name, prize_group, chance, total_limit, daily_limit, ends_game, needs_wallet, active
       FROM giveaway_prizes ORDER BY sort_order, key`
    )
    const drawn = drawPrize(prizes, roll)

    let outcome = 'none'
    let win = null
    if (drawn) {
      outcome = 'prize'
      if (!drawn.ends_game) {
        const { rows: [held] } = await client.query(
          `SELECT 1 FROM giveaway_wins WHERE entrant_id = $1 AND prize_key = $2`,
          [entrantId, drawn.key]
        )
        if (held) outcome = 'duplicate'
      }
      if (outcome === 'prize' && (drawn.total_limit !== null || drawn.daily_limit !== null)) {
        // Lock this prize while its stock is counted; spins drawing other prizes are not held up.
        await client.query(`SELECT 1 FROM giveaway_prizes WHERE key = $1 FOR UPDATE`, [drawn.key])
        const { rows: [counts] } = await client.query(
          `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE won_day = $2)::int AS today
           FROM giveaway_wins WHERE prize_key = $1`,
          [drawn.key, today]
        )
        if ((drawn.total_limit !== null && counts.total >= drawn.total_limit) ||
            (drawn.daily_limit !== null && counts.today >= drawn.daily_limit)) {
          outcome = 'limit'
        }
      }
      if (outcome === 'prize') {
        win = await insertWin(client, entrantId, drawn.key, today)
      }
    }

    await client.query(
      `INSERT INTO giveaway_spins (entrant_id, spin_day, drawn_prize, outcome, win_id) VALUES ($1, $2, $3, $4, $5)`,
      [entrantId, today, drawn?.key || null, outcome, win?.id || null]
    )

    const finished = Boolean(win && drawn.ends_game)
    if (finished) {
      await client.query(`UPDATE giveaway_entrants SET finished_at = NOW() WHERE id = $1`, [entrantId])
    }

    await client.query('COMMIT')
    return {
      outcome,
      prize: drawn ? publicPrize(drawn) : null,
      win: win ? { code: win.code, prizeKey: drawn.key } : null,
      finished,
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    // Two spins racing past the "already spun" check: the unique (entrant, day) key stops the second.
    if (err.code === '23505' && err.constraint === 'giveaway_spins_entrant_id_spin_day_key') {
      throw fail(409, 'You have already spun today. Come back tomorrow!', 'spun_today')
    }
    throw err
  } finally {
    client.release()
  }
}

// A code clash is about one in a trillion per pair, but retry rather than fail a winning spin.
async function insertWin(client, entrantId, prizeKey, today) {
  for (let attempt = 0; attempt < 5; attempt++) {
    await client.query('SAVEPOINT win_code')
    try {
      const { rows: [row] } = await client.query(
        `INSERT INTO giveaway_wins (entrant_id, prize_key, won_day, code) VALUES ($1, $2, $3, $4) RETURNING id, code`,
        [entrantId, prizeKey, today, newClaimCode()]
      )
      await client.query('RELEASE SAVEPOINT win_code')
      return row
    } catch (err) {
      await client.query('ROLLBACK TO SAVEPOINT win_code')
      if (!(err.code === '23505' && err.constraint === 'giveaway_wins_code_key')) throw err
    }
  }
  throw new Error('Could not create a unique claim code')
}

export function publicPrize(p) {
  return {
    key: p.key,
    name: p.name,
    group: p.prize_group,
    endsGame: p.ends_game,
    needsWallet: p.needs_wallet,
  }
}
