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

// Same identity resolution as authMiddleware, but a missing or invalid token isn't an error —
// req.user is just left unset. For routes a signed-out visitor is meant to reach too (a shared
// link's preview, which should show something before asking anyone to sign in) but that still
// want to know who's asking when there happens to be a valid session.
export async function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next()
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    const user = await findUserById(payload.id)
    if (user) req.user = user
  } catch {
    // Expired/invalid token on an optional-auth route — proceed as signed out rather than
    // failing a request that doesn't actually require a session.
  }
  next()
}
