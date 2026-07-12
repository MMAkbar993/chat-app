import nodemailer from 'nodemailer'

const smtpConfigured =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS

let transporter = null

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

const FROM = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@connectar.online'
const APP_NAME = process.env.APP_NAME || 'Pulse'
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@connectar.online'

const FEEDBACK_TYPE_LABELS = { bug: 'Bug Report', feature: 'Feature Request', other: 'Other' }

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

export async function sendPasswordResetOtp(email, otp) {
  if (!transporter) {
    console.log(`[DEV] Password reset OTP for ${email}: ${otp}`)
    return
  }
  await transporter.sendMail({
    from: `"${APP_NAME}" <${FROM}>`,
    to: email,
    subject: 'Your password reset code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Reset your password</h2>
        <p>Use the code below to reset your password. It expires in 15 minutes.</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:0.3em;color:#7c3aed;padding:16px 0">${otp}</div>
        <p style="color:#6b7280;font-size:0.85rem">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  })
}

export async function sendFeedbackNotification({ type, message, userEmail, username }) {
  const label = FEEDBACK_TYPE_LABELS[type] || 'Other'
  if (!transporter) {
    console.log(`[DEV] Feedback (${label}) from ${userEmail}: ${message}`)
    return
  }
  await transporter.sendMail({
    from: `"${APP_NAME}" <${FROM}>`,
    to: SUPPORT_EMAIL,
    replyTo: userEmail,
    subject: `[${label}] Feedback from @${username}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">${label}</h2>
        <p><strong>From:</strong> @${escapeHtml(username)} (${escapeHtml(userEmail)})</p>
        <p style="white-space:pre-wrap;border-left:3px solid #7c3aed;padding-left:12px">${escapeHtml(message)}</p>
      </div>
    `,
  })
}
