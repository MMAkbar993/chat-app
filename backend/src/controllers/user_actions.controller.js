import { blockUser, unblockUser, reportUser } from '../db/queries/user_actions.js'

export async function blockUserHandler(req, res, next) {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot block yourself' })
    await blockUser(req.user.id, req.params.id)
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
