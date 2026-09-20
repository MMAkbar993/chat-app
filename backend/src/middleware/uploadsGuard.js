import path from 'path'
import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { query } from '../config/database.js'
import { isParticipant } from '../db/queries/conversations.js'

// /uploads used to be served as plain static files: every chat attachment — contracts,
// screenshots, documents — was fetchable by anyone holding the URL, signed in or not, forever.
// Blocking someone or deleting a message changed nothing. This gate sits in front of
// express.static and decides, per file class, who may read it.
//
// Message attachments are shown with <img>/<video>/<a href>, which never carry an
// Authorization header. The refresh cookie does ride along on same-origin requests though, so
// it's accepted here as proof of identity alongside a Bearer token — verified exactly the way
// /api/auth/refresh verifies it. No URL or frontend changes were needed for that.

// Avatars appear on public profile pages and ad creative is meant to be seen, so those stay
// open. Anything not on this list or the message prefix is refused: an unrecognised file in
// the uploads directory is not something a browser should be able to pull.
const PUBLIC_PREFIXES = ['avatar-', 'group-', 'ad-', 'business-']
const MESSAGE_PREFIX = 'msg-'

// Extensions a browser may render inline. Everything else is forced to download so a crafted
// document can never execute in the app's origin, whatever type it claims. Decided from the
// extension because express.static sets Content-Type after this middleware has run.
const INLINE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif',
  '.mp4', '.webm', '.mov', '.m4v',
  '.mp3', '.wav', '.ogg', '.m4a', '.aac',
])

// A browser names a saved file from Content-Disposition when one is sent, and otherwise from
// the URL — which is the randomised on-disk name ("msg-<uuid>-<epoch>.png"). The original name
// is already stored on the message, so hand it over. The stored name can be truncated with an
// ellipsis, which drops the extension, so the real one is put back when it's missing.
function downloadName(stored, diskName) {
  const name = String(stored || '').replace(/[\u0000-\u001f\u007f]/g, '').trim()
  if (!name) return null
  const ext = path.extname(diskName)
  return ext && !name.toLowerCase().endsWith(ext.toLowerCase()) ? `${name}${ext}` : name
}

// RFC 6266: a plain-ASCII filename for old clients plus a UTF-8 filename* so accented and
// non-Latin names survive intact. encodeURIComponent leaves ' ( ) * alone, which RFC 5987
// does not allow unescaped.
function contentDisposition(type, name) {
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')
  const encoded = encodeURIComponent(name).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encoded}`
}

function identify(req) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      return jwt.verify(header.slice(7), config.jwtSecret).id
    } catch {
      // Fall through — an expired access token shouldn't break an <img> that can still be
      // authorised by the cookie.
    }
  }
  const cookie = req.cookies?.refreshToken
  if (cookie) {
    try {
      return jwt.verify(cookie, config.jwtRefreshSecret).id
    } catch {
      return null
    }
  }
  return null
}

export async function uploadsGuard(req, res, next) {
  try {
    // basename strips any attempt at ../ regardless of how the path was encoded.
    const filename = path.basename(decodeURIComponent(req.path))
    if (!filename || filename.startsWith('.')) return res.status(404).end()

    if (PUBLIC_PREFIXES.some((p) => filename.startsWith(p))) {
      res.setHeader('Cache-Control', 'public, max-age=86400')
      return next()
    }

    if (!filename.startsWith(MESSAGE_PREFIX)) return res.status(404).end()

    const userId = identify(req)
    if (!userId) return res.status(401).json({ error: 'Sign in to view this file' })

    const result = await query(
      `SELECT conversation_id, is_deleted, deleted_for, file_name
         FROM messages
        WHERE media_url = $1`,
      [`/uploads/${filename}`]
    )
    const msg = result.rows[0]
    // A file with no message row is an orphan (or a guessed name) — treat it as absent.
    if (!msg || msg.is_deleted) return res.status(404).end()
    // "Delete for me" hides the message from that one user; the file should go with it.
    if (Array.isArray(msg.deleted_for) && msg.deleted_for.includes(userId)) return res.status(404).end()

    const allowed = await isParticipant(msg.conversation_id, userId)
    if (!allowed) return res.status(403).json({ error: 'Not a participant in this conversation' })

    // Private: a shared cache or proxy must never hand one user's file to another.
    res.setHeader('Cache-Control', 'private, max-age=3600')
    // ?download=1 can only turn an inline type into an attachment (for a Download button); it
    // can never make a non-inline type render inline, so the safety rule above still holds.
    const inline = INLINE_EXTENSIONS.has(path.extname(filename).toLowerCase()) && req.query.download !== '1'
    const name = downloadName(msg.file_name, filename)
    if (name) {
      res.setHeader('Content-Disposition', contentDisposition(inline ? 'inline' : 'attachment', name))
    } else if (!inline) {
      res.setHeader('Content-Disposition', 'attachment')
    }
    next()
  } catch (err) {
    next(err)
  }
}
