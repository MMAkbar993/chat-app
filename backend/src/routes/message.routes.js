import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listMessages, sendMessage, removeMessage, removeMessageForMe, forwardMessage, toggleReactionHandler } from '../controllers/message.controller.js'

export const messageRouter = Router()
messageRouter.use(authMiddleware)

messageRouter.get('/:conversationId/messages', listMessages)
messageRouter.post('/:conversationId/messages', sendMessage)
messageRouter.delete('/messages/:id', removeMessage)
messageRouter.delete('/messages/:id/for-me', removeMessageForMe)
messageRouter.post('/messages/:messageId/forward', forwardMessage)
messageRouter.post('/messages/:messageId/reactions', toggleReactionHandler)
