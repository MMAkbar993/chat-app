import { Router } from 'express'
import { adminAuthMiddleware } from '../middleware/adminAuth.js'
import {
  adminLogin,
  adminMe,
  dashboard,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  listGroups,
  listConversations,
  listCalls,
  updateProfile,
  changePassword,
} from '../controllers/admin.controller.js'

export const adminRouter = Router()

// Public
adminRouter.post('/login', adminLogin)

// Protected — all routes below require admin token
adminRouter.use(adminAuthMiddleware)

adminRouter.get('/me', adminMe)
adminRouter.get('/dashboard', dashboard)

adminRouter.get('/users', listUsers)
adminRouter.post('/users', createUser)
adminRouter.put('/users/:id', updateUser)
adminRouter.delete('/users/:id', deleteUser)
adminRouter.post('/users/:id/block', blockUser)
adminRouter.post('/users/:id/unblock', unblockUser)

adminRouter.get('/groups', listGroups)
adminRouter.get('/conversations', listConversations)
adminRouter.get('/calls', listCalls)

adminRouter.put('/settings/profile', updateProfile)
adminRouter.post('/settings/password', changePassword)
