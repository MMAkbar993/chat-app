import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { authMiddleware } from '../middleware/auth.js'
import { socialConnect, socialCallback, socialDisconnect, saveLinkedinUrl, saveAffiliateRouletteUrl } from '../controllers/social.controller.js'
import { config } from '../config/env.js'
import { findUserById } from '../db/queries/users.js'

// Accepts Bearer token from Authorization header OR ?token= query param
// Needed for OAuth popups which cannot set request headers
async function socialConnectAuth(req, res, next) {
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

export const socialRouter = Router()

// Save LinkedIn URL (URL-only flow, no OAuth)
socialRouter.post('/linkedin/save-url', authMiddleware, saveLinkedinUrl)

// Save Affiliate Roulette listing URL (URL-only flow, no OAuth)
socialRouter.post('/affiliate-roulette/save-url', authMiddleware, saveAffiliateRouletteUrl)

// Initiate OAuth — uses query param token because browser popups can't send headers
socialRouter.get('/:platform/connect', socialConnectAuth, socialConnect)

// OAuth callback — no auth (state carries the userId)
socialRouter.get('/:platform/callback', socialCallback)

// Disconnect a social account
socialRouter.delete('/:platform', authMiddleware, socialDisconnect)
