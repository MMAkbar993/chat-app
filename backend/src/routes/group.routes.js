import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
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
groupRouter.use(authMiddleware)

// Invite links, keyed by code rather than group id — the caller is not a member yet, so
// they have nothing else to identify the group with. Registered before the /:id routes so
// a literal "invite" segment is never captured as an id.
groupRouter.get('/invite/:code', getInvitePreview)
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
