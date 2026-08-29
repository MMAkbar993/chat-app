import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { getLinkPreview } from '../controllers/linkPreview.controller.js'

export const linkPreviewRouter = Router()

linkPreviewRouter.get('/', authMiddleware, getLinkPreview)
