import { query } from '../../config/database.js'

export async function findAdminById(id) {
  const result = await query(
    `SELECT id, full_name, email, avatar_url, is_admin FROM users WHERE id = $1 AND is_admin = true`,
    [id]
  )
  return result.rows[0] || null
}

export async function getDashboardStats() {
  const [users, groups, chats, calls] = await Promise.all([
    query(`SELECT COUNT(*) FROM users WHERE is_admin = false`),
    query(`SELECT COUNT(*) FROM conversations WHERE type = 'group'`),
    query(`SELECT COUNT(*) FROM conversations WHERE type = 'direct'`),
    query(`SELECT COUNT(*) FROM calls`),
  ])
  return {
    users: parseInt(users.rows[0].count),
    groups: parseInt(groups.rows[0].count),
    chats: parseInt(chats.rows[0].count),
    calls: parseInt(calls.rows[0].count),
  }
}

export async function getRecentUsers(limit = 5) {
  const result = await query(
    `SELECT id, full_name, email, country, created_at, last_seen_at, avatar_url, blocked_at
     FROM users WHERE is_admin = false
     ORDER BY created_at DESC LIMIT $1`,
    [limit]
  )
  return result.rows
}

export async function getRecentGroups(limit = 5) {
  const result = await query(
    `SELECT c.id, c.name, c.avatar_url, c.created_at,
            COUNT(cp.user_id)::int AS member_count,
            u.full_name AS owner_name
     FROM conversations c
     LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
     LEFT JOIN users u ON c.created_by = u.id
     WHERE c.type = 'group'
     GROUP BY c.id, u.full_name
     ORDER BY c.created_at DESC LIMIT $1`,
    [limit]
  )
  return result.rows
}

export async function getAllUsers({ search = '', page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit
  const pat = `%${search}%`
  const rows = await query(
    `SELECT id, full_name, email, phone, country, created_at, last_seen_at, avatar_url, is_active, blocked_at
     FROM users WHERE is_admin = false
       AND (full_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1)
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [pat, limit, offset]
  )
  const total = await query(
    `SELECT COUNT(*) FROM users WHERE is_admin = false
       AND (full_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1)`,
    [pat]
  )
  return { users: rows.rows, total: parseInt(total.rows[0].count) }
}

export async function createManagedUser({ full_name, email, phone, country, password_hash }) {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')
  const username = `${base}_${Date.now()}`
  const result = await query(
    `INSERT INTO users
       (full_name, username, country, email, primary_role, phone, password_hash, is_active, subscription_status, kyc_status)
     VALUES ($1, $2, $3, $4, 'other', $5, $6, true, 'active', 'verified')
     RETURNING id, full_name, email, phone, country, created_at, is_active, blocked_at`,
    [full_name, username, country, email, phone || null, password_hash]
  )
  return result.rows[0]
}

export async function updateManagedUser(id, { full_name, email, phone, country }) {
  const result = await query(
    `UPDATE users SET full_name=$1, email=$2, phone=$3, country=$4
     WHERE id=$5 AND is_admin=false
     RETURNING id, full_name, email, phone, country, created_at, is_active, blocked_at`,
    [full_name, email, phone || null, country, id]
  )
  return result.rows[0]
}

export async function deleteManagedUser(id) {
  await query(`DELETE FROM users WHERE id=$1 AND is_admin=false`, [id])
}

export async function blockManagedUser(id) {
  await query(
    `UPDATE users SET is_active=false, blocked_at=NOW() WHERE id=$1 AND is_admin=false`,
    [id]
  )
}

export async function unblockManagedUser(id) {
  await query(
    `UPDATE users SET is_active=true, blocked_at=NULL WHERE id=$1 AND is_admin=false`,
    [id]
  )
}

export async function getAllGroups({ search = '', page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit
  const pat = `%${search}%`
  const rows = await query(
    `SELECT c.id, c.name, c.avatar_url, c.created_at,
            COUNT(cp.user_id)::int AS member_count,
            u.full_name AS owner_name, u.email AS owner_email
     FROM conversations c
     LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
     LEFT JOIN users u ON c.created_by = u.id
     WHERE c.type='group' AND (c.name ILIKE $1 OR $1='%%')
     GROUP BY c.id, u.full_name, u.email
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [pat, limit, offset]
  )
  const total = await query(
    `SELECT COUNT(*) FROM conversations WHERE type='group' AND (name ILIKE $1 OR $1='%%')`,
    [pat]
  )
  return { groups: rows.rows, total: parseInt(total.rows[0].count) }
}

export async function getAllConversations({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit
  const rows = await query(
    `SELECT c.id, c.type, c.name, c.created_at,
            COUNT(DISTINCT cp.user_id)::int AS member_count,
            COUNT(DISTINCT m.id)::int AS message_count
     FROM conversations c
     LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
     LEFT JOIN messages m ON c.id = m.conversation_id AND m.is_deleted=false
     GROUP BY c.id
     ORDER BY c.updated_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  const total = await query(`SELECT COUNT(*) FROM conversations`)
  return { conversations: rows.rows, total: parseInt(total.rows[0].count) }
}

export async function getAllCalls({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit
  const rows = await query(
    `SELECT ca.id, ca.call_type, ca.status, ca.started_at, ca.ended_at, ca.duration_seconds,
            u1.full_name AS caller_name, u1.email AS caller_email,
            u2.full_name AS callee_name, u2.email AS callee_email
     FROM calls ca
     LEFT JOIN users u1 ON ca.caller_id = u1.id
     LEFT JOIN users u2 ON ca.callee_id = u2.id
     ORDER BY ca.started_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  const total = await query(`SELECT COUNT(*) FROM calls`)
  return { calls: rows.rows, total: parseInt(total.rows[0].count) }
}

export async function updateAdminProfile(id, { full_name, avatar_url }) {
  const result = await query(
    `UPDATE users SET full_name=$1, avatar_url=$2 WHERE id=$3 AND is_admin=true
     RETURNING id, full_name, email, avatar_url`,
    [full_name, avatar_url || null, id]
  )
  return result.rows[0]
}
