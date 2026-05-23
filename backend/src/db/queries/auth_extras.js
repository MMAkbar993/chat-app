import { query } from '../../config/database.js'

// ── Password reset OTPs ──────────────────────────────────────────────────────

export async function saveOtp(userId, otpHash, expiresAt) {
  await query(
    `DELETE FROM password_reset_otps WHERE user_id = $1`,
    [userId]
  )
  await query(
    `INSERT INTO password_reset_otps (user_id, otp_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, otpHash, expiresAt]
  )
}

export async function findValidOtp(userId) {
  const result = await query(
    `SELECT * FROM password_reset_otps
     WHERE user_id = $1 AND used = false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  )
  return result.rows[0] || null
}

export async function markOtpUsed(id) {
  await query(`UPDATE password_reset_otps SET used = true WHERE id = $1`, [id])
}

export async function updatePasswordHash(userId, passwordHash) {
  await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [passwordHash, userId]
  )
}

// ── Two-factor authentication ────────────────────────────────────────────────

export async function setTwoFactorSecret(userId, secret) {
  await query(
    `UPDATE users SET two_factor_secret = $1 WHERE id = $2`,
    [secret, userId]
  )
}

export async function enableTwoFactor(userId) {
  await query(
    `UPDATE users SET two_factor_enabled = true WHERE id = $1`,
    [userId]
  )
}

export async function disableTwoFactor(userId) {
  await query(
    `UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1`,
    [userId]
  )
}

export async function getTwoFactorFields(userId) {
  const result = await query(
    `SELECT two_factor_enabled, two_factor_secret FROM users WHERE id = $1`,
    [userId]
  )
  return result.rows[0] || null
}

// ── Social connections ───────────────────────────────────────────────────────

export async function upsertSocialConnection(userId, platform, data) {
  await query(
    `INSERT INTO social_connections (user_id, platform, platform_user_id, username, display_name, profile_url, access_token, refresh_token, token_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id, platform) DO UPDATE SET
       platform_user_id = EXCLUDED.platform_user_id,
       username         = EXCLUDED.username,
       display_name     = EXCLUDED.display_name,
       profile_url      = EXCLUDED.profile_url,
       access_token     = EXCLUDED.access_token,
       refresh_token    = EXCLUDED.refresh_token,
       token_expires_at = EXCLUDED.token_expires_at,
       updated_at       = NOW()`,
    [
      userId, platform,
      data.platformUserId || null,
      data.username || null,
      data.displayName || null,
      data.profileUrl || null,
      data.accessToken || null,
      data.refreshToken || null,
      data.tokenExpiresAt || null,
    ]
  )
}

export async function deleteSocialConnection(userId, platform) {
  await query(
    `DELETE FROM social_connections WHERE user_id = $1 AND platform = $2`,
    [userId, platform]
  )
}

export async function getSocialConnections(userId) {
  const result = await query(
    `SELECT platform, username, display_name, profile_url, created_at
     FROM social_connections WHERE user_id = $1 ORDER BY platform`,
    [userId]
  )
  return result.rows
}

export async function getPublicSocialConnections(userId) {
  const result = await query(
    `SELECT platform, username, display_name, profile_url
     FROM social_connections WHERE user_id = $1 ORDER BY platform`,
    [userId]
  )
  return result.rows
}
