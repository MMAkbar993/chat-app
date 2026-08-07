import 'dotenv/config'

const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
]

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`)
    process.exit(1)
  }
}

// Stripe supports two naming conventions in .env
const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET
const stripePublishable = process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_KEY
const stripeMonthlyPrice = process.env.STRIPE_MONTHLY_PRICE_ID || process.env.STRIPE_PRICE_ID_MONTHLY
const stripeYearlyPrice = process.env.STRIPE_YEARLY_PRICE_ID || process.env.STRIPE_PRICE_ID_YEARLY
const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET || ''

export const config = Object.freeze({
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  stripeSecretKey: stripeSecret || '',
  stripePublishableKey: stripePublishable || '',
  stripeWebhookSecret: stripeWebhook,
  stripeMonthlyPriceId: stripeMonthlyPrice || '',
  stripeYearlyPriceId: stripeYearlyPrice || '',
  diditApiKey: process.env.DIDIT_API_KEY || '',
  diditWorkflowId: process.env.DIDIT_WORKFLOW_ID || '',
  diditWebhookSecret: process.env.DIDIT_WEBHOOK_SECRET || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Comma-separated list of allowed browser origins. Falls back to FRONTEND_URL so single-origin
  // deployments need no extra config; set CORS_ORIGINS explicitly to allow more than one
  // (e.g. a staging domain alongside production, or apex + www).
  corsOrigins: (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',').map((o) => o.trim()).filter(Boolean),

  rateLimit: {
    // General per-IP cap applied to every /api request.
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(60 * 1000), 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    // Tighter cap for register/login/2FA-verify (brute-force-sensitive).
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000), 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
    // Tightest cap for password-reset/OTP flows (can spam an inbox or be brute-forced).
    passwordResetWindowMs: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000), 10),
    passwordResetMax: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX || '5', 10),
  },
})
