// Executable/script types have no legitimate use as a chat attachment or avatar and are a real
// risk if another user downloads and runs one — checked by both extension and declared mimetype
// since either alone can be spoofed by a malicious client (this isn't magic-byte content sniffing,
// but it stops the naive/common case, which is what matters here since nothing was checked before).
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.msi', '.com', '.scr', '.ps1', '.sh', '.bash',
  '.app', '.dmg', '.apk', '.jar', '.js', '.mjs', '.vbs', '.wsf',
  '.php', '.py', '.rb', '.pl', '.html', '.htm', '.svg',
])

const DANGEROUS_MIME_PATTERNS = [
  /executable/i, /x-msdownload/i, /x-sh(ellscript)?$/i, /x-bat/i,
  /javascript/i, /html/i, /svg\+xml/i,
]

function extOf(filename) {
  const i = filename.lastIndexOf('.')
  return i === -1 ? '' : filename.slice(i).toLowerCase()
}

function isDangerous(file) {
  if (DANGEROUS_EXTENSIONS.has(extOf(file.originalname || ''))) return true
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
