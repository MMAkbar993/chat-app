import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { adminAuthMiddleware } from '../middleware/adminAuth.js'
import { imageOnlyFilter } from '../middleware/fileFilters.js'
import { adminAuthLimiter, adminSignupLimiter } from '../middleware/rateLimit.js'
import {
  adminSignup,
  adminLogin,
  adminTwoFactorVerify,
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
  listBusinesses, deleteBusinessAsAdmin, reassignWebsiteAdmin,
  createBroadcast,
  listBroadcasts,
  listSystemEmails,
  updateSystemEmail,
  listGroups,
  listConversations,
  listCalls,
  updateProfile,
  changePassword,
  adminListAds,
  adminCreateAd,
  adminUpdateAd,
  adminDeleteAd,
  adminUploadAdImage,
} from '../controllers/admin.controller.js'

export const adminRouter = Router()

// Public
adminRouter.post('/signup', adminSignupLimiter, adminSignup)
adminRouter.post('/login', adminAuthLimiter, adminLogin)
adminRouter.post('/2fa-verify', adminAuthLimiter, adminTwoFactorVerify)

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
adminRouter.post('/websites/:websiteId/reassign', reassignWebsiteAdmin)
adminRouter.get('/businesses', listBusinesses)
adminRouter.delete('/businesses/:id', deleteBusinessAsAdmin)

adminRouter.post('/broadcasts', createBroadcast)
adminRouter.get('/broadcasts', listBroadcasts)

adminRouter.get('/system-emails', listSystemEmails)
adminRouter.patch('/system-emails/:key', updateSystemEmail)

adminRouter.get('/groups', listGroups)
adminRouter.get('/conversations', listConversations)
adminRouter.get('/calls', listCalls)

adminRouter.put('/settings/profile', updateProfile)
adminRouter.post('/settings/password', changePassword)

// Ad creative is stored alongside other uploads and served from our own domain, so a
// sponsored slot never pulls an image from an advertiser-controlled host.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adImageStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => cb(null, `ad-${Date.now()}${path.extname(file.originalname)}`),
})
const adImageUpload = multer({ storage: adImageStorage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: imageOnlyFilter })

adminRouter.get('/ads', adminListAds)
adminRouter.post('/ads', adminCreateAd)
adminRouter.put('/ads/:id', adminUpdateAd)
adminRouter.delete('/ads/:id', adminDeleteAd)
adminRouter.post('/ads/upload', adImageUpload.single('image'), adminUploadAdImage)
