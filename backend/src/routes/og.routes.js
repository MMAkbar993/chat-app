import { Router } from 'express'
import { publicProfileOg } from '../controllers/og.controller.js'

export const ogRouter = Router()
ogRouter.get('/:username', publicProfileOg)
