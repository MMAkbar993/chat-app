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
const APP_NAME = process.env.APP_NAME || 'ConnectAR'

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
