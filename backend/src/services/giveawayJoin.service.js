// Joining the Christmas giveaway, and signing back in to it on another device: the same two steps.
//   1. startJoin: email (+ category for a new entry) and the Turnstile check → we email a 6 digit code
//   2. verifyJoin: email + code → the entry is created if new, and a giveaway token comes back
//
// What stops one person opening many entries (the prizes are only worth anything if this holds):
//   - a code to a real inbox, with throwaway inbox domains refused and the domain needing a mail server
//   - Cloudflare Turnstile, so a script cannot fill in the form
//   - at most GIVEAWAY_MAX_PER_IP entries per IP and GIVEAWAY_MAX_PER_DEVICE per browser
//   - blocked countries, by Cloudflare's CF-IPCountry header (Cloudflare's own country rule is the
//     first line; this is the backup if a request reaches the server some other way)
//   - and, later, the ID check on Pulse before any prize is handed over.
import crypto from 'crypto'
import dns from 'dns'
import axios from 'axios'
import { query } from '../config/database.js'
import { config } from '../config/env.js'
import { sendGiveawayCodeEmail } from '../config/email.js'
import { isDisposableEmail } from '../utils/disposableEmails.js'
import { ENTRANT_CATEGORIES } from './giveaway.service.js'

const CODE_TTL_MINUTES = 15
const CODE_MAX_ATTEMPTS = 5
const RESEND_COOLDOWN_SECONDS = 60
const MAX_CODES_PER_HOUR = 5
const MAX_PER_IP = parseInt(process.env.GIVEAWAY_MAX_PER_IP || '3', 10)
const MAX_PER_DEVICE = parseInt(process.env.GIVEAWAY_MAX_PER_DEVICE || '2', 10)

// North Korea, Iran, Cuba, Belarus, Syria, India, mainland China, and T1 (Tor, as Cloudflare
// reports it). Crimea, Donetsk and Luhansk cannot be told apart from the rest of Ukraine by IP;
// the terms exclude them and the ID check at claim time enforces it.
const BLOCKED_COUNTRIES = (process.env.GIVEAWAY_BLOCKED_COUNTRIES || 'KP,IR,CU,BY,SY,IN,CN,T1')
  .split(',').map((c) => c.trim().toUpperCase()).filter(Boolean)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const DEVICE_RE = /^[A-Za-z0-9_-]{16,64}$/

function fail(status, message, reason) {
  return Object.assign(new Error(message), { status, reason })
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function hashCode(email, code) {
  return crypto.createHmac('sha256', config.jwtSecret).update(`${email}:${code}`).digest('hex')
}

function sameHash(a, b) {
  const x = Buffer.from(a, 'hex'), y = Buffer.from(b, 'hex')
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

export function requestInfo(req, deviceId) {
  const country = String(req.headers['cf-ipcountry'] || '').toUpperCase().slice(0, 2) || null
  return {
    ip: req.ip || null,
    country,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 400) || null,
    deviceId: DEVICE_RE.test(deviceId || '') ? deviceId : null,
  }
}

export function checkCountry(country) {
  if (country && BLOCKED_COUNTRIES.includes(country)) {
    throw fail(403, 'Sorry, the giveaway is not available in your country.', 'country_blocked')
  }
}

// Cloudflare Turnstile. Without TURNSTILE_SECRET_KEY (local development) the check is skipped;
// production refuses to run without it, see warnIfTurnstileMissing.
async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    if (config.nodeEnv === 'production') throw fail(503, 'The giveaway is not set up yet. Please try again later.', 'turnstile_missing')
    return
  }
  if (!token) throw fail(400, 'Please complete the security check.', 'turnstile')
  let data
  try {
    const res = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({ secret, response: String(token), ...(ip ? { remoteip: ip } : {}) }),
      // Cloudflare answers some failures (a bad secret, say) with a 4xx and a JSON body: read it
      // like any other answer instead of treating it as "could not reach Cloudflare".
      { timeout: 8000, validateStatus: () => true }
    )
    data = res.data
    if (res.status >= 500) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    console.error('Turnstile siteverify unreachable:', err.code || '', err.message)
    throw fail(503, 'We could not run the security check. Please try again.', 'turnstile_unreachable')
  }
  if (!data?.success) {
    const codes = data?.['error-codes'] || []
    // invalid-input-secret / missing-input-secret: our setup is wrong, not the visitor. Log it
    // loudly (pm2 logs) so it gets fixed, and do not blame the visitor.
    if (codes.some((c) => String(c).includes('secret'))) {
      console.error('Turnstile: TURNSTILE_SECRET_KEY is wrong:', codes.join(', '))
      throw fail(503, 'The security check is not set up correctly yet. Please try again later.', 'turnstile_config')
    }
    console.warn('Turnstile check failed:', codes.join(', ') || 'no reason given')
    throw fail(400, 'The security check failed. Please try again.', 'turnstile')
  }
}

export function warnIfTurnstileMissing() {
  if (config.nodeEnv === 'production' && !process.env.TURNSTILE_SECRET_KEY) {
    console.warn('TURNSTILE_SECRET_KEY is not set: nobody can join the Christmas giveaway until it is.')
  }
}

// A domain that cannot receive email at all (a typo, or a made up one). DNS trouble on our side
// lets the address through rather than turn real people away; the code still has to arrive.
async function domainTakesMail(email) {
  const domain = email.split('@')[1]
  const lookup = dns.promises.resolveMx(domain).then((mx) => mx.length > 0)
  const timeout = new Promise((resolve) => setTimeout(() => resolve(true), 4000))
  try {
    return await Promise.race([lookup, timeout])
  } catch (err) {
    return !['ENOTFOUND', 'ENODATA', 'ESERVFAIL'].includes(err.code) ? true : false
  }
}

async function findEntrantByEmail(email) {
  const { rows } = await query(
    `SELECT id, blocked_at FROM giveaway_entrants WHERE LOWER(email) = $1`,
    [email]
  )
  return rows[0] || null
}

async function checkEntryLimits({ ip, deviceId }) {
  const { rows: [c] } = await query(
    `SELECT COUNT(*) FILTER (WHERE $1::text IS NOT NULL AND ip = $1)::int AS by_ip,
            COUNT(*) FILTER (WHERE $2::text IS NOT NULL AND device_id = $2)::int AS by_device
     FROM giveaway_entrants
     WHERE ($1::text IS NOT NULL AND ip = $1) OR ($2::text IS NOT NULL AND device_id = $2)`,
    [ip, deviceId]
  )
  if (c.by_ip >= MAX_PER_IP || c.by_device >= MAX_PER_DEVICE) {
    throw fail(429, 'There are already too many entries from this connection or device.', 'too_many_entries')
  }
}

// Step 1. The answer is the same whether the email is new or already taking part, so the form
// does not reveal who has entered.
export async function startJoin({ email, category, turnstileToken, deviceId }, req) {
  const info = requestInfo(req, deviceId)
  checkCountry(info.country)

  email = normalizeEmail(email)
  if (!EMAIL_RE.test(email) || email.length > 254) throw fail(400, 'Please enter a valid email address.', 'email')

  await verifyTurnstile(turnstileToken, info.ip)

  if (isDisposableEmail(email)) throw fail(400, 'Please use your normal email address, not a temporary one.', 'disposable')

  const existing = await findEntrantByEmail(email)
  if (existing?.blocked_at) throw fail(403, 'This entry can no longer take part.', 'blocked')
  if (!existing) {
    if (!ENTRANT_CATEGORIES.includes(category)) throw fail(400, 'Please choose what best describes you.', 'category')
    if (!(await domainTakesMail(email))) throw fail(400, 'That email address cannot receive email. Please check it.', 'email')
    await checkEntryLimits(info)
  }

  // One pending code per email. Resending replaces it, at most once a minute and five times an hour.
  const code = String(crypto.randomInt(100000, 1000000))
  const { rows } = await query(
    `INSERT INTO giveaway_email_codes (email, code_hash, expires_at)
     VALUES ($1, $2, NOW() + $3::interval)
     ON CONFLICT (email) DO UPDATE SET
       code_hash = EXCLUDED.code_hash,
       expires_at = EXCLUDED.expires_at,
       attempts = 0,
       sent_count = CASE WHEN giveaway_email_codes.window_start < NOW() - INTERVAL '1 hour' THEN 1 ELSE giveaway_email_codes.sent_count + 1 END,
       window_start = CASE WHEN giveaway_email_codes.window_start < NOW() - INTERVAL '1 hour' THEN NOW() ELSE giveaway_email_codes.window_start END,
       last_sent_at = NOW()
     WHERE giveaway_email_codes.last_sent_at < NOW() - $4::interval
       AND (giveaway_email_codes.sent_count < $5 OR giveaway_email_codes.window_start < NOW() - INTERVAL '1 hour')
     RETURNING email`,
    [email, hashCode(email, code), `${CODE_TTL_MINUTES} minutes`, `${RESEND_COOLDOWN_SECONDS} seconds`, MAX_CODES_PER_HOUR]
  )
  if (!rows.length) throw fail(429, 'We just sent you a code. Please wait a minute before asking for another.', 'cooldown')

  await sendGiveawayCodeEmail(email, code)
  return { sent: true, expiresInMinutes: CODE_TTL_MINUTES }
}

// Step 2. Returns the entrant id; the controller turns it into a token.
export async function verifyJoin({ email, code, category, deviceId }, req) {
  const info = requestInfo(req, deviceId)
  checkCountry(info.country)

  email = normalizeEmail(email)
  code = String(code || '').trim()
  if (!/^\d{6}$/.test(code)) throw fail(400, 'Please enter the 6 digit code from the email.', 'code')

  const { rows: [row] } = await query(
    `SELECT code_hash, expires_at, attempts FROM giveaway_email_codes WHERE email = $1`,
    [email]
  )
  if (!row || new Date(row.expires_at) < new Date()) throw fail(400, 'That code has expired. Please ask for a new one.', 'code_expired')
  if (row.attempts >= CODE_MAX_ATTEMPTS) throw fail(429, 'Too many wrong codes. Please ask for a new one.', 'code_attempts')
  if (!sameHash(hashCode(email, code), row.code_hash)) {
    await query(`UPDATE giveaway_email_codes SET attempts = attempts + 1 WHERE email = $1`, [email])
    throw fail(400, 'That code is not right. Please check the email and try again.', 'code')
  }
  // Used once: delete it, and only the request that actually deleted it carries on.
  const { rowCount } = await query(`DELETE FROM giveaway_email_codes WHERE email = $1 AND code_hash = $2`, [email, row.code_hash])
  if (!rowCount) throw fail(400, 'That code has already been used. Please ask for a new one.', 'code_expired')

  const existing = await findEntrantByEmail(email)
  if (existing) {
    if (existing.blocked_at) throw fail(403, 'This entry can no longer take part.', 'blocked')
    return { entrantId: existing.id, isNew: false }
  }

  if (!ENTRANT_CATEGORIES.includes(category)) throw fail(400, 'Please choose what best describes you.', 'category')
  await checkEntryLimits(info)
  try {
    const { rows: [created] } = await query(
      `INSERT INTO giveaway_entrants (email, category, ip, country, user_agent, device_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [email, category, info.ip, info.country, info.userAgent, info.deviceId]
    )
    return { entrantId: created.id, isNew: true }
  } catch (err) {
    if (err.code === '23505') {
      const again = await findEntrantByEmail(email)
      if (again) return { entrantId: again.id, isNew: false }
    }
    throw err
  }
}
