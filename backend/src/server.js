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
import { calendarRouter } from './routes/calendar.routes.js'
import { uploadRouter } from './routes/upload.routes.js'
import { adminRouter } from './routes/admin.routes.js'
import { ogRouter } from './routes/og.routes.js'
import { errorHandler } from './middleware/errorHandler.js'
import { apiLimiter } from './middleware/rateLimit.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp() {
  const app = express()

  // Production runs behind Nginx — without this, express-rate-limit (and anything else keyed on
  // req.ip) sees Nginx's own IP for every request instead of the real client, either rate-limiting
  // everyone as one bucket or not working at all.
  app.set('trust proxy', 1)

  // crossOriginOpenerPolicy disabled: the OAuth connect/callback routes (calendar, social) are
  // opened as popups from the main app and need window.opener to postMessage results back and
  // self-close. Helmet's default "same-origin" COOP severs that link the moment the popup
  // navigates here, since the parent SPA (served statically by Nginx) has no COOP header at all —
  // the mismatch breaks both the popup's own window.close() and postMessage to the opener.
  app.use(helmet({ crossOriginOpenerPolicy: false }))

  // Strict origin whitelist (config.corsOrigins, from CORS_ORIGINS/FRONTEND_URL) instead of a
  // wildcard — required since credentials:true is set (browsers refuse `*` + credentials
  // together anyway, but an unbounded reflect-any-origin function would be just as unsafe for a
  // credentialed, cookie/token-bearing API). Requests with no Origin header (server-to-server
  // webhooks, curl, mobile clients) skip the check entirely — Origin is a browser-only header.
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true)
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  app.use(cookieParser())

  // Baseline abuse/cost protection on every API request; sensitive routes (auth, password reset,
  // admin) additionally stack a tighter route-specific limiter on top (see rateLimit.js).
  app.use('/api', apiLimiter)
  app.use('/u', apiLimiter)
  app.use('/connect', apiLimiter)
  app.use('/uploads', apiLimiter)

  app.use('/api/payment/webhook', express.raw({ type: 'application/json' }))
  app.use('/api/kyc/webhook', express.raw({ type: 'application/json' }))

  app.use(express.json())

  // Serve uploaded files (avatars)
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

  // Static assets referenced by server-rendered pages (e.g. the OAuth popup close/notify script —
  // it has to be an external file, not inline, since the CSP's script-src 'self' blocks inline
  // <script> tags and inline event-handler attributes entirely, with no exception carved out here).
  // Mounted under /api/ specifically — that's the one prefix Nginx is already configured to proxy
  // to this server; a new top-level path like /static wouldn't reach Express in production at all,
  // Nginx would just serve the SPA's index.html for it instead (see DEPLOY.md's proxied paths).
  app.use('/api/static', express.static(path.join(__dirname, '../public')))

  // Public profile page HTML with per-user Open Graph tags, for link-preview scrapers
  // (Telegram/Discord/WhatsApp/etc read raw HTML, not the SPA's JS bundle). Nginx proxies /u/
  // here in production instead of serving the static SPA index.html directly — see DEPLOY.md.
  app.use('/u', ogRouter)

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
  app.use('/api/calendar', calendarRouter)
  // OAuth providers redirect to /connect/{platform}/callback (configured in .env redirect URIs)
  app.use('/connect', socialRouter)
  app.use('/api/upload', uploadRouter)
  app.use('/api/admin', adminRouter)

  app.use(errorHandler)

  return app
}
