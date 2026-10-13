import { sendSupportContactEmail } from '../config/email.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// The help bubble's message form on the public site. No account needed, so it is rate limited
// (routes/support.routes.js) and carries a hidden field real visitors never fill in.
export async function contactSupport(req, res, next) {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim()
    const message = String(req.body.message || '').trim()
    const page = String(req.body.page || '').trim().slice(0, 200)

    // Bots fill every field they find; pretend it worked so they do not retry.
    if (req.body.website) return res.json({ ok: true })

    if (!name || name.length > 100) return res.status(400).json({ error: 'Please enter your name.' })
    if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: 'Please enter a valid email address so we can reply.' })
    if (!message) return res.status(400).json({ error: 'Please write a message.' })
    if (message.length > 2000) return res.status(400).json({ error: 'Please keep your message under 2000 characters.' })

    await sendSupportContactEmail({ name, email, message, page })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
