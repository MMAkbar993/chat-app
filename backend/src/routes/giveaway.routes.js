import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { getGiveawayState, spinGiveaway, giveawayEntrantAuth, joinStart, joinVerify } from '../controllers/giveaway.controller.js'

// One spin a day is enforced in the database; this only stops a script hammering the endpoint.
const spinLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a moment.' },
})

// Asking for codes and trying them: enough for a real person who mistypes, not for guessing.
const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
})

export const giveawayRouter = Router()

giveawayRouter.get('/state', getGiveawayState)
giveawayRouter.post('/spin', spinLimiter, giveawayEntrantAuth, spinGiveaway)
giveawayRouter.post('/join/start', joinLimiter, joinStart)
giveawayRouter.post('/join/verify', joinLimiter, joinVerify)
