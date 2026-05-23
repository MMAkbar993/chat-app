import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listCalls, initiateCall, endCall } from '../controllers/call.controller.js'

export const callRouter = Router()
callRouter.use(authMiddleware)

callRouter.get('/', listCalls)
callRouter.post('/', initiateCall)
callRouter.patch('/:id', endCall)
