// Claiming a Christmas giveaway prize on Pulse. The winner enters their prize code while signed in
// to a verified Pulse account; we mark the prize claimed, apply Pulse Pro straight away when that
// is the prize, and open a chat with the giveaway host (Eddie) with the details, so he can arrange
// the rest. The host's account is GIVEAWAY_HOST_USERNAME.
//
// The fairness rules that need a verified person, and so can only be checked here:
//   - one person, one entry: a Pulse account can only claim prizes from one giveaway entry, and an
//     entry's prizes can only go to one Pulse account
//   - blocked countries: the country chosen at sign up and the country the claim comes from.
//     (The ID's own country is not kept after the ID check, by the privacy policy, so it cannot be
//     checked here; the host can still ask in the chat.)
import { getClient, query } from '../config/database.js'
import { createMessage } from '../db/queries/messages.js'
import { getDirectConversation, createConversation, addParticipant, getParticipants } from '../db/queries/conversations.js'
import { getIo } from '../socket/index.js'
import { giveawayToday, giveawayDates } from './giveaway.service.js'
import { checkCountry } from './giveawayJoin.service.js'

// Sign up country names (frontend/src/features/signup/CountrySelect.jsx) on the blocked list.
const BLOCKED_SIGNUP_COUNTRIES = ['North Korea', 'Iran', 'Cuba', 'Belarus', 'Syria', 'India', 'China']
const LIFETIME_END = '9999-12-31T00:00:00Z'

const WALLET_PATTERNS = {
  eth_10: /^0x[0-9a-fA-F]{40}$/,
  btc_10: /^(bc1[02-9ac-hj-np-z]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/,
}

function fail(status, message, reason) {
  return Object.assign(new Error(message), { status, reason })
}

export function normalizeCode(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '')
}

function claimClosed() {
  return giveawayToday() > giveawayDates().claimDeadline
}

// What a code is for, so the claim page can show the prize before anyone signs in.
export async function previewCode(rawCode) {
  const code = normalizeCode(rawCode)
  if (!/^XMAS-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) throw fail(404, 'That prize code was not found. Please check it.', 'not_found')
  const { rows: [w] } = await query(
    `SELECT w.code, w.claimed_at, p.name, p.prize_group, p.needs_wallet, p.pro_months, p.pro_lifetime, p.key
     FROM giveaway_wins w JOIN giveaway_prizes p ON p.key = w.prize_key WHERE w.code = $1`,
    [code]
  )
  if (!w) throw fail(404, 'That prize code was not found. Please check it.', 'not_found')
  return {
    code: w.code,
    prize: { key: w.key, name: w.name, group: w.prize_group, needsWallet: w.needs_wallet, proMonths: w.pro_months, proLifetime: w.pro_lifetime },
    claimed: Boolean(w.claimed_at),
    claimDeadline: giveawayDates().claimDeadline,
    closed: claimClosed(),
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export async function claimCode(user, rawCode, rawWallet, ipCountry) {
  if (user.kyc_status !== 'verified') throw fail(403, 'Please verify your ID before claiming your prize.', 'verify_first')
  if (BLOCKED_SIGNUP_COUNTRIES.includes(user.country)) throw fail(403, 'Sorry, prizes cannot be claimed from your country.', 'country_blocked')
  checkCountry(ipCountry)
  if (claimClosed()) throw fail(410, `Prizes had to be claimed by ${formatDate(giveawayDates().claimDeadline)}.`, 'closed')

  const code = normalizeCode(rawCode)
  const client = await getClient()
  let win, prize, proEndsAt = null
  try {
    await client.query('BEGIN')
    const { rows: [row] } = await client.query(
      `SELECT w.id, w.entrant_id, w.claimed_by, w.conversation_id, w.code, w.is_preview,
              p.key, p.name, p.needs_wallet, p.pro_months, p.pro_lifetime
       FROM giveaway_wins w JOIN giveaway_prizes p ON p.key = w.prize_key
       WHERE w.code = $1 FOR UPDATE OF w`,
      [code]
    )
    if (!row) throw fail(404, 'That prize code was not found. Please check it.', 'not_found')
    if (row.claimed_by) {
      if (row.claimed_by === user.id) {
        await client.query('ROLLBACK')
        return { alreadyClaimed: true, prize: { key: row.key, name: row.name }, conversationId: row.conversation_id }
      }
      throw fail(409, 'This prize has already been claimed.', 'claimed')
    }

    // One person, one entry, seen from both sides.
    const { rows: [clash] } = await client.query(
      `SELECT 1 FROM giveaway_wins
       WHERE (claimed_by = $1 AND entrant_id <> $2) OR (entrant_id = $2 AND claimed_by IS NOT NULL AND claimed_by <> $1)
       LIMIT 1`,
      [user.id, row.entrant_id]
    )
    if (clash) throw fail(409, 'Prizes from more than one giveaway entry cannot go to the same person. Please contact us if this is a mistake.', 'other_entry')

    let wallet = null
    if (row.needs_wallet) {
      wallet = String(rawWallet || '').trim()
      const pattern = WALLET_PATTERNS[row.key]
      if (!wallet || (pattern && !pattern.test(wallet))) {
        throw fail(400, `Please enter a valid ${row.key.startsWith('btc') ? 'Bitcoin' : 'Ethereum'} wallet address.`, 'wallet')
      }
    }

    await client.query(
      `UPDATE giveaway_wins SET claimed_by = $1, claimed_at = NOW(), wallet_address = $2 WHERE id = $3`,
      [user.id, wallet, row.id]
    )

    // Pro starts now, or is added on top of Pro time they already have.
    if (row.pro_lifetime) {
      const { rows: [u] } = await client.query(
        `UPDATE users SET pro_ends_at = $1, pro_reminder_sent_at = NULL WHERE id = $2 RETURNING pro_ends_at`,
        [LIFETIME_END, user.id]
      )
      proEndsAt = u.pro_ends_at
    } else if (row.pro_months) {
      const { rows: [u] } = await client.query(
        `UPDATE users
         SET pro_ends_at = GREATEST(COALESCE(pro_ends_at, NOW()), NOW()) + make_interval(months => $1),
             pro_reminder_sent_at = NULL
         WHERE id = $2 AND (pro_ends_at IS NULL OR pro_ends_at < $3)
         RETURNING pro_ends_at`,
        [row.pro_months, user.id, LIFETIME_END]
      )
      proEndsAt = u?.pro_ends_at || LIFETIME_END
    }

    await client.query('COMMIT')
    win = { ...row, wallet }
    prize = { key: row.key, name: row.name, needsWallet: row.needs_wallet, proMonths: row.pro_months, proLifetime: row.pro_lifetime }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }

  // The prize is claimed even if the chat cannot be opened; the host sees it in the admin panel.
  let conversationId = null
  try {
    conversationId = await openHostChat(user, win, proEndsAt)
    if (conversationId) await query(`UPDATE giveaway_wins SET conversation_id = $1 WHERE id = $2`, [conversationId, win.id])
  } catch (err) {
    console.error('giveaway claim: could not open the host chat:', err.message)
  }

  return { alreadyClaimed: false, prize, proEndsAt, conversationId }
}

async function findHost() {
  const username = process.env.GIVEAWAY_HOST_USERNAME
  if (!username) return null
  const { rows: [host] } = await query(
    `SELECT id, full_name, display_name, avatar_url FROM users WHERE LOWER(username) = LOWER($1)`,
    [username]
  )
  return host || null
}

// A direct chat between the host and the winner, with a first message from the host's account
// that says what was won. Marked as automatic so nobody thinks Eddie typed it at 3am.
async function openHostChat(user, win, proEndsAt) {
  const host = await findHost()
  if (!host || host.id === user.id) return null

  let conv = await getDirectConversation(user.id, host.id)
  if (!conv) {
    conv = await createConversation({ type: 'direct', createdBy: host.id })
    await addParticipant(conv.id, host.id)
    await addParticipant(conv.id, user.id)
  }

  const first = (user.display_name || user.full_name || '').split(' ')[0]
  const lines = [
    ...(win.is_preview ? ['🧪 TEST PRIZE from giveaway preview mode, not a real win.'] : []),
    `🎄 Congratulations${first ? `, ${first}` : ''}! You won ${win.name} in the Affiliate Roulette × Pulse Christmas giveaway.`,
    `Prize code: ${win.code}`,
  ]
  if (win.pro_lifetime) lines.push('Your Pulse Pro is now active for life. Enjoy!')
  else if (win.pro_months) lines.push(`Your Pulse Pro is already active, until ${formatDate(proEndsAt)}.`)
  else if (win.wallet) lines.push(`Wallet: ${win.wallet}\nWe will send your crypto to this address and confirm here.`)
  else lines.push('We will be in touch here to arrange your prize.')
  lines.push('(This message was sent automatically when you claimed your prize.)')

  const msg = await createMessage({ conversationId: conv.id, senderId: host.id, content: lines.join('\n'), messageType: 'text' })
  const fullMsg = {
    ...msg,
    sender_id: host.id,
    sender_name: host.full_name,
    sender_avatar: host.avatar_url,
    sender_display_name: host.display_name,
  }
  const participants = await getParticipants(conv.id)
  const io = getIo()
  participants.forEach((p) => io.to(`user:${p.id}`).emit('new-message', fullMsg))
  return conv.id
}
