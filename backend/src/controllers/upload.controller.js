import { unlink } from 'fs/promises'
import { isProUser, FREE_FILE_SIZE_BYTES } from '../utils/plan.js'

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
    res.json({ fileUrl: `/uploads/${req.file.filename}`, messageType })
  } catch (err) {
    next(err)
  }
}
