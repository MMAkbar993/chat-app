import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { getMyAd, clickAd, dismiss } from '../controllers/ads.controller.js'

export const adsRouter = Router()
adsRouter.use(authMiddleware)

adsRouter.get('/current', getMyAd)
adsRouter.post('/:id/click', clickAd)
adsRouter.post('/:id/dismiss', dismiss)
