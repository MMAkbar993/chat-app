import { query } from '../../config/database.js'

export async function getCalendarConnection(userId) {
  const result = await query(
    `SELECT access_token, refresh_token, token_expires_at FROM google_calendar_connections WHERE user_id = $1`,
    [userId]
  )
  return result.rows[0] || null
}

export async function upsertCalendarConnection(userId, { accessToken, refreshToken, tokenExpiresAt }) {
  await query(
    `INSERT INTO google_calendar_connections (user_id, access_token, refresh_token, token_expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, google_calendar_connections.refresh_token),
       token_expires_at = EXCLUDED.token_expires_at`,
    [userId, accessToken, refreshToken || null, tokenExpiresAt]
  )
}

export async function deleteCalendarConnection(userId) {
  await query(`DELETE FROM google_calendar_connections WHERE user_id = $1`, [userId])
}
