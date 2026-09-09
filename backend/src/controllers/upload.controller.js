import { unlink } from 'fs/promises'
import { isProUser, FREE_FILE_SIZE_BYTES } from '../utils/plan.js'

// The browser supplies this, so treat it as untrusted display text: keep only the basename
// (no directory components), drop control characters, and cap the length so one absurd name
// can't blow out every chat bubble it appears in.
function displayName(original) {
  const base = String(original || '')
    .split(/[\\/]/).pop()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
  if (!base) return null
  return base.length > 120 ? `${base.slice(0, 117)}…` : base
}

export async function uploadMessageFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    if (!isProUser(req.user) && req.file.size > FREE_FILE_SIZE_BYTES) {
      await unlink(req.file.path).catch(() => {})
      return res.status(413).json({ error: 'Free plan uploads are limited to 5MB. Upgrade to Pro for unlimited file sharing.' })
    }

    const mime = req.file.mimetype || ''
    let messageType = 'file'
    if (mime.startsWith('image/')) messageType = 'image'
    else if (mime.startsWith('audio/')) messageType = 'audio'
    else if (mime.startsWith('video/')) messageType = 'video'
    // The on-disk name is randomised to avoid collisions and path tricks, so the original has
    // to travel separately or the recipient just sees "msg-<uuid>-<epoch>.pdf".
    res.json({ fileUrl: `/uploads/${req.file.filename}`, fileName: displayName(req.file.originalname), messageType })
  } catch (err) {
    next(err)
  }
}
