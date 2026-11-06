import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { getGiveawayState, spinGiveaway, giveawayEntrantAuth } from '../controllers/giveaway.controller.js'

// One spin a day is enforced in the database; this only stops a script hammering the endpoint.
const spinLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a moment.' },
})

export const giveawayRouter = Router()

giveawayRouter.get('/state', getGiveawayState)
giveawayRouter.post('/spin', spinLimiter, giveawayEntrantAuth, spinGiveaway)
