import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { authMiddleware } from '../middleware/auth.js'
import { imageOnlyFilter } from '../middleware/fileFilters.js'
import {
  listMyBusinesses, createMyBusiness, updateMyBusiness, deleteMyBusiness,
  uploadBusinessLogo, uploadBusinessCover, getPublicBusiness,
} from '../controllers/business.controller.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '../../uploads')

// The "business-" prefix is what tells uploadsGuard these are public files, like avatars and
// ad creative — a business profile is meant to be opened by people who aren't signed in.
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `business-${req.params.id}-${Date.now()}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageOnlyFilter })

export const businessRouter = Router()

// Public share link target, before the auth gate below.
businessRouter.get('/slug/:slug', getPublicBusiness)

businessRouter.use(authMiddleware)
businessRouter.get('/me', listMyBusinesses)
businessRouter.post('/', createMyBusiness)
businessRouter.patch('/:id', updateMyBusiness)
businessRouter.delete('/:id', deleteMyBusiness)
businessRouter.post('/:id/logo', upload.single('file'), uploadBusinessLogo)
businessRouter.post('/:id/cover', upload.single('file'), uploadBusinessCover)
