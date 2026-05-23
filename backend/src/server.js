import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config/env.js'
import { authRouter } from './routes/auth.routes.js'
import { paymentRouter } from './routes/payment.routes.js'
import { kycRouter } from './routes/kyc.routes.js'
import { conversationRouter } from './routes/conversation.routes.js'
import { messageRouter } from './routes/message.routes.js'
import { contactRouter } from './routes/contact.routes.js'
import { groupRouter } from './routes/group.routes.js'
import { callRouter } from './routes/call.routes.js'
import { userRouter } from './routes/user.routes.js'
import { socialRouter } from './routes/social.routes.js'
import { uploadRouter } from './routes/upload.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: config.frontendUrl, credentials: true }))
  app.use(cookieParser())

  app.use('/api/payment/webhook', express.raw({ type: 'application/json' }))
  app.use('/api/kyc/webhook', express.raw({ type: 'application/json' }))

  app.use(express.json())

  // Serve uploaded files (avatars)
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

  app.use('/api/auth', authRouter)
  app.use('/api/payment', paymentRouter)
  app.use('/api/kyc', kycRouter)
  app.use('/api/conversations', conversationRouter)
  app.use('/api/conversations', messageRouter)
  app.use('/api/contacts', contactRouter)
  app.use('/api/groups', groupRouter)
  app.use('/api/calls', callRouter)
  app.use('/api/users', userRouter)
  app.use('/api/social', socialRouter)
  app.use('/api/upload', uploadRouter)

  app.use(errorHandler)

  return app
}
