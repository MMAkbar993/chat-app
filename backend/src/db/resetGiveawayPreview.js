// Clears every Christmas giveaway preview spin and test prize (is_preview), so the giveaway starts
// clean. Run once before launch, after emptying GIVEAWAY_PREVIEW_EMAILS:
//   npm run giveaway:reset-preview
// Real spins and prizes are not touched. Pulse Pro already given by claiming a test prize stays on
// that account; remove it from the admin panel if needed.
import { getClient, checkConnection } from '../config/database.js'

async function run() {
  await checkConnection()
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const spins = await client.query(`DELETE FROM giveaway_spins WHERE is_preview`)
    const wins = await client.query(`DELETE FROM giveaway_wins WHERE is_preview RETURNING claimed_by`)
    await client.query('COMMIT')
    const claimed = wins.rows.filter((r) => r.claimed_by).length
    console.log(`Deleted ${spins.rowCount} preview spins and ${wins.rowCount} test prizes (${claimed} had been claimed on Pulse).`)
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
  process.exit(0)
}

run().catch((err) => {
  console.error('Reset failed:', err)
  process.exit(1)
})
