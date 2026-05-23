export function uploadMessageFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
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
