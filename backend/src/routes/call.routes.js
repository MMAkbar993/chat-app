import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listCalls, initiateCall, endCall, getCallUsage } from '../controllers/call.controller.js'
import { getIceServers } from '../controllers/ice.controller.js'

export const callRouter = Router()
callRouter.use(authMiddleware)

// Served per-call rather than baked into the bundle: TURN credentials are short-lived,
// and the shared secret that mints them must never reach the browser.
callRouter.get('/ice-servers', getIceServers)
callRouter.get('/usage', getCallUsage)
callRouter.get('/', listCalls)
callRouter.post('/', initiateCall)
callRouter.patch('/:id', endCall)
