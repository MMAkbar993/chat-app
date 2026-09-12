import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listCalls, initiateCall, endCall, getCallUsage } from '../controllers/call.controller.js'
import { getRtcToken } from '../controllers/agora.controller.js'

export const callRouter = Router()
callRouter.use(authMiddleware)

callRouter.get('/usage', getCallUsage)
callRouter.get('/', listCalls)
callRouter.post('/', initiateCall)
// Minted per user per call; the handler refuses anyone who isn't in the call.
callRouter.get('/:id/token', getRtcToken)
callRouter.patch('/:id', endCall)
