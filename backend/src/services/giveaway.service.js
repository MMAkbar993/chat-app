// The Christmas giveaway's rules, decided here on the server and never in the browser.
//
// One spin per entrant per UTC day from GIVEAWAY_START to GIVEAWAY_END, every day, also after a
// big win (it is an advent calendar: a door to open each day). Each spin draws one prize by its
// chance (out of 100,000; the rest is No Prize) with a secure random number. Then:
//   - a big prize (ends_game = true) when they already won a big prize counts as No Prize
//     ('big_done'): one big prize per person
//   - a small prize (5% and 10% vouchers, 1 and 3 months of Pulse Pro) they already hold counts
//     as No Prize ('duplicate'): each small prize once per person
//   - a prize that has run out, in total or for today, counts as No Prize ("Limit Reached")
//   - a prize with an available_from day (the mega prizes: the last 5 days) counts as No Prize
//     before that day ('not_yet')
//   - "+2 entries" (bonus_entries) is not a prize: it adds entries to the Grand Prize Draw
//   - anything else is theirs and gets a claim code
// Every spin also earns 1 entry into the Grand Prize Draw (giveawayDraw.service.js).
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

// Preview mode: these emails can play before the start, on any day they choose (the page shows
// them a day picker). Their spins and wins are flagged is_preview and counted apart from real
// ones. Empty the list (and run npm run giveaway:reset-preview) before launch.
const PREVIEW_EMAILS = (process.env.GIVEAWAY_PREVIEW_EMAILS || '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)

export function isPreviewEmail(email) {
  return PREVIEW_EMAILS.includes(String(email || '').trim().toLowerCase())
}

// A preview day must be one of the giveaway's days.
export function validPreviewDay(day) {
  return DAY_RE.test(day || '') && day >= START_DAY && day <= END_DAY
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
export function newClaimCode(preview = false) {
  const part = () => Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]).join('')
  return preview ? `XMAS-TEST-${part()}` : `XMAS-${part()}-${part()}`
}

function fail(status, message, reason) {
  return Object.assign(new Error(message), { status, reason })
}

// Spins once for this entrant today. Returns { outcome, prize, win, bigPrize, entriesAdded,
// entries } where outcome is 'none' | 'prize' | 'duplicate' | 'limit' | 'big_done' | 'entries' |
// 'not_yet', prize is the drawn prize (null for No Prize), win is { code, prizeKey } when they
// won something, bigPrize says this win was their big prize, entriesAdded is the draw entries
// this spin gave and entries their total.
//
// Runs in one transaction. The entrant's row is locked first, so two clicks at once spin once;
// the drawn prize's row is locked while its stock is counted, so the last unit of a prize cannot
// go to two people.
// preview: a preview mode spin (see isPreviewEmail). It plays exactly like a real one, but only
// against other preview spins: its own stock counts, its own "already won", its own vouchers.
export async function spinForEntrant(entrantId, { today = giveawayToday(), roll, preview = false } = {}) {
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

    const { rows: [already] } = await client.query(
      `SELECT 1 FROM giveaway_spins WHERE entrant_id = $1 AND spin_day = $2`,
      [entrantId, today]
    )
    if (already) throw fail(409, 'You have already spun today. Come back tomorrow!', 'spun_today')

    const { rows: prizes } = await client.query(
      `SELECT key, name, prize_group, chance, total_limit, daily_limit, ends_game, needs_wallet, active,
              bonus_entries, to_char(available_from, 'YYYY-MM-DD') AS available_from
       FROM giveaway_prizes ORDER BY sort_order, key`
    )
    const drawn = drawPrize(prizes, roll)

    let outcome = 'none'
    let win = null
    let entriesAdded = 1
    if (drawn?.bonus_entries) {
      outcome = 'entries'
      entriesAdded += drawn.bonus_entries
    } else if (drawn && drawn.available_from && today < drawn.available_from) {
      outcome = 'not_yet'
    } else if (drawn) {
      outcome = 'prize'
      if (drawn.ends_game) {
        // One big prize per person (current prize settings, so a prize changed to small later
        // does not count as their big one).
        const { rows: [big] } = await client.query(
          `SELECT 1 FROM giveaway_wins w JOIN giveaway_prizes p ON p.key = w.prize_key
           WHERE w.entrant_id = $1 AND w.is_preview = $2 AND p.ends_game LIMIT 1`,
          [entrantId, preview]
        )
        if (big) outcome = 'big_done'
      } else {
        const { rows: [held] } = await client.query(
          `SELECT 1 FROM giveaway_wins WHERE entrant_id = $1 AND prize_key = $2 AND is_preview = $3`,
          [entrantId, drawn.key, preview]
        )
        if (held) outcome = 'duplicate'
      }
      if (outcome === 'prize' && (drawn.total_limit !== null || drawn.daily_limit !== null)) {
        // Lock this prize while its stock is counted; spins drawing other prizes are not held up.
        await client.query(`SELECT 1 FROM giveaway_prizes WHERE key = $1 FOR UPDATE`, [drawn.key])
        const { rows: [counts] } = await client.query(
          `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE won_day = $2)::int AS today
           FROM giveaway_wins WHERE prize_key = $1 AND is_preview = $3`,
          [drawn.key, today, preview]
        )
        if ((drawn.total_limit !== null && counts.total >= drawn.total_limit) ||
            (drawn.daily_limit !== null && counts.today >= drawn.daily_limit)) {
          outcome = 'limit'
        }
      }
      if (outcome === 'prize') {
        win = await insertWin(client, entrantId, drawn.key, today, preview)
      }
    }

    await client.query(
      `INSERT INTO giveaway_spins (entrant_id, spin_day, drawn_prize, outcome, win_id, is_preview, entries) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [entrantId, today, drawn?.key || null, outcome, win?.id || null, preview, entriesAdded]
    )
    const { rows: [total] } = await client.query(
      `SELECT COALESCE(SUM(entries), 0)::int AS entries FROM giveaway_spins WHERE entrant_id = $1 AND is_preview = $2`,
      [entrantId, preview]
    )

    // finished_at now only records when they won their big prize (the admin panel shows it).
    const bigPrize = Boolean(win && drawn.ends_game)
    if (bigPrize && !preview) {
      await client.query(`UPDATE giveaway_entrants SET finished_at = COALESCE(finished_at, NOW()) WHERE id = $1`, [entrantId])
    }

    await client.query('COMMIT')
    return {
      outcome,
      prize: drawn ? publicPrize(drawn) : null,
      win: win ? { code: win.code, prizeKey: drawn.key } : null,
      bigPrize,
      entriesAdded,
      entries: total.entries,
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
async function insertWin(client, entrantId, prizeKey, today, preview) {
  for (let attempt = 0; attempt < 5; attempt++) {
    await client.query('SAVEPOINT win_code')
    try {
      const { rows: [row] } = await client.query(
        `INSERT INTO giveaway_wins (entrant_id, prize_key, won_day, code, is_preview) VALUES ($1, $2, $3, $4, $5) RETURNING id, code`,
        [entrantId, prizeKey, today, newClaimCode(preview), preview]
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
    bonusEntries: p.bonus_entries || null,
    availableFrom: p.available_from || null,
  }
}
