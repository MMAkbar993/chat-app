import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { createSessionHandler, statusHandler, webhookHandler } from '../controllers/kyc.controller.js'

export const kycRouter = Router()

kycRouter.post('/create-session', authMiddleware, createSessionHandler)
kycRouter.get('/status', authMiddleware, statusHandler)
kycRouter.post('/webhook', webhookHandler)
