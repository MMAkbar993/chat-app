import { getContacts, addContact, removeContact, isContact, searchUsers, updateContactNames } from '../db/queries/contacts.js'
import { query } from '../config/database.js'

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
    if (!q || q.trim().length < 2) return res.json({ users: [] })
    const users = await searchUsers(q.trim(), req.user.id)
    res.json({ users })
  } catch (err) {
    next(err)
  }
}

export async function sendInviteHandler(req, res, next) {
  try {
    const { recipient, message } = req.body
    if (!recipient) return res.status(400).json({ error: 'recipient required' })
    // Store the invite in DB for audit; actual email delivery can be wired to a mail provider later
    await query(
      `INSERT INTO invitations (sender_id, recipient, message, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT DO NOTHING`,
      [req.user.id, recipient.trim(), message || null]
    ).catch(() => {})
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
