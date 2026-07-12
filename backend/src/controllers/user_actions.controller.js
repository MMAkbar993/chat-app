import { blockUser, unblockUser, reportUser } from '../db/queries/user_actions.js'
import { getIo } from '../socket/index.js'
import { query } from '../config/database.js'
import { sendFeedbackNotification } from '../config/email.js'

const FEEDBACK_TYPES = ['bug', 'feature', 'other']

export async function blockUserHandler(req, res, next) {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot block yourself' })
    await blockUser(req.user.id, req.params.id)
    const io = getIo()
    if (io) io.to(`user:${req.user.id}`).emit('reload-conversations')
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function unblockUserHandler(req, res, next) {
  try {
    await unblockUser(req.user.id, req.params.id)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function reportUserHandler(req, res, next) {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot report yourself' })
    const { reason } = req.body
    await reportUser({ reporterId: req.user.id, reportedUserId: req.params.id, reason })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function submitFeedback(req, res, next) {
  try {
    const type = FEEDBACK_TYPES.includes(req.body.type) ? req.body.type : 'other'
    const message = (req.body.message || '').trim()
    if (!message) return res.status(400).json({ error: 'Message is required' })
    if (message.length > 5000) return res.status(400).json({ error: 'Message is too long' })

    await query(
      `INSERT INTO feedback_reports (user_id, type, message) VALUES ($1, $2, $3)`,
      [req.user.id, type, message]
    )
    sendFeedbackNotification({ type, message, userEmail: req.user.email, username: req.user.username }).catch(() => {})
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
