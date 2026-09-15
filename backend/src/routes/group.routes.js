import { Router } from 'express'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  listGroups, createGroup, getGroup, updateGroup, addMember, removeMember, leaveGroup, uploadGroupAvatar,
  createInviteLink, revokeInviteLink, getInvitePreview, joinByInvite, deleteGroup,
} from '../controllers/group.controller.js'
import { imageOnlyFilter } from '../middleware/fileFilters.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '../../uploads')

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `group-${req.params.id}-${Date.now()}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageOnlyFilter })

export const groupRouter = Router()

// Public preview of an invite link — reachable by someone who isn't signed in yet, so the
// share page can show the group's name/logo/member count before asking them to sign in
// (rather than a bare "sign in to see what this is"). Registered ahead of the router-wide
// authMiddleware below, and before the /:id routes so a literal "invite" segment is never
// captured as an id. Actually joining still requires a real session.
groupRouter.get('/invite/:code', optionalAuthMiddleware, getInvitePreview)

groupRouter.use(authMiddleware)

groupRouter.post('/invite/:code/join', joinByInvite)

groupRouter.get('/', listGroups)
groupRouter.post('/', createGroup)
groupRouter.get('/:id', getGroup)
groupRouter.patch('/:id', updateGroup)
groupRouter.post('/:id/avatar', upload.single('avatar'), uploadGroupAvatar)
groupRouter.post('/:id/members', addMember)
groupRouter.delete('/:id/members/:userId', removeMember)
groupRouter.delete('/:id/leave', leaveGroup)
groupRouter.post('/:id/invite', createInviteLink)
groupRouter.delete('/:id/invite', revokeInviteLink)

// Deletes the group for everyone — distinct from /leave, which only removes the caller.
groupRouter.delete('/:id', deleteGroup)
