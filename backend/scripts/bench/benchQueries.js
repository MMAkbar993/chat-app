// Times the app's real read queries with EXPLAIN ANALYZE, for index work. Never run this against
// production: it is for a copy of the database (see backend/scripts/bench/README.md).
//
//   DATABASE_URL=postgresql://…/pulse_idx_test node scripts/bench/benchQueries.js before.json
//
// It calls the app's own query functions, so the SQL measured is exactly the SQL the app sends.
// A hook on the pg pool runs EXPLAIN (ANALYZE, BUFFERS) on each SELECT those functions issue.
// Anything that is not a SELECT is skipped and never executed, so nothing is written and every
// run sees the same data.
import pg from 'pg'
import fs from 'fs'

if (!/_test|_bench|localhost/.test(process.env.DATABASE_URL || '')) {
  console.error('Refusing to run: DATABASE_URL does not look like a local test database.')
  process.exit(1)
}

const RUNS = 5
const origQuery = pg.Pool.prototype.query
let capture = null // array of { sql, params } while a case runs
let captureMax = Infinity
const STOP = new Error('stop after the statements being measured')

pg.Pool.prototype.query = async function (text, params) {
  const sql = typeof text === 'string' ? text : text.text
  if (!/^\s*(SELECT|WITH)\b/i.test(sql) || /^\s*WITH[\s\S]*\b(INSERT|UPDATE|DELETE)\b/i.test(sql)) {
    return { rows: [], rowCount: 0 }
  }
  if (capture) {
    if (capture.length >= captureMax) throw STOP
    capture.push({ sql, params })
    // Last statement wanted: it is timed separately below, so the caller gets no rows and
    // has nothing to follow up on.
    if (capture.length >= captureMax) return { rows: [], rowCount: 0 }
  }
  return origQuery.call(this, text, params)
}

const { query } = await import('../../src/config/database.js')
const { getConversationsForUser, getDirectConversation, getParticipants, isParticipant } = await import('../../src/db/queries/conversations.js')
const { getMessages, searchMessages } = await import('../../src/db/queries/messages.js')
const { getContacts, searchUsers, searchUsersByCompanyName } = await import('../../src/db/queries/contacts.js')
const { getCallHistory, getMonthlyCallSecondsUsed } = await import('../../src/db/queries/calls.js')
const { findUserById } = await import('../../src/db/queries/users.js')
const { getNotifications } = await import('../../src/controllers/notification.controller.js')
const { checkUnreadMessages } = await import('../../src/jobs/unreadMessageEmail.js')

const one = async (sql, p = []) => (await query(sql, p)).rows[0]
const user = (n) => one(`SELECT id FROM users WHERE username = $1`, [`user${n}`]).then((r) => r.id)
const heavy = await user(1)
const typical = await user(5000)
const busiest = await one(
  `SELECT conversation_id AS id FROM messages GROUP BY conversation_id ORDER BY count(*) DESC LIMIT 1`)
const typicalConv = await one(
  `SELECT cp.conversation_id AS id FROM conversation_participants cp JOIN conversations c ON c.id = cp.conversation_id
   WHERE cp.user_id = $1 AND c.type = 'direct' ORDER BY cp.conversation_id LIMIT 1`, [typical])
const bigGroup = await one(`SELECT id FROM conversations WHERE name = 'Group 1'`)
const midpoint = await one(`SELECT created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC OFFSET 100000 LIMIT 1`, [busiest.id])
const second = await user(2)
const pinnedProbe = await one(`SELECT id FROM messages WHERE conversation_id = $1 LIMIT 1`, [bigGroup.id])

const mockRes = { json() {}, status() { return this } }
const cases = [
  ['Chat list (heavy user, 550 chats)', () => getConversationsForUser(heavy)],
  ['Chat list (typical user)', () => getConversationsForUser(typical)],
  ['Open chat: newest 50 (200k-message chat)', () => getMessages(busiest.id, heavy)],
  ['Open chat: scroll back (200k-message chat)', () => getMessages(busiest.id, heavy, 50, midpoint.created_at)],
  ['Open chat: newest 50 (typical chat)', () => getMessages(typicalConv.id, typical)],
  ['Search messages "invoice" (heavy user)', () => searchMessages(heavy, 'invoice')],
  ['Search messages "invoice" (typical user)', () => searchMessages(typical, 'invoice')],
  ['Find people by username', () => searchUsers('user4242', heavy)],
  ['Find people by company (Pro)', () => searchUsersByCompanyName('company42', heavy)],
  ['Contacts list (heavy user)', () => getContacts(heavy)],
  ['Call history (heavy user)', () => getCallHistory(heavy)],
  ['Call minutes this month (before each call)', () => getMonthlyCallSecondsUsed(heavy)],
  ['Notifications list (heavy user)', () => getNotifications({ user: { id: heavy } }, mockRes, (e) => { throw e })],
  ['Start a direct chat (existing)', () => getDirectConversation(heavy, second)],
  ['Send message: checks (big group)', async () => {
    await isParticipant(bigGroup.id, heavy); await getParticipants(bigGroup.id); await findUserById(heavy)
  }],
  // markMessagesRead / markMessagesDelivered are UPDATEs, so they are never analysed. These
  // SELECTs use the exact same WHERE clause, which is the part an index affects.
  ['Read receipts: rows to mark read (same WHERE as the UPDATE)', () => query(
    `SELECT id, sender_id FROM messages WHERE conversation_id = $1 AND sender_id != $2 AND status != 'read'`, [busiest.id, heavy])],
  ['Delivery receipts: rows to mark delivered (same WHERE)', () => query(
    `SELECT id, sender_id FROM messages WHERE conversation_id = $1 AND sender_id != $2 AND status = 'sent'`, [busiest.id, heavy])],
  // Only the job's main query: after it, the job emails each row, one template lookup apiece.
  // Deleting a chat deletes its messages; for each one, the foreign key from
  // conversations.pinned_message_id runs this lookup. Timed here as a read, never as the delete.
  ['Delete chat: pin lookup run once per deleted message', () => query(
    `SELECT 1 FROM conversations WHERE pinned_message_id = $1`, [pinnedProbe.id])],
  ['Unread-message email job: main query (runs on a timer)', () => checkUnreadMessages(), 1],
]

// Tables big enough that reading all of one is a problem.
const BIG = new Set(['messages', 'notifications', 'calls', 'contacts', 'conversation_participants', 'conversations', 'users', 'message_reactions'])
function walk(node, out) {
  if (node['Node Type'] === 'Seq Scan' && BIG.has(node['Relation Name'])) {
    out.push(`${node['Relation Name']} (${node['Actual Rows'] * (node['Actual Loops'] || 1)} rows kept of ~${Math.round(node['Plan Rows'] + (node['Rows Removed by Filter'] || 0))})`)
  }
  for (const c of node.Plans || []) walk(c, out)
}

const results = []
for (const [name, fn, max = Infinity] of cases) {
  capture = []
  captureMax = max
  try { await fn() } catch (e) { if (e !== STOP) throw e }
  const stmts = capture
  capture = null
  let total = 0
  const scans = []
  const indexes = new Set()
  for (const { sql, params } of stmts) {
    const times = []
    let plan
    await origQuery.call(pgPool(), `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`, params) // warm
    for (let i = 0; i < RUNS; i++) {
      const r = await origQuery.call(pgPool(), `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`, params)
      plan = r.rows[0]['QUERY PLAN'][0]
      times.push(plan['Execution Time'] + plan['Planning Time'])
    }
    times.sort((a, b) => a - b)
    total += times[Math.floor(RUNS / 2)]
    walk(plan.Plan, scans)
    // PLAN=<regex>: also print the readable plan of matching cases.
    if (process.env.PLAN && new RegExp(process.env.PLAN, 'i').test(name)) {
      const t = await origQuery.call(pgPool(), `EXPLAIN (ANALYZE) ${sql}`, params)
      console.log(`\n── ${name}\n` + t.rows.map((r) => r['QUERY PLAN']).join('\n'))
    }
    JSON.stringify(plan.Plan).replace(/"Index Name":"([^"]+)"/g, (_, n) => indexes.add(n))
  }
  results.push({ name, statements: stmts.length, ms: Math.round(total * 100) / 100, fullScans: [...new Set(scans)], indexes: [...indexes] })
  console.log(`${(Math.round(total * 10) / 10).toString().padStart(9)} ms  ${name}${scans.length ? '   FULL SCAN: ' + [...new Set(scans)].join('; ') : ''}`)
}

function pgPool() {
  if (!pgPool.p) pgPool.p = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  return pgPool.p
}

if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(results, null, 2))
process.exit(0)
