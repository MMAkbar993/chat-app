import pg from 'pg'
import { config } from './env.js'

const { Pool } = pg

const pool = new Pool({ connectionString: config.databaseUrl })

pool.on('error', (err) => {
  console.error('Unexpected DB client error:', err)
})

export const query = (text, params) => pool.query(text, params)

export const getClient = () => pool.connect()

export async function checkConnection() {
  try {
    await pool.query('SELECT 1')
    console.log('Database connected')
  } catch (err) {
    console.error('Database connection failed:', err)
    process.exit(1)
  }
}
