import { query } from '../config/database.js'

// The bell menu: list, mark read, clear.

export async function getNotifications(req, res, next) {
  try {
    const result = await query(
      `SELECT id, type, data, read, created_at FROM notifications
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    )
    res.json({ notifications: result.rows })
  } catch (err) {
    next(err)
  }
}

export async function markNotificationsRead(req, res, next) {
  try {
    await query(
      `UPDATE notifications SET read = true WHERE user_id = $1`,
      [req.user.id]
    )
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function clearNotifications(req, res, next) {
  try {
    await query(`DELETE FROM notifications WHERE user_id = $1`, [req.user.id])
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
