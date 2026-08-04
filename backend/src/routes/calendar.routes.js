import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { authMiddleware } from '../middleware/auth.js'
import { config } from '../config/env.js'
import { findUserById } from '../db/queries/users.js'
import { calendarConnect, calendarCallback, getCalendarStatus, scheduleMeeting, calendarDisconnect } from '../controllers/calendar.controller.js'

// Same pattern as social.routes.js's socialConnectAuth — OAuth popups can't set headers, so accept
// the token via query string too.
async function connectAuth(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token
  if (!token) return res.status(401).json({ error: 'No token provided' })
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    const user = await findUserById(payload.id)
    if (!user) return res.status(401).json({ error: 'User not found' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export const calendarRouter = Router()

calendarRouter.get('/connect', connectAuth, calendarConnect)
calendarRouter.get('/callback', calendarCallback)
calendarRouter.get('/status', authMiddleware, getCalendarStatus)
calendarRouter.post('/schedule-meeting', authMiddleware, scheduleMeeting)
calendarRouter.delete('/disconnect', authMiddleware, calendarDisconnect)
