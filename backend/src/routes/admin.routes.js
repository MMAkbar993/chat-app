import { Router } from 'express'
import { adminAuthMiddleware } from '../middleware/adminAuth.js'
import {
  adminSignup,
  adminLogin,
  adminMe,
  dashboard,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  getUserDetailHandler,
  changeUserPackage,
  listReports,
  billingOverview,
  listVerifiedWebsites,
  listRepresentationRequests,
  representationAction,
  createBroadcast,
  listBroadcasts,
  listSystemEmails,
  updateSystemEmail,
  listGroups,
  listConversations,
  listCalls,
  updateProfile,
  changePassword,
} from '../controllers/admin.controller.js'

export const adminRouter = Router()

// Public
adminRouter.post('/signup', adminSignup)
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
adminRouter.get('/users/:id', getUserDetailHandler)
adminRouter.patch('/users/:id/package', changeUserPackage)

adminRouter.get('/reports', listReports)

adminRouter.get('/billing/overview', billingOverview)

adminRouter.get('/websites', listVerifiedWebsites)
adminRouter.get('/websites/representation-requests', listRepresentationRequests)
adminRouter.post('/websites/representation-requests/:id/action', representationAction)

adminRouter.post('/broadcasts', createBroadcast)
adminRouter.get('/broadcasts', listBroadcasts)

adminRouter.get('/system-emails', listSystemEmails)
adminRouter.patch('/system-emails/:key', updateSystemEmail)

adminRouter.get('/groups', listGroups)
adminRouter.get('/conversations', listConversations)
adminRouter.get('/calls', listCalls)

adminRouter.put('/settings/profile', updateProfile)
adminRouter.post('/settings/password', changePassword)
