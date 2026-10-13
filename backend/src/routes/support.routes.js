import { Router } from 'express'
import { contactSupport } from '../controllers/support.controller.js'
import { supportContactLimiter } from '../middleware/rateLimit.js'

// Public: the help bubble on the marketing pages.
export const supportRouter = Router()

supportRouter.post('/contact', supportContactLimiter, contactSupport)
