import nodemailer from 'nodemailer'
import { query } from './database.js'

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

// Renders an admin-editable template (from system_email_settings) by substituting {{placeholders}}.
function render(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in vars ? vars[key] : m))
}

async function getEmailSetting(emailKey) {
  const result = await query(
    `SELECT enabled, subject, body_html FROM system_email_settings WHERE email_key = $1`,
    [emailKey]
  )
  return result.rows[0] || null
}

export async function sendPasswordResetOtp(email, otp) {
  const setting = await getEmailSetting('password_reset_otp')
  if (setting && !setting.enabled) return

  const subject = setting ? render(setting.subject, { otp }) : 'Your password reset code'
  const html = setting ? render(setting.body_html, { otp }) : `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Reset your password</h2>
        <p>Use the code below to reset your password. It expires in 15 minutes.</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:0.3em;color:#7c3aed;padding:16px 0">${otp}</div>
        <p style="color:#6b7280;font-size:0.85rem">If you didn't request this, you can ignore this email.</p>
      </div>
    `

  if (!transporter) {
    console.log(`[DEV] Password reset OTP for ${email}: ${otp}`)
    return
  }
  await transporter.sendMail({ from: `"${APP_NAME}" <${FROM}>`, to: email, subject, html })
}

export async function sendWelcomeEmail(email, name) {
  const setting = await getEmailSetting('welcome')
  if (setting && !setting.enabled) return

  const vars = { appName: APP_NAME, name: escapeHtml(name || 'there') }
  const subject = setting ? render(setting.subject, vars) : `Welcome to ${APP_NAME}, ${name || 'there'}!`
  const html = setting ? render(setting.body_html, vars) : `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">You're verified — welcome to ${APP_NAME}!</h2>
        <p>Hi ${escapeHtml(name || 'there')}, your identity verification is complete and your account is fully active.</p>
        <p>You can now message, call and connect with anyone on ${APP_NAME}.</p>
      </div>
    `

  if (!transporter) {
    console.log(`[DEV] Welcome email for ${email}`)
    return
  }
  await transporter.sendMail({ from: `"${APP_NAME}" <${FROM}>`, to: email, subject, html })
}

export async function sendUnreadMessageEmail(email, name, senderName) {
  const setting = await getEmailSetting('unread_message')
  if (setting && !setting.enabled) return

  const vars = { appName: APP_NAME, name: escapeHtml(name || 'there'), senderName: escapeHtml(senderName || 'Someone') }
  const subject = setting ? render(setting.subject, vars) : `You have an unread message on ${APP_NAME}`
  const html = setting ? render(setting.body_html, vars) : `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">You have an unread message</h2>
        <p>Hi ${escapeHtml(name || 'there')}, ${escapeHtml(senderName || 'Someone')} sent you a message on ${APP_NAME} over a day ago and it's still unread.</p>
        <p style="color:#6b7280;font-size:0.85rem">Log in to ${APP_NAME} to read and reply.</p>
      </div>
    `

  if (!transporter) {
    console.log(`[DEV] Unread message email for ${email} (from ${senderName})`)
    return
  }
  await transporter.sendMail({ from: `"${APP_NAME}" <${FROM}>`, to: email, subject, html })
}

export async function sendTwoFactorEnabledEmail(email) {
  const setting = await getEmailSetting('two_factor_enabled')
  if (setting && !setting.enabled) return

  const vars = { appName: APP_NAME }
  const subject = setting ? render(setting.subject, vars) : 'Two-factor authentication enabled'
  const html = setting ? render(setting.body_html, vars) : `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">2FA is now enabled</h2>
        <p>Two-factor authentication was just turned on for your ${APP_NAME} account.</p>
        <p style="color:#6b7280;font-size:0.85rem">If you didn't do this, contact support immediately.</p>
      </div>
    `

  if (!transporter) {
    console.log(`[DEV] 2FA enabled email for ${email}`)
    return
  }
  await transporter.sendMail({ from: `"${APP_NAME}" <${FROM}>`, to: email, subject, html })
}

export async function sendPasswordChangedEmail(email) {
  const setting = await getEmailSetting('password_changed')
  if (setting && !setting.enabled) return

  const vars = { appName: APP_NAME }
  const subject = setting ? render(setting.subject, vars) : 'Your password was changed'
  const html = setting ? render(setting.body_html, vars) : `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Password updated</h2>
        <p>Your ${APP_NAME} account password was just changed.</p>
        <p style="color:#6b7280;font-size:0.85rem">If you didn't do this, contact support immediately.</p>
      </div>
    `

  if (!transporter) {
    console.log(`[DEV] Password changed email for ${email}`)
    return
  }
  await transporter.sendMail({ from: `"${APP_NAME}" <${FROM}>`, to: email, subject, html })
}

export async function sendEmailChangedEmail(oldEmail, newEmail) {
  const setting = await getEmailSetting('email_changed')
  if (setting && !setting.enabled) return

  const vars = { appName: APP_NAME, newEmail: escapeHtml(newEmail) }
  const subject = setting ? render(setting.subject, vars) : 'Your account email was changed'
  const html = setting ? render(setting.body_html, vars) : `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Email address updated</h2>
        <p>The email address on your ${APP_NAME} account was changed to ${escapeHtml(newEmail)}.</p>
        <p style="color:#6b7280;font-size:0.85rem">If you didn't do this, contact support immediately.</p>
      </div>
    `

  if (!transporter) {
    console.log(`[DEV] Email changed notice for ${oldEmail} (new: ${newEmail})`)
    return
  }
  await transporter.sendMail({ from: `"${APP_NAME}" <${FROM}>`, to: oldEmail, subject, html })
}

export async function sendWebsiteVerifiedEmail(email, url) {
  const setting = await getEmailSetting('website_verified')
  if (setting && !setting.enabled) return

  const vars = { appName: APP_NAME, url: escapeHtml(url) }
  const subject = setting ? render(setting.subject, vars) : 'Your website has been verified'
  const html = setting ? render(setting.body_html, vars) : `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">You've successfully verified your website</h2>
        <p>${escapeHtml(url)} is now a verified website on your ${APP_NAME} profile.</p>
        <p>Do you have employees? They can add their own verified website the same way — just have them go through the same verification flow from their profile settings.</p>
      </div>
    `

  if (!transporter) {
    console.log(`[DEV] Website verified email for ${email} (${url})`)
    return
  }
  await transporter.sendMail({ from: `"${APP_NAME}" <${FROM}>`, to: email, subject, html })
}

export async function sendAdminNewSignupEmail({ username, email, fullName }) {
  const setting = await getEmailSetting('admin_new_signup')
  if (setting && !setting.enabled) return

  const vars = { appName: APP_NAME, username: escapeHtml(username), email: escapeHtml(email), fullName: escapeHtml(fullName) }
  const subject = setting ? render(setting.subject, vars) : `[${APP_NAME}] New signup: ${username}`
  const html = setting ? render(setting.body_html, vars) : `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">New signup</h2>
        <p><strong>Username:</strong> @${escapeHtml(username)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
      </div>
    `

  if (!transporter) {
    console.log(`[DEV] Admin new-signup notice for @${username} (${email})`)
    return
  }
  await transporter.sendMail({ from: `"${APP_NAME}" <${FROM}>`, to: SUPPORT_EMAIL, subject, html })
}

export async function sendFeedbackNotification({ type, message, userEmail, username }) {
  const label = FEEDBACK_TYPE_LABELS[type] || 'Other'
  const setting = await getEmailSetting('feedback_notification')
  if (setting && !setting.enabled) return

  const vars = { label, username: escapeHtml(username), userEmail: escapeHtml(userEmail), message: escapeHtml(message) }
  const subject = setting ? render(setting.subject, vars) : `[${label}] Feedback from @${username}`
  const html = setting ? render(setting.body_html, vars) : `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">${label}</h2>
        <p><strong>From:</strong> @${escapeHtml(username)} (${escapeHtml(userEmail)})</p>
        <p style="white-space:pre-wrap;border-left:3px solid #7c3aed;padding-left:12px">${escapeHtml(message)}</p>
      </div>
    `

  if (!transporter) {
    console.log(`[DEV] Feedback (${label}) from ${userEmail}: ${message}`)
    return
  }
  await transporter.sendMail({ from: `"${APP_NAME}" <${FROM}>`, to: SUPPORT_EMAIL, replyTo: userEmail, subject, html })
}
