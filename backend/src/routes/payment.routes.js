import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createSubscriptionHandler,
  createSubscriptionValidators,
  getBillingHandler,
  cancelSubscriptionHandler,
  resumeSubscriptionHandler,
  webhookHandler,
} from '../controllers/payment.controller.js'

export const paymentRouter = Router()

paymentRouter.post('/create-subscription', authMiddleware, createSubscriptionValidators, validate, createSubscriptionHandler)
paymentRouter.get('/billing', authMiddleware, getBillingHandler)
paymentRouter.post('/cancel-subscription', authMiddleware, cancelSubscriptionHandler)
paymentRouter.post('/resume-subscription', authMiddleware, resumeSubscriptionHandler)
paymentRouter.post('/webhook', webhookHandler)
