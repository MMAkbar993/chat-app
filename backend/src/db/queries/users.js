import { query } from '../../config/database.js'

export async function createUser({ full_name, username, country, email, primary_role, phone, password_hash }) {
  const result = await query(
    `INSERT INTO users (full_name, username, country, email, primary_role, phone, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, full_name, username, country, email, primary_role, phone, subscription_status, kyc_status, is_active, created_at`,
    [full_name, username, country, email, primary_role, phone || null, password_hash]
  )
  return result.rows[0]
}

export async function findUserByEmail(email) {
  const result = await query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  )
  return result.rows[0] || null
}

export async function findUserById(id) {
  const result = await query(
    `SELECT id, full_name, username, country, location, email, primary_role, phone,
            stripe_customer_id, stripe_subscription_id, subscription_plan,
            subscription_status, kyc_status, kyc_session_id, is_active, created_at,
            avatar_url, display_name, bio, gender, website, date_of_birth,
            website_verified, website_verify_token,
            job_title, company_name, website_representation_approved
     FROM users WHERE id = $1`,
    [id]
  )
  return result.rows[0] || null
}

export async function findUserByUsername(username) {
  const result = await query(
    `SELECT id FROM users WHERE username = $1`,
    [username]
  )
  return result.rows[0] || null
}

export async function updateStripeCustomer(userId, customerId) {
  await query(
    `UPDATE users SET stripe_customer_id = $1 WHERE id = $2`,
    [customerId, userId]
  )
}

export async function updateSubscription(userId, { subscriptionId, plan, status }) {
  await query(
    `UPDATE users SET stripe_subscription_id = $1, subscription_plan = $2, subscription_status = $3 WHERE id = $4`,
    [subscriptionId, plan, status, userId]
  )
}

export async function updateSubscriptionStatus(userId, status) {
  await query(
    `UPDATE users SET subscription_status = $1, is_active = $2 WHERE id = $3`,
    [status, status === 'active', userId]
  )
}

export async function updateKycSession(userId, sessionId) {
  await query(
    `UPDATE users SET kyc_session_id = $1 WHERE id = $2`,
    [sessionId, userId]
  )
}

export async function updateKycStatus(userId, status) {
  const isActive = status === 'verified'
  await query(
    `UPDATE users SET kyc_status = $1, is_active = $2 WHERE id = $3`,
    [status, isActive, userId]
  )
}

export async function findUserByStripeCustomer(customerId) {
  const result = await query(
    `SELECT * FROM users WHERE stripe_customer_id = $1`,
    [customerId]
  )
  return result.rows[0] || null
}
