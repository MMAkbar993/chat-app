import { query } from '../../config/database.js'
import { getOnlineUserCount } from '../../socket/index.js'
import { getSalesTotals } from './payments.js'

// Mirrors backend/src/utils/plan.js's isProUser() as SQL — keep in sync if that logic changes.
const PRO_SQL = `subscription_plan IN ('monthly','yearly') AND subscription_status IN ('active','past_due')`

export async function findAdminById(id) {
  const result = await query(
    `SELECT id, full_name, email, avatar_url, is_admin FROM users WHERE id = $1 AND is_admin = true`,
    [id]
  )
  return result.rows[0] || null
}

export async function getDashboardStats() {
  const [users, groups, chats, calls, newToday, mau, messagesToday, callSecondsToday, websites, proCount, sales] = await Promise.all([
    query(`SELECT COUNT(*) FROM users WHERE is_admin = false`),
    query(`SELECT COUNT(*) FROM conversations WHERE type = 'group'`),
    query(`SELECT COUNT(*) FROM conversations WHERE type = 'direct'`),
    query(`SELECT COUNT(*) FROM calls`),
    query(`SELECT COUNT(*) FROM users WHERE is_admin = false AND created_at >= CURRENT_DATE`),
    query(`SELECT COUNT(*) FROM users WHERE is_admin = false AND last_seen_at >= now() - interval '30 days'`),
    query(`SELECT COUNT(*) FROM messages WHERE created_at >= CURRENT_DATE AND is_deleted = false`),
    query(`SELECT COALESCE(SUM(duration_seconds), 0) AS seconds FROM calls WHERE status = 'answered' AND started_at >= CURRENT_DATE`),
    query(`SELECT COUNT(*) FROM verified_websites`),
    query(`SELECT COUNT(*) FROM users WHERE is_admin = false AND ${PRO_SQL}`),
    getSalesTotals(),
  ])
  return {
    users: parseInt(users.rows[0].count),
    groups: parseInt(groups.rows[0].count),
    chats: parseInt(chats.rows[0].count),
    calls: parseInt(calls.rows[0].count),
    onlineNow: getOnlineUserCount(),
    newUsersToday: parseInt(newToday.rows[0].count),
    monthlyActiveUsers: parseInt(mau.rows[0].count),
    messagesToday: parseInt(messagesToday.rows[0].count),
    callMinutesToday: Math.round(parseInt(callSecondsToday.rows[0].seconds, 10) / 60),
    websiteRegistrations: parseInt(websites.rows[0].count),
    proSubscribers: parseInt(proCount.rows[0].count),
    sales,
  }
}

export async function getUserDetail(id) {
  const userResult = await query(
    `SELECT id, full_name, username, email, phone, country, avatar_url, is_active, blocked_at,
            created_at, last_seen_at, login_count, kyc_status, subscription_plan, subscription_status
     FROM users WHERE id = $1 AND is_admin = false`,
    [id]
  )
  const user = userResult.rows[0]
  if (!user) return null

  const [websites, reports] = await Promise.all([
    query(
      `SELECT id, url, verified, created_at FROM verified_websites WHERE user_id = $1 ORDER BY created_at DESC`,
      [id]
    ),
    query(
      `SELECT r.id, r.reason, r.created_at, u.full_name AS reporter_name, u.email AS reporter_email
       FROM reports r LEFT JOIN users u ON u.id = r.reporter_id
       WHERE r.reported_user_id = $1 ORDER BY r.created_at DESC`,
      [id]
    ),
  ])

  return { ...user, verified_websites: websites.rows, reports: reports.rows }
}

export async function setUserPackage(userId, plan) {
  const [subscription_plan, subscription_status] = plan === 'pro' ? ['monthly', 'active'] : [null, 'inactive']
  const result = await query(
    `UPDATE users SET subscription_plan = $1, subscription_status = $2 WHERE id = $3 AND is_admin = false
     RETURNING id, subscription_plan, subscription_status`,
    [subscription_plan, subscription_status, userId]
  )
  return result.rows[0]
}

export async function getAllReports({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit
  const rows = await query(
    `SELECT r.id, r.reason, r.created_at,
            reporter.id AS reporter_id, reporter.full_name AS reporter_name, reporter.email AS reporter_email,
            reported.id AS reported_id, reported.full_name AS reported_name, reported.email AS reported_email
     FROM reports r
     LEFT JOIN users reporter ON reporter.id = r.reporter_id
     LEFT JOIN users reported ON reported.id = r.reported_user_id
     ORDER BY r.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  const total = await query(`SELECT COUNT(*) FROM reports`)
  return { reports: rows.rows, total: parseInt(total.rows[0].count) }
}

export async function getBillingOverview() {
  const [counts, sales] = await Promise.all([
    query(
      `SELECT COUNT(*) FILTER (WHERE ${PRO_SQL}) AS pro,
              COUNT(*) FILTER (WHERE NOT (${PRO_SQL})) AS free
       FROM users WHERE is_admin = false`
    ),
    getSalesTotals(),
  ])
  return {
    free: parseInt(counts.rows[0].free, 10),
    pro: parseInt(counts.rows[0].pro, 10),
    sales,
  }
}

export async function getAllVerifiedWebsites({ status = 'all', page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit
  const statusClause = status === 'pending' ? 'AND vw.verified = false' : status === 'approved' ? 'AND vw.verified = true' : ''
  const rows = await query(
    `SELECT vw.id, vw.url, vw.verified, vw.created_at,
            u.id AS user_id, u.full_name AS owner_name, u.email AS owner_email
     FROM verified_websites vw
     JOIN users u ON u.id = vw.user_id
     WHERE true ${statusClause}
     ORDER BY vw.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  const total = await query(`SELECT COUNT(*) FROM verified_websites vw WHERE true ${statusClause}`)
  return { websites: rows.rows, total: parseInt(total.rows[0].count) }
}

export async function getAllRepresentationRequests({ status = 'pending', page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit
  const rows = await query(
    `SELECT r.id, r.website_url, r.status, r.created_at,
            requester.id AS requester_id, requester.full_name AS requester_name, requester.email AS requester_email,
            owner.id AS owner_id, owner.full_name AS owner_name, owner.email AS owner_email
     FROM website_representation_requests r
     JOIN users requester ON requester.id = r.requester_id
     JOIN users owner ON owner.id = r.owner_id
     WHERE r.status = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [status, limit, offset]
  )
  const total = await query(`SELECT COUNT(*) FROM website_representation_requests WHERE status = $1`, [status])
  return { requests: rows.rows, total: parseInt(total.rows[0].count) }
}

const REP_ACTION_STATUS = { approve: 'approved', reject: 'rejected', revoke: 'revoked' }

export async function adminSetRepresentative(requestId, action) {
  const status = REP_ACTION_STATUS[action]
  if (!status) throw Object.assign(new Error('Invalid action'), { status: 400 })
  const result = await query(
    `UPDATE website_representation_requests SET status = $1 WHERE id = $2 RETURNING *`,
    [status, requestId]
  )
  return result.rows[0]
}

export async function getBroadcastAudienceIds(audience) {
  let where = 'is_admin = false'
  if (audience === 'pro') where += ` AND ${PRO_SQL}`
  else if (audience === 'free') where += ` AND NOT (${PRO_SQL})`
  const result = await query(`SELECT id FROM users WHERE ${where}`)
  return result.rows.map((r) => r.id)
}

export async function insertBroadcastNotifications(userIds, data) {
  if (userIds.length === 0) return []
  const values = userIds.map((_, i) => `($${i * 2 + 1}, 'broadcast', $${i * 2 + 2})`).join(', ')
  const params = userIds.flatMap((uid) => [uid, JSON.stringify(data)])
  const result = await query(
    `INSERT INTO notifications (user_id, type, data) VALUES ${values} RETURNING id, user_id`,
    params
  )
  return result.rows
}

export async function getSystemEmailSettings() {
  const result = await query(
    `SELECT email_key, enabled, subject, body_html, updated_at FROM system_email_settings ORDER BY email_key`
  )
  return result.rows
}

export async function updateSystemEmailSetting(emailKey, { enabled, subject, body_html }) {
  const result = await query(
    `UPDATE system_email_settings
     SET enabled = COALESCE($1, enabled), subject = COALESCE($2, subject), body_html = COALESCE($3, body_html), updated_at = NOW()
     WHERE email_key = $4
     RETURNING email_key, enabled, subject, body_html, updated_at`,
    [enabled, subject, body_html, emailKey]
  )
  return result.rows[0]
}

export async function getBroadcastHistory({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit
  const rows = await query(
    `SELECT data->>'broadcastId' AS broadcast_id, data->>'title' AS title,
            data->>'body' AS body, data->>'audience' AS audience,
            MIN(created_at) AS created_at, COUNT(*)::int AS recipient_count
     FROM notifications WHERE type = 'broadcast'
     GROUP BY data->>'broadcastId', data->>'title', data->>'body', data->>'audience'
     ORDER BY MIN(created_at) DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  return rows.rows
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

export async function countAdmins() {
  const result = await query(`SELECT COUNT(*) FROM users WHERE is_admin = true`)
  return parseInt(result.rows[0].count, 10)
}

export async function createAdminUser({ full_name, email, password_hash }) {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')
  const username = `${base}_${Date.now()}`
  const result = await query(
    `INSERT INTO users
       (full_name, username, country, email, primary_role, password_hash,
        is_admin, is_active, subscription_status, kyc_status)
     VALUES ($1, $2, 'N/A', $3, 'other', $4, true, true, 'active', 'verified')
     RETURNING id, full_name, email, avatar_url, is_admin`,
    [full_name, username, email, password_hash]
  )
  return result.rows[0]
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
