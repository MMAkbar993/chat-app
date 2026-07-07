import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createSubscriptionHandler,
  createSubscriptionValidators,
  getBillingHandler,
  webhookHandler,
} from '../controllers/payment.controller.js'

export const paymentRouter = Router()

paymentRouter.post('/create-subscription', authMiddleware, createSubscriptionValidators, validate, createSubscriptionHandler)
paymentRouter.get('/billing', authMiddleware, getBillingHandler)
paymentRouter.post('/webhook', webhookHandler)
