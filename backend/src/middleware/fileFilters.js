// Executable/script types have no legitimate use as a chat attachment or avatar and are a real
// risk if another user downloads and runs one — checked by both extension and declared mimetype
// since either alone can be spoofed by a malicious client (this isn't magic-byte content sniffing,
// but it stops the naive/common case, which is what matters here since nothing was checked before).
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.msi', '.com', '.scr', '.ps1', '.sh', '.bash',
  '.app', '.dmg', '.apk', '.jar', '.js', '.mjs', '.vbs', '.wsf',
  '.php', '.py', '.rb', '.pl', '.svg', '.xhtml', '.shtml',
])

// .html/.htm are allowed as chat attachments (members swap email templates). They can never run
// inside Pulse: the uploads guard shows only images, video and audio in the page, sends
// everything else as a download, and labels HTML as plain bytes on top (HTML_EXTENSIONS there).
// What remains is the ordinary risk of opening any downloaded file on your own computer.
const ALLOWED_DOC_EXTENSIONS = new Set(['.html', '.htm'])

const DANGEROUS_MIME_PATTERNS = [
  /executable/i, /x-msdownload/i, /x-sh(ellscript)?$/i, /x-bat/i,
  /javascript/i, /html/i, /svg\+xml/i,
]

function extOf(filename) {
  const i = filename.lastIndexOf('.')
  return i === -1 ? '' : filename.slice(i).toLowerCase()
}

export function isDangerous(file) {
  const ext = extOf(file.originalname || '')
  if (DANGEROUS_EXTENSIONS.has(ext)) return true
  // An allowed .html file arrives as text/html (or untyped): let exactly that through for it.
  if (ALLOWED_DOC_EXTENSIONS.has(ext) && /^(text\/html|application\/octet-stream|)$/i.test(file.mimetype || '')) return false
  return DANGEROUS_MIME_PATTERNS.some((p) => p.test(file.mimetype || ''))
}

// Avatars (user/group) — narrow allowlist, images only.
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

export function imageOnlyFilter(req, file, cb) {
  if (!IMAGE_TYPES.has(file.mimetype)) {
    return cb(Object.assign(new Error('Only JPEG, PNG, GIF or WEBP images are allowed.'), { status: 400 }))
  }
  cb(null, true)
}

// Message attachments — broader denylist, since legitimate chat file-sharing covers many document
// types (PDF, docx, zip, etc.) that a narrow allowlist would wrongly block.
export function safeFileFilter(req, file, cb) {
  if (isDangerous(file)) {
    return cb(Object.assign(new Error('This file type is not allowed.'), { status: 400 }))
  }
  cb(null, true)
}
