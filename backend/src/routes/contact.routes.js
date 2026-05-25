import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listContacts, addContactHandler, removeContactHandler, searchUsersHandler, updateContactHandler, sendInviteHandler } from '../controllers/contact.controller.js'

export const contactRouter = Router()
contactRouter.use(authMiddleware)

contactRouter.get('/search', searchUsersHandler)
contactRouter.get('/', listContacts)
contactRouter.post('/', addContactHandler)
contactRouter.patch('/:contactId', updateContactHandler)
contactRouter.delete('/:contactId', removeContactHandler)
contactRouter.post('/invite', sendInviteHandler)
