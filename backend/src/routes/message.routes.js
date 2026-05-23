import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listMessages, sendMessage, removeMessage, forwardMessage } from '../controllers/message.controller.js'

export const messageRouter = Router()
messageRouter.use(authMiddleware)

messageRouter.get('/:conversationId/messages', listMessages)
messageRouter.post('/:conversationId/messages', sendMessage)
messageRouter.delete('/messages/:id', removeMessage)
messageRouter.post('/messages/:messageId/forward', forwardMessage)
