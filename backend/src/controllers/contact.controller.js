import { getContacts, addContact, removeContact, isContact, searchUsers } from '../db/queries/contacts.js'

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
    await addContact(req.user.id, contactId)
    res.status(201).json({ ok: true })
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
