import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  getProfile, updateProfile, uploadAvatar, getUserById,
  getPublicProfile, getMySocialConnections, getBlockedUsers, deactivateAccount,
  changePassword, changeEmail, deleteMyAccount, clearAllChats, deleteAllChats,
  initWebsiteVerification, confirmWebsiteVerification, removeWebsiteVerification,
  requestRepresentation, getRepresentationRequests, handleRepresentationRequest,
  getApprovedRepresentatives, revokeRepresentative,
  getWebsiteRepresentatives, transferWebsiteOwnership,
  getNotifications, markNotificationsRead, getMyVerifiedWebsites, revokeRepresentation,
  getMyRepresentationStatus, cancelRepresentationRequest,
} from '../controllers/user.controller.js'
import { blockUserHandler, unblockUserHandler, reportUserHandler } from '../controllers/user_actions.controller.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '../../uploads')

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

export const userRouter = Router()

// Public route — no auth required
userRouter.get('/profile/:username', getPublicProfile)

userRouter.use(authMiddleware)

userRouter.get('/me', getProfile)
userRouter.get('/me/social', getMySocialConnections)
userRouter.get('/me/blocked', getBlockedUsers)
userRouter.patch('/me', updateProfile)
userRouter.patch('/me/deactivate', deactivateAccount)
userRouter.patch('/me/password', changePassword)
userRouter.patch('/me/email', changeEmail)
userRouter.delete('/me', deleteMyAccount)
userRouter.patch('/me/chats/clear', clearAllChats)
userRouter.delete('/me/chats', deleteAllChats)
userRouter.get('/me/websites', getMyVerifiedWebsites)
userRouter.post('/me/website/verify-init', initWebsiteVerification)
userRouter.post('/me/website/verify-confirm', confirmWebsiteVerification)
userRouter.post('/me/website/request-representation', requestRepresentation)
userRouter.delete('/me/website/representation', revokeRepresentation)
userRouter.get('/me/website/:id/representatives', getWebsiteRepresentatives)
userRouter.post('/me/website/:id/transfer', transferWebsiteOwnership)
userRouter.delete('/me/website/:id', removeWebsiteVerification)
userRouter.get('/me/website/representatives', getApprovedRepresentatives)
userRouter.delete('/me/website/representatives/:userId', revokeRepresentative)
userRouter.get('/me/website/representation-requests', getRepresentationRequests)
userRouter.patch('/me/website/representation-requests/:id', handleRepresentationRequest)
userRouter.get('/me/website/my-requests', getMyRepresentationStatus)
userRouter.delete('/me/website/my-requests/:id', cancelRepresentationRequest)
userRouter.get('/me/notifications', getNotifications)
userRouter.patch('/me/notifications/read-all', markNotificationsRead)
userRouter.post('/me/avatar', upload.single('avatar'), uploadAvatar)
userRouter.get('/:id', getUserById)
userRouter.post('/:id/block', blockUserHandler)
userRouter.delete('/:id/block', unblockUserHandler)
userRouter.post('/:id/report', reportUserHandler)
