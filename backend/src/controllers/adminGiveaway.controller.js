// Admin panel for the Christmas giveaway (all routes sit behind adminAuthMiddleware).
import { giveawayToday, giveawayDates, giveawayPhase, isPreviewEmail, ENTRANT_CATEGORIES } from '../services/giveaway.service.js'
import { listPrizesWithStock } from '../db/queries/giveaway.js'
import {
  giveawayOverview, listGiveawayEntrants, setGiveawayEntrantBlocked, listGiveawayWins,
  updateGiveawayWin, updateGiveawayPrize, exportGiveawayEntrants, exportGiveawayWins,
} from '../db/queries/adminGiveaway.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const WIN_STATUSES = ['unclaimed', 'to_deliver', 'delivered']
const ENTRANT_STATUSES = ['active', 'finished', 'blocked']

const isTests = (req) => req.query.tests === '1' || req.query.tests === 'true'
const pageOf = (req) => Math.max(1, Math.min(10000, parseInt(req.query.page, 10) || 1))
const searchOf = (req) => String(req.query.q || '').trim().slice(0, 100)

export async function adminGiveawayOverview(req, res, next) {
  try {
    const today = giveawayToday()
    const tests = isTests(req)
    const [numbers, prizes] = await Promise.all([giveawayOverview(today, tests), listPrizesWithStock(today, tests)])
    res.json({
      today,
      phase: giveawayPhase(today),
      dates: giveawayDates(),
      tests,
      numbers,
      prizes: prizes.map((p) => ({ ...p, chance: p.chance / 1000 })),
    })
  } catch (err) { next(err) }
}

export async function adminGiveawayEntrants(req, res, next) {
  try {
    const category = ENTRANT_CATEGORIES.includes(req.query.category) ? req.query.category : ''
    const status = ENTRANT_STATUSES.includes(req.query.status) ? req.query.status : ''
    const data = await listGiveawayEntrants({ q: searchOf(req), category, status, page: pageOf(req) })
    res.json({ ...data, entrants: data.entrants.map((e) => ({ ...e, tester: isPreviewEmail(e.email) })) })
  } catch (err) { next(err) }
}

export async function adminGiveawayBlockEntrant(req, res, next) {
  try {
    if (!UUID_RE.test(req.params.id)) return res.status(404).json({ error: 'Entry not found' })
    const blocked = req.body?.blocked !== false
    const row = await setGiveawayEntrantBlocked(req.params.id, blocked)
    if (!row) return res.status(404).json({ error: 'Entry not found' })
    res.json({ entrant: row })
  } catch (err) { next(err) }
}

export async function adminGiveawayWins(req, res, next) {
  try {
    const status = WIN_STATUSES.includes(req.query.status) ? req.query.status : ''
    const prize = /^[a-z0-9_]{1,40}$/.test(req.query.prize || '') ? req.query.prize : ''
    res.json(await listGiveawayWins({ q: searchOf(req), status, prize, tests: isTests(req), page: pageOf(req) }))
  } catch (err) { next(err) }
}

export async function adminGiveawayUpdateWin(req, res, next) {
  try {
    if (!UUID_RE.test(req.params.id)) return res.status(404).json({ error: 'Prize not found' })
    const { delivered, note } = req.body || {}
    if (delivered !== undefined && typeof delivered !== 'boolean') return res.status(400).json({ error: 'delivered must be true or false' })
    if (note !== undefined && (typeof note !== 'string' || note.length > 2000)) return res.status(400).json({ error: 'The note can be up to 2000 characters' })
    const row = await updateGiveawayWin(req.params.id, { delivered, note: note === undefined ? undefined : note.trim() || null }, req.admin.email)
    if (!row) return res.status(400).json({ error: 'Only a claimed prize that is not Pulse Pro can be marked delivered' })
    res.json({ win: row })
  } catch (err) { next(err) }
}

// A limit is a whole number from 0 up, or null for no limit.
function limitOf(v) {
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 && n <= 1000000 ? n : NaN
}

export async function adminGiveawayUpdatePrize(req, res, next) {
  try {
    if (!/^[a-z0-9_]{1,40}$/.test(req.params.key)) return res.status(404).json({ error: 'Prize not found' })
    const daily_limit = limitOf(req.body?.daily_limit)
    const total_limit = limitOf(req.body?.total_limit)
    const { active } = req.body || {}
    if (Number.isNaN(daily_limit) || Number.isNaN(total_limit)) return res.status(400).json({ error: 'A limit must be a whole number, or empty for no limit' })
    if (active !== undefined && typeof active !== 'boolean') return res.status(400).json({ error: 'active must be true or false' })
    const row = await updateGiveawayPrize(req.params.key, { daily_limit, total_limit, active })
    if (!row) return res.status(404).json({ error: 'Prize not found' })
    res.json({ prize: row })
  } catch (err) { next(err) }
}

// CSV, with cells that a spreadsheet would run as a formula (=, +, -, @) made into plain text.
function toCsv(rows) {
  if (!rows.length) return ''
  const cols = Object.keys(rows[0])
  const cell = (v) => {
    if (v === null || v === undefined) return ''
    let s = v instanceof Date ? v.toISOString() : String(v)
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\r\n')
}

function sendCsv(res, name, rows) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${name}-${giveawayToday()}.csv"`)
  res.send(`﻿${toCsv(rows)}`)
}

export async function adminGiveawayExportEntrants(req, res, next) {
  try { sendCsv(res, 'giveaway-entries', await exportGiveawayEntrants()) } catch (err) { next(err) }
}

export async function adminGiveawayExportWins(req, res, next) {
  try { sendCsv(res, isTests(req) ? 'giveaway-test-winners' : 'giveaway-winners', await exportGiveawayWins(isTests(req))) } catch (err) { next(err) }
}
