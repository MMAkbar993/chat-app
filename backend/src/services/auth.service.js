import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { query } from '../config/database.js'
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  updateStripeCustomer,
} from '../db/queries/users.js'
import { stripe } from '../config/stripe.js'

function isStripeConfigured(key) {
  return Boolean(key) && /^sk_(test|live)_[A-Za-z0-9]{20,}/.test(key)
}

export async function registerUser({ full_name, username, country, email, primary_role, phone, password }) {
  const existingEmail = await findUserByEmail(email)
  if (existingEmail) {
    const err = new Error('Email already registered')
    err.status = 409
    err.field = 'email'
    throw err
  }

  const existingUsername = await findUserByUsername(username)
  if (existingUsername) {
    const err = new Error('Username already taken')
    err.status = 409
    err.field = 'username'
    throw err
  }

  const password_hash = await bcrypt.hash(password, 12)
  const user = await createUser({ full_name, username, country, email, primary_role, phone, password_hash })

  if (isStripeConfigured(config.stripeSecretKey)) {
    try {
      const stripeCustomer = await stripe.customers.create({
        email,
        name: full_name,
        metadata: { userId: user.id },
      })
      await updateStripeCustomer(user.id, stripeCustomer.id)
    } catch (err) {
      console.error('Stripe customer creation failed (user still created):', err.message)
    }
  }

  return user
}

export async function loginUser({ email, password }) {
  const user = await findUserByEmail(email)
  if (!user) {
    const err = new Error('Invalid credentials')
    err.status = 401
    throw err
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    const err = new Error('Invalid credentials')
    err.status = 401
    throw err
  }

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    username: user.username,
    subscription_status: user.subscription_status,
    kyc_status: user.kyc_status,
    is_active: user.is_active,
  }
}

export function signTokens(userId, email) {
  const accessToken = jwt.sign({ id: userId, email }, config.jwtSecret, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ id: userId, email }, config.jwtRefreshSecret, { expiresIn: '7d' })
  return { accessToken, refreshToken }
}

export async function refreshAccessToken(refreshToken) {
  let payload
  try {
    payload = jwt.verify(refreshToken, config.jwtRefreshSecret)
  } catch {
    const err = new Error('Invalid refresh token')
    err.status = 401
    throw err
  }

  const user = await findUserById(payload.id)
  if (!user) {
    const err = new Error('User not found')
    err.status = 401
    throw err
  }

  const accessToken = jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, { expiresIn: '15m' })
  return { accessToken, user }
}

export { findUserById }
