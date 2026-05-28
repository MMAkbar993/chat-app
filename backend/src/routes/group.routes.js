import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { listGroups, createGroup, getGroup, updateGroup, addMember, removeMember, leaveGroup, uploadGroupAvatar } from '../controllers/group.controller.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '../../uploads')

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `group-${req.params.id}-${Date.now()}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

export const groupRouter = Router()
groupRouter.use(authMiddleware)

groupRouter.get('/', listGroups)
groupRouter.post('/', createGroup)
groupRouter.get('/:id', getGroup)
groupRouter.patch('/:id', updateGroup)
groupRouter.post('/:id/avatar', upload.single('avatar'), uploadGroupAvatar)
groupRouter.post('/:id/members', addMember)
groupRouter.delete('/:id/members/:userId', removeMember)
groupRouter.delete('/:id/leave', leaveGroup)
