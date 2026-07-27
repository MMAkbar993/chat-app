import { query } from '../../config/database.js'

export async function recordPayment({ userId, stripeInvoiceId, amount, currency }) {
  await query(
    `INSERT INTO payments (user_id, stripe_invoice_id, amount, currency)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (stripe_invoice_id) DO NOTHING`,
    [userId, stripeInvoiceId, amount, currency]
  )
}

export async function getSalesTotals() {
  const result = await query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE), 0) AS today,
       COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('week', now())), 0) AS this_week,
       COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('month', now())), 0) AS this_month
     FROM payments`
  )
  const row = result.rows[0]
  return {
    today: parseFloat(row.today),
    thisWeek: parseFloat(row.this_week),
    thisMonth: parseFloat(row.this_month),
  }
}
