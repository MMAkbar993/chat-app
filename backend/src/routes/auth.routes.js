import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  register, registerValidators,
  login, loginValidators,
  me, refresh, logout,
  forgotPassword, forgotPasswordValidators,
  verifyOtp, verifyOtpValidators,
  resetPassword, resetPasswordValidators,
  twoFactorSetup,
  twoFactorEnable, twoFactorEnableValidators,
  twoFactorDisable, twoFactorDisableValidators,
  twoFactorStatus,
  twoFactorVerify, twoFactorVerifyValidators,
} from '../controllers/auth.controller.js'

export const authRouter = Router()

authRouter.post('/register', registerValidators, validate, register)
authRouter.post('/login', loginValidators, validate, login)
authRouter.get('/me', authMiddleware, me)
authRouter.post('/refresh', refresh)
authRouter.post('/logout', logout)

// Password reset
authRouter.post('/forgot-password', forgotPasswordValidators, validate, forgotPassword)
authRouter.post('/verify-otp', verifyOtpValidators, validate, verifyOtp)
authRouter.post('/reset-password', resetPasswordValidators, validate, resetPassword)

// Two-factor authentication
authRouter.get('/2fa/status', authMiddleware, twoFactorStatus)
authRouter.post('/2fa/setup', authMiddleware, twoFactorSetup)
authRouter.post('/2fa/enable', authMiddleware, twoFactorEnableValidators, validate, twoFactorEnable)
authRouter.post('/2fa/disable', authMiddleware, twoFactorDisableValidators, validate, twoFactorDisable)
authRouter.post('/2fa/verify', twoFactorVerifyValidators, validate, twoFactorVerify)
