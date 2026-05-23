import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createSubscriptionHandler,
  createSubscriptionValidators,
  webhookHandler,
} from '../controllers/payment.controller.js'

export const paymentRouter = Router()

paymentRouter.post('/create-subscription', authMiddleware, createSubscriptionValidators, validate, createSubscriptionHandler)
paymentRouter.post('/webhook', webhookHandler)
