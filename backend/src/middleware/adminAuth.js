import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { findAdminById } from '../db/queries/admin.js'

export async function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    if (!payload.isAdmin) return res.status(403).json({ error: 'Admin access required' })
    const admin = await findAdminById(payload.id)
    if (!admin) return res.status(401).json({ error: 'Admin not found' })
    req.admin = admin
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
