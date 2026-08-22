import { getContacts, addContact, removeContact, isContact, searchUsers, updateContactNames } from '../db/queries/contacts.js'
import { query } from '../config/database.js'
import { sendInviteEmail } from '../config/email.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function listContacts(req, res, next) {
  try {
    const contacts = await getContacts(req.user.id)
    res.json({ contacts })
  } catch (err) {
    next(err)
  }
}

export async function addContactHandler(req, res, next) {
  try {
    const { contactId } = req.body
    if (!contactId) return res.status(400).json({ error: 'contactId required' })
    if (contactId === req.user.id) return res.status(400).json({ error: 'Cannot add yourself' })
    const already = await isContact(req.user.id, contactId)
    if (already) return res.status(409).json({ error: 'Contact already in your list' })
    await addContact(req.user.id, contactId)
    res.status(201).json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function updateContactHandler(req, res, next) {
  try {
    const { contactId } = req.params
    const { firstName, lastName } = req.body
    await updateContactNames(req.user.id, contactId, firstName, lastName)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function removeContactHandler(req, res, next) {
  try {
    await removeContact(req.user.id, req.params.contactId)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function searchUsersHandler(req, res, next) {
  try {
    const { q } = req.query
    const username = (q || '').trim().replace(/^@/, '')
    if (username.length < 3) return res.json({ users: [] })
    const users = await searchUsers(username, req.user.id)
    res.json({ users })
  } catch (err) {
    next(err)
  }
}

export async function sendInviteHandler(req, res, next) {
  try {
    const { recipient, message } = req.body
    if (!recipient) return res.status(400).json({ error: 'recipient required' })
    const to = recipient.trim()

    await query(
      `INSERT INTO invitations (sender_id, recipient, message, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT DO NOTHING`,
      [req.user.id, to, message || null]
    ).catch(() => {})

    if (!EMAIL_PATTERN.test(to)) {
      // No SMS provider configured — say so plainly rather than pretending it sent.
      return res.json({ ok: true, delivered: false, reason: 'SMS invites are not supported yet — only email addresses can be invited right now.' })
    }

    const senderName = req.user.display_name || req.user.full_name
    await sendInviteEmail(to, { senderName, message })
    res.json({ ok: true, delivered: true })
  } catch (err) {
    next(err)
  }
}
