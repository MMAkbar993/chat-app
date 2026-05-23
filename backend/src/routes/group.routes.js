import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { listGroups, createGroup, getGroup, updateGroup, addMember, removeMember } from '../controllers/group.controller.js'

export const groupRouter = Router()
groupRouter.use(authMiddleware)

groupRouter.get('/', listGroups)
groupRouter.post('/', createGroup)
groupRouter.get('/:id', getGroup)
groupRouter.patch('/:id', updateGroup)
groupRouter.post('/:id/members', addMember)
groupRouter.delete('/:id/members/:userId', removeMember)
