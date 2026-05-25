import { query } from '../../config/database.js'

export async function getContacts(userId) {
  const result = await query(
    `SELECT
       u.id, u.full_name, u.username, u.primary_role, u.avatar_url, u.display_name, u.bio,
       c.custom_first_name, c.custom_last_name
     FROM contacts c
     JOIN users u ON u.id = c.contact_id
     WHERE c.user_id = $1
     ORDER BY COALESCE(c.custom_first_name, u.full_name) ASC`,
    [userId]
  )
  return result.rows
}

export async function updateContactNames(userId, contactId, firstName, lastName) {
  await query(
    `UPDATE contacts SET custom_first_name = $3, custom_last_name = $4
     WHERE user_id = $1 AND contact_id = $2`,
    [userId, contactId, firstName || null, lastName || null]
  )
}

export async function addContact(userId, contactId) {
  await query(
    `INSERT INTO contacts (user_id, contact_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, contactId]
  )
  await query(
    `INSERT INTO contacts (user_id, contact_id) VALUES ($2, $1) ON CONFLICT DO NOTHING`,
    [userId, contactId]
  )
}

export async function removeContact(userId, contactId) {
  await query(
    `DELETE FROM contacts WHERE (user_id = $1 AND contact_id = $2) OR (user_id = $2 AND contact_id = $1)`,
    [userId, contactId]
  )
}

export async function isContact(userId, contactId) {
  const result = await query(
    `SELECT 1 FROM contacts WHERE user_id = $1 AND contact_id = $2`,
    [userId, contactId]
  )
  return result.rows.length > 0
}

export async function searchUsers(query_text, excludeUserId, limit = 20) {
  const result = await query(
    `SELECT id, full_name, username, primary_role, avatar_url, display_name
     FROM users
     WHERE id != $2
       AND (username ILIKE $1 OR full_name ILIKE $1)
       AND is_active = true
     LIMIT $3`,
    [`%${query_text}%`, excludeUserId, limit]
  )
  return result.rows
}
