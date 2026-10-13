import { query } from '../config/database.js'
import { getIo } from '../socket/index.js'

// Stores an in-app notification and pushes it live to the member's open sessions. Never throws:
// a notification is a courtesy, and the action that triggered it has already succeeded.
export async function createNotification(userId, type, data = {}) {
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, type, data) VALUES ($1, $2, $3) RETURNING id`,
      [userId, type, JSON.stringify(data)]
    )
    const io = getIo()
    if (io) {
      io.to(`user:${userId}`).emit('notification', { id: result.rows[0].id, type, data })
    }
  } catch (err) {
    console.error('createNotification failed', err)
  }
}
