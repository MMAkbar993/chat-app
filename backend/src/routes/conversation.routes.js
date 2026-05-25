import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
  listConversations, getOrCreateDirect, getConversation, markConversationRead, markConversationUnread,
  archiveConversation, pinConversation, favoriteConversation, muteConversation,
  deleteConversation, clearConversation,
} from '../controllers/conversation.controller.js'

export const conversationRouter = Router()
conversationRouter.use(authMiddleware)

conversationRouter.get('/', listConversations)
conversationRouter.post('/direct', getOrCreateDirect)
conversationRouter.get('/:id', getConversation)
conversationRouter.patch('/:id/read', markConversationRead)
conversationRouter.patch('/:id/mark-unread', markConversationUnread)
conversationRouter.patch('/:id/archive', archiveConversation)
conversationRouter.patch('/:id/pin', pinConversation)
conversationRouter.patch('/:id/favorite', favoriteConversation)
conversationRouter.patch('/:id/mute', muteConversation)
conversationRouter.delete('/:id/messages', clearConversation)
conversationRouter.delete('/:id', deleteConversation)
