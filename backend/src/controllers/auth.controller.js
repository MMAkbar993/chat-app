import { body } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import { validate } from '../middleware/validate.js'
import { config } from '../config/env.js'
import { sendPasswordResetOtp } from '../config/email.js'
import {
  registerUser,
  loginUser,
  signTokens,
  refreshAccessToken,
  findUserById,
} from '../services/auth.service.js'
import { findUserByEmail } from '../db/queries/users.js'
import {
  saveOtp,
  findValidOtp,
  markOtpUsed,
  updatePasswordHash,
  setTwoFactorSecret,
  enableTwoFactor,
  disableTwoFactor,
  getTwoFactorFields,
} from '../db/queries/auth_extras.js'

const REFRESH_COOKIE_OPTIONS = (nodeEnv) => ({
  httpOnly: true,
  secure: nodeEnv === 'production',
  sameSite: nodeEnv === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
})

export const registerValidators = [
  body('full_name').trim().notEmpty().withMessage('Full name is required').isLength({ max: 255 }),
  body('username').trim().notEmpty().withMessage('Username is required')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be alphanumeric')
    .isLength({ min: 3, max: 30 }),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('primary_role').isIn([
    'affiliate_publisher', 'casino_operator', 'affiliate_manager', 'game_provider',
    'payment_provider', 'platform_provider', 'media_seo_agency', 'event_organizer',
    'influencer_streamer', 'investor_advisor', 'compliance_legal', 'kyc_aml_provider', 'other',
  ]).withMessage('Invalid primary role'),
  body('phone').optional({ checkFalsy: true }).matches(/^\+?[0-9\s\-()\+]{7,20}$/).withMessage('Invalid phone number'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match')
    return true
  }),
]

export const loginValidators = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
]

export async function register(req, res, next) {
  try {
    const { full_name, username, country, email, primary_role, phone, password } = req.body
    const user = await registerUser({ full_name, username, country, email, primary_role, phone, password })
    const { accessToken, refreshToken } = signTokens(user.id, user.email)
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS(process.env.NODE_ENV))
    res.status(201).json({ user, accessToken })
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const user = await loginUser({ email, password })

    const twoFa = await getTwoFactorFields(user.id)
    if (twoFa?.two_factor_enabled) {
      const tempToken = jwt.sign({ id: user.id, purpose: '2fa' }, config.jwtSecret, { expiresIn: '10m' })
      return res.json({ requires2FA: true, tempToken })
    }

    const { accessToken, refreshToken } = signTokens(user.id, user.email)
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS(process.env.NODE_ENV))
    res.json({ user, accessToken })
  } catch (err) {
    next(err)
  }
}

export async function me(req, res, next) {
  try {
    const user = await findUserById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ user })
  } catch (err) {
    next(err)
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken
    if (!token) return res.status(401).json({ error: 'No refresh token' })
    const { accessToken, user } = await refreshAccessToken(token)
    res.json({ accessToken, user })
  } catch (err) {
    next(err)
  }
}

export function logout(req, res) {
  res.clearCookie('refreshToken')
  res.json({ message: 'Logged out' })
}

// ── Password reset flow ──────────────────────────────────────────────────────

export const forgotPasswordValidators = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
]

export async function forgotPassword(req, res, next) {
  try {
    const user = await findUserByEmail(req.body.email)
    // Always respond 200 to prevent email enumeration
    if (!user) return res.json({ message: 'If that email exists, a code was sent.' })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await saveOtp(user.id, otpHash, expiresAt)
    await sendPasswordResetOtp(user.email, otp)

    res.json({ message: 'If that email exists, a code was sent.' })
  } catch (err) {
    next(err)
  }
}

export const verifyOtpValidators = [
  body('email').isEmail().normalizeEmail(),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
]

export async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body
    const user = await findUserByEmail(email)
    if (!user) return res.status(400).json({ error: 'Invalid code' })

    const record = await findValidOtp(user.id)
    if (!record) return res.status(400).json({ error: 'Code expired or not found' })

    const valid = await bcrypt.compare(otp, record.otp_hash)
    if (!valid) return res.status(400).json({ error: 'Invalid code' })

    // Issue a short-lived reset token
    const resetToken = jwt.sign({ id: user.id, purpose: 'reset' }, config.jwtSecret, { expiresIn: '15m' })
    await markOtpUsed(record.id)

    res.json({ resetToken })
  } catch (err) {
    next(err)
  }
}

export const resetPasswordValidators = [
  body('resetToken').notEmpty(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match')
    return true
  }),
]

export async function resetPassword(req, res, next) {
  try {
    const { resetToken, password } = req.body
    let payload
    try {
      payload = jwt.verify(resetToken, config.jwtSecret)
    } catch {
      return res.status(400).json({ error: 'Reset link expired or invalid' })
    }
    if (payload.purpose !== 'reset') return res.status(400).json({ error: 'Invalid token' })

    const passwordHash = await bcrypt.hash(password, 12)
    await updatePasswordHash(payload.id, passwordHash)

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    next(err)
  }
}

// ── Two-factor authentication ────────────────────────────────────────────────

export async function twoFactorSetup(req, res, next) {
  try {
    const existing = await getTwoFactorFields(req.user.id)
    if (existing?.two_factor_enabled) {
      return res.status(400).json({ error: '2FA is already enabled' })
    }

    const user = await findUserById(req.user.id)
    const secret = speakeasy.generateSecret({
      name: `ConnectAR (${user.email})`,
      length: 20,
    })

    await setTwoFactorSecret(req.user.id, secret.base32)

    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url)
    res.json({ secret: secret.base32, qrCode: qrDataUrl })
  } catch (err) {
    next(err)
  }
}

export const twoFactorEnableValidators = [
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('TOTP code must be 6 digits'),
]

export async function twoFactorEnable(req, res, next) {
  try {
    const fields = await getTwoFactorFields(req.user.id)
    if (!fields?.two_factor_secret) {
      return res.status(400).json({ error: 'Run setup first' })
    }

    const valid = speakeasy.totp.verify({
      secret: fields.two_factor_secret,
      encoding: 'base32',
      token: req.body.code,
      window: 1,
    })

    if (!valid) return res.status(400).json({ error: 'Invalid code' })

    await enableTwoFactor(req.user.id)
    res.json({ message: '2FA enabled' })
  } catch (err) {
    next(err)
  }
}

export const twoFactorDisableValidators = [
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('TOTP code must be 6 digits'),
]

export async function twoFactorDisable(req, res, next) {
  try {
    const fields = await getTwoFactorFields(req.user.id)
    if (!fields?.two_factor_enabled) {
      return res.status(400).json({ error: '2FA is not enabled' })
    }

    const valid = speakeasy.totp.verify({
      secret: fields.two_factor_secret,
      encoding: 'base32',
      token: req.body.code,
      window: 1,
    })

    if (!valid) return res.status(400).json({ error: 'Invalid code' })

    await disableTwoFactor(req.user.id)
    res.json({ message: '2FA disabled' })
  } catch (err) {
    next(err)
  }
}

export async function twoFactorStatus(req, res, next) {
  try {
    const fields = await getTwoFactorFields(req.user.id)
    res.json({ enabled: fields?.two_factor_enabled || false })
  } catch (err) {
    next(err)
  }
}

export const twoFactorVerifyValidators = [
  body('tempToken').notEmpty(),
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('TOTP code must be 6 digits'),
]

export async function twoFactorVerify(req, res, next) {
  try {
    const { tempToken, code } = req.body
    let payload
    try {
      payload = jwt.verify(tempToken, config.jwtSecret)
    } catch {
      return res.status(400).json({ error: 'Session expired, please log in again' })
    }
    if (payload.purpose !== '2fa') return res.status(400).json({ error: 'Invalid token' })

    const fields = await getTwoFactorFields(payload.id)
    if (!fields?.two_factor_secret) return res.status(400).json({ error: 'Invalid state' })

    const valid = speakeasy.totp.verify({
      secret: fields.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 1,
    })

    if (!valid) return res.status(400).json({ error: 'Invalid authenticator code' })

    const user = await findUserById(payload.id)
    const { accessToken, refreshToken } = signTokens(user.id, user.email)
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS(process.env.NODE_ENV))
    res.json({ user, accessToken })
  } catch (err) {
    next(err)
  }
}
