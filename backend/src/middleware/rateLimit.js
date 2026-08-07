import rateLimit from 'express-rate-limit'
import { config } from '../config/env.js'

// Applied globally to every /api request (see server.js) as a baseline defense against brute
// force, scripted abuse, and runaway infra cost from any single client — independent of the
// tighter per-endpoint limiters below, which stack on top of this for sensitive routes.
// Configurable via RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX; defaults to 100 requests/minute/IP.
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.max,
  standardHeaders: true, // adds RateLimit-Limit / RateLimit-Remaining / RateLimit-Reset headers
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and try again shortly.' },
})

const AUTH_LIMIT_OPTS = {
  windowMs: config.rateLimit.authWindowMs,
  limit: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
}

// Each of these gets its OWN limiter instance (own in-memory store), even though the config is
// identical — express-rate-limit keys by IP alone by default, so reusing a single instance across
// unrelated endpoints (e.g. regular login and admin login) would make heavy use of one
// accidentally lock out a completely different one, sharing one bucket that was never meant to be
// shared.
export const authLimiter = rateLimit(AUTH_LIMIT_OPTS)
export const twoFactorVerifyLimiter = rateLimit(AUTH_LIMIT_OPTS)
export const adminAuthLimiter = rateLimit(AUTH_LIMIT_OPTS)

// Admin bootstrap signup — public and unauthenticated by design (see admin.controller.js), so it
// needs its own floor even though it self-locks after the first admin exists.
export const adminSignupLimiter = rateLimit(AUTH_LIMIT_OPTS)

// Password reset (forgot-password/verify-otp/reset-password) — tighter, since this path can also
// be abused to spam someone's inbox with OTP emails or brute-force a 6-digit code.
export const passwordResetLimiter = rateLimit({
  windowMs: config.rateLimit.passwordResetWindowMs,
  limit: config.rateLimit.passwordResetMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
})
