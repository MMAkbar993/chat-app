import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { findUserById } from '../db/queries/users.js'

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  const token = authHeader.slice(7)
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
