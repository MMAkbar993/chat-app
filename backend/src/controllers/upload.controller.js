import { unlink } from 'fs/promises'
import { isProUser, FREE_FILE_SIZE_BYTES } from '../utils/plan.js'

// The browser supplies this, so treat it as untrusted display text: keep only the basename
// (no directory components), drop control characters, and cap the length so one absurd name
// can't blow out every chat bubble it appears in.
export function displayName(original) {
  const base = String(original || '')
    .split(/[\\/]/).pop()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
  if (!base) return null
  return base.length > 120 ? `${base.slice(0, 117)}…` : base
}

export function messageTypeFor(mimetype) {
  const mime = mimetype || ''
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'
  return 'file'
}

export async function uploadMessageFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    if (!isProUser(req.user) && req.file.size > FREE_FILE_SIZE_BYTES) {
      await unlink(req.file.path).catch(() => {})
      return res.status(413).json({ error: 'Free plan uploads are limited to 5MB. Upgrade to Pro for unlimited file sharing.' })
    }

    const messageType = messageTypeFor(req.file.mimetype)
    // The on-disk name is randomised to avoid collisions and path tricks, so the original has
    // to travel separately or the recipient just sees "msg-<uuid>-<epoch>.pdf".
    res.json({ fileUrl: `/uploads/${req.file.filename}`, fileName: displayName(req.file.originalname), messageType })
  } catch (err) {
    next(err)
  }
}
