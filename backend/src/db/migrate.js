import { readFileSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { query, checkConnection } from '../config/database.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// A file starting with this line runs one statement at a time instead of as one batch.
// CREATE INDEX CONCURRENTLY needs that: Postgres refuses it inside a batch (an implicit
// transaction). Statements are split on a semicolon at the end of a line, so keep each
// statement ending that way and avoid semicolons at line ends inside one.
const NO_TRANSACTION = '-- migrate: no-transaction'

// A concurrent build that fails part way (a deploy killed mid-build, say) leaves an INVALID
// index behind. IF NOT EXISTS would then skip it forever and queries would never use it, so
// drop any invalid index of that name before building it again.
async function dropInvalidIndex(statement) {
  const m = statement.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY\s+IF\s+NOT\s+EXISTS\s+(\w+)/i)
  if (!m) return
  const { rows } = await query(
    `SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
     WHERE c.relname = $1 AND NOT i.indisvalid`,
    [m[1]]
  )
  if (rows.length) {
    console.log(`  Rebuilding invalid index ${m[1]}`)
    await query(`DROP INDEX CONCURRENTLY IF EXISTS ${m[1]}`)
  }
}

async function migrate() {
  await checkConnection()

  const migDir = join(__dirname, 'migrations')
  const files = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort()

  for (const file of files) {
    console.log(`Running migration: ${file}`)
    const sql = readFileSync(join(migDir, file), 'utf8')
    if (sql.startsWith(NO_TRANSACTION)) {
      const statements = sql
        .split(/;\s*$/m)
        .map((s) => s.replace(/^\s*--.*$/gm, '').trim())
        .filter(Boolean)
      for (const statement of statements) {
        await dropInvalidIndex(statement)
        await query(statement)
      }
    } else {
      await query(sql)
    }
    console.log(`  Done: ${file}`)
  }

  console.log('All migrations completed successfully')
  process.exit(0)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
