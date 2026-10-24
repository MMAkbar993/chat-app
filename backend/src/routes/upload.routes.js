import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import { uploadMessageFile } from '../controllers/upload.controller.js'
import { startChunkedUpload, receiveChunk, completeChunkedUpload } from '../controllers/chunkedUpload.controller.js'
import { SINGLE_UPLOAD_BYTES, UPLOAD_DIR } from '../utils/uploads.js'
import { safeFileFilter } from '../middleware/fileFilters.js'

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `msg-${req.user.id}-${Date.now()}${ext}`)
  },
})
// One request carries at most SINGLE_UPLOAD_BYTES (Cloudflare's limit); bigger files use the
// chunked routes below.
const upload = multer({ storage, limits: { fileSize: SINGLE_UPLOAD_BYTES }, fileFilter: safeFileFilter })

export const uploadRouter = Router()
uploadRouter.use(authMiddleware)
uploadRouter.post('/', upload.single('file'), uploadMessageFile)
uploadRouter.post('/chunked/start', startChunkedUpload)
uploadRouter.put('/chunked/:id/:index', receiveChunk)
uploadRouter.post('/chunked/:id/complete', completeChunkedUpload)
