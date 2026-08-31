import { query } from '../../config/database.js'

export async function getContacts(userId) {
  const result = await query(
    `SELECT
       u.id, u.full_name, u.username, u.primary_role, u.primary_role_other, u.avatar_url, u.display_name, u.bio,
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

// Free/personal email providers — a match on these as someone's "company" would be meaningless
// noise (half of everyone is @gmail.com), so the email-domain fallback below skips them entirely.
const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'outlook.com', 'hotmail.com',
  'hotmail.co.uk', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com', 'protonmail.com',
  'proton.me', 'yandex.com', 'mail.com', 'gmx.com', 'zoho.com', 'qq.com', '163.com',
]

// The best available "who is this person with" signal, cheapest/most-trustworthy first:
// an explicit verified company_name, then a verified website, then — since most people never
// go through either flow but plenty sign up with a real work email — the domain of their email
// address, as long as it isn't one of the free providers above. Never the raw email itself.
const MATCHED_COMPANY_SQL = `
  CASE
    WHEN company_name IS NOT NULL AND company_name != '' THEN company_name
    WHEN website_verified AND website IS NOT NULL AND website != '' THEN website
    WHEN split_part(email, '@', 2) != ALL($4::text[]) THEN split_part(email, '@', 2)
    ELSE NULL
  END
`

// Both the stored value and the incoming query are collapsed to bare lowercase alphanumerics
// before comparing, so "Affiliate Roulette" (a natural, spaced business name someone would
// actually type) still matches a company_name/website that's really just a bare domain like
// "affiliateroulette.com" — spaces and the dot simply disappear from both sides.
function collapse(sql) {
  return `regexp_replace(lower(COALESCE(${sql}, '')), '[^a-z0-9]', '', 'g')`
}

export async function searchUsers(username, excludeUserId, limit = 20) {
  const result = await query(
    `SELECT id, full_name, username, primary_role, primary_role_other, avatar_url, display_name,
            (${MATCHED_COMPANY_SQL}) AS matched_company
     FROM users
     WHERE id != $2
       AND username ILIKE $1
       AND is_active = true
     LIMIT $3`,
    [username, excludeUserId, limit, FREE_EMAIL_DOMAINS]
  )
  return result.rows
}

export async function searchUsersByCompanyName(companyName, excludeUserId, limit = 20) {
  const needle = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const result = await query(
    `SELECT id, full_name, username, primary_role, primary_role_other, avatar_url, display_name,
            (${MATCHED_COMPANY_SQL}) AS matched_company
     FROM users
     WHERE id != $2
       AND is_active = true
       AND (
         ${collapse('company_name')} LIKE '%' || $1 || '%'
         OR (website_verified AND ${collapse('website')} LIKE '%' || $1 || '%')
         OR (
           split_part(email, '@', 2) != ALL($4::text[])
           AND ${collapse("split_part(email, '@', 2)")} LIKE '%' || $1 || '%'
         )
       )
     LIMIT $3`,
    [needle, excludeUserId, limit, FREE_EMAIL_DOMAINS]
  )
  return result.rows
}
