import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { socialConnect, socialCallback, socialDisconnect } from '../controllers/social.controller.js'

export const socialRouter = Router()

// Initiate OAuth (user must be logged in)
socialRouter.get('/:platform/connect', authMiddleware, socialConnect)

// OAuth callback — no authMiddleware (state carries the userId)
socialRouter.get('/:platform/callback', socialCallback)

// Disconnect a social account
socialRouter.delete('/:platform', authMiddleware, socialDisconnect)
