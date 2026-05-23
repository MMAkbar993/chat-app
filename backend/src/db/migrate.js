import { readFileSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { query, checkConnection } from '../config/database.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function migrate() {
  await checkConnection()

  const migDir = join(__dirname, 'migrations')
  const files = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort()

  for (const file of files) {
    console.log(`Running migration: ${file}`)
    const sql = readFileSync(join(migDir, file), 'utf8')
    await query(sql)
    console.log(`  Done: ${file}`)
  }

  console.log('All migrations completed successfully')
  process.exit(0)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
