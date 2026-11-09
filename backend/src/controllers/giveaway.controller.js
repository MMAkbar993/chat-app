import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import {
  CHANCE_SCALE, giveawayToday, giveawayDates, giveawayPhase, nextResetAt, spinForEntrant, publicPrize,
  isPreviewEmail, validPreviewDay,
} from '../services/giveaway.service.js'
import { listPrizesWithStock, findEntrantById, listEntrantSpins, listEntrantWins, deleteEntrantPreviewData } from '../db/queries/giveaway.js'
import { startJoin, verifyJoin, requestInfo, checkCountry } from '../services/giveawayJoin.service.js'
import { previewCode, claimCode } from '../services/giveawayClaim.service.js'

// Giveaway entrants are not Pulse members: they sign in to the giveaway with an email code
// (Phase 2) and get this token, which only the giveaway routes accept. purpose stops a Pulse
// login token being used here and this one being used anywhere else.
const TOKEN_PURPOSE = 'giveaway'
export function signEntrantToken(entrantId) {
  return jwt.sign({ gid: entrantId, purpose: TOKEN_PURPOSE }, config.jwtSecret, { expiresIn: '60d' })
}

function entrantIdFrom(req) {
  const header = req.headers['authorization']
  if (!header?.startsWith('Bearer ')) return null
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret)
    return payload.purpose === TOKEN_PURPOSE && typeof payload.gid === 'string' ? payload.gid : null
  } catch {
    return null
  }
}

export async function giveawayEntrantAuth(req, res, next) {
  const id = entrantIdFrom(req)
  if (!id) return res.status(401).json({ error: 'Please join the giveaway first.' })
  try {
    const entrant = await findEntrantById(id)
    if (!entrant) return res.status(401).json({ error: 'Please join the giveaway first.' })
    req.entrant = entrant
    next()
  } catch (err) {
    next(err)
  }
}

function stockLabel(p) {
  if (!p.active) return 'unavailable'
  if (p.total_limit !== null && p.won_total >= p.total_limit) return 'limit_reached'
  if (p.daily_limit !== null && p.won_today >= p.daily_limit) return 'limit_reached_today'
  return 'available'
}

// Everything the giveaway page needs: the dates, today's state, the prize list with odds and
// stock, and, when signed in, this person's spins and prizes. Public, so the page can show the
// prizes before anyone joins.
// The day a preview tester is playing: the one they picked, else today if it is a giveaway day,
// else the first day.
function previewDay(requested) {
  if (validPreviewDay(requested)) return requested
  const today = giveawayToday()
  return validPreviewDay(today) ? today : giveawayDates().start
}

export async function getGiveawayState(req, res, next) {
  try {
    const id = entrantIdFrom(req)
    const entrant = id ? await findEntrantById(id) : null
    const preview = Boolean(entrant && isPreviewEmail(entrant.email))
    const today = preview ? previewDay(req.query.day) : giveawayToday()

    const prizes = await listPrizesWithStock(today, preview)
    const used = prizes.filter((p) => p.active).reduce((sum, p) => sum + p.chance, 0)

    let me = null
    if (entrant) {
      const [spins, wins] = await Promise.all([listEntrantSpins(entrant.id, preview), listEntrantWins(entrant.id, preview)])
      me = {
        email: entrant.email,
        category: entrant.category,
        preview,
        finished: preview ? wins.some((w) => w.ends_game) : Boolean(entrant.finished_at),
        blocked: Boolean(entrant.blocked_at),
        spunToday: spins.some((s) => s.day === today),
        spins: spins.map((s) => ({ day: s.day, outcome: s.outcome })),
        wins: wins.map((w) => ({
          code: w.code, prizeKey: w.prize_key, name: w.name, group: w.prize_group, day: w.day,
          endsGame: w.ends_game, needsWallet: w.needs_wallet, claimed: Boolean(w.claimed_at),
        })),
      }
    }

    res.json({
      ...giveawayDates(),
      today,
      phase: giveawayPhase(today),
      nextResetAt: preview ? null : nextResetAt(),
      preview,
      noPrizeChance: Math.max(0, CHANCE_SCALE - used) / (CHANCE_SCALE / 100),
      prizes: prizes.map((p) => ({
        ...publicPrize(p),
        chance: (p.active ? p.chance : 0) / (CHANCE_SCALE / 100), // as a percentage
        stock: stockLabel(p),
      })),
      me,
    })
  } catch (err) {
    next(err)
  }
}

export async function spinGiveaway(req, res, next) {
  try {
    checkCountry(requestInfo(req).country)
    const preview = isPreviewEmail(req.entrant.email)
    const result = preview
      ? await spinForEntrant(req.entrant.id, { preview: true, today: previewDay(req.body?.day) })
      : await spinForEntrant(req.entrant.id)
    res.json(result)
  } catch (err) {
    if (err.reason) return res.status(err.status).json({ error: err.message, reason: err.reason })
    next(err)
  }
}

// Join, or sign back in: step 1 emails a code.
export async function joinStart(req, res, next) {
  try {
    const { email, category, turnstileToken, deviceId } = req.body || {}
    res.json(await startJoin({ email, category, turnstileToken, deviceId }, req))
  } catch (err) {
    if (err.reason) return res.status(err.status).json({ error: err.message, reason: err.reason })
    next(err)
  }
}

// Step 2: the code from the email. Answers with the giveaway token the page keeps.
export async function joinVerify(req, res, next) {
  try {
    const { email, code, category, deviceId } = req.body || {}
    const { entrantId, isNew } = await verifyJoin({ email, code, category, deviceId }, req)
    res.json({ token: signEntrantToken(entrantId), isNew })
  } catch (err) {
    if (err.reason) return res.status(err.status).json({ error: err.message, reason: err.reason })
    next(err)
  }
}

// Claiming on Pulse. The preview is public (the claim page shows the prize before sign in);
// claiming needs a signed in, verified Pulse account.
export async function claimPreview(req, res, next) {
  try {
    res.json(await previewCode(req.params.code))
  } catch (err) {
    if (err.reason) return res.status(err.status).json({ error: err.message, reason: err.reason })
    next(err)
  }
}

export async function claimPrize(req, res, next) {
  try {
    const { code, walletAddress } = req.body || {}
    res.json(await claimCode(req.user, code, walletAddress, requestInfo(req).country))
  } catch (err) {
    if (err.reason) return res.status(err.status).json({ error: err.message, reason: err.reason })
    next(err)
  }
}

// Preview mode only: a tester wipes their own test spins and prizes to play again from scratch.
export async function previewReset(req, res, next) {
  try {
    if (!isPreviewEmail(req.entrant.email)) return res.status(403).json({ error: 'Only for preview testers.' })
    await deleteEntrantPreviewData(req.entrant.id)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
