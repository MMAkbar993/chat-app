import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { uploadMessageFile } from '../controllers/upload.controller.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '../../uploads')

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `msg-${req.user.id}-${Date.now()}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } })

export const uploadRouter = Router()
uploadRouter.use(authMiddleware)
uploadRouter.post('/', upload.single('file'), uploadMessageFile)
