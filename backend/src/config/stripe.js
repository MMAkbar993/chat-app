import Stripe from 'stripe'
import { config } from './env.js'

export const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
})
