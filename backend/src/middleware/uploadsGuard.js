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
const PUBLIC_PREFIXES = ['avatar-', 'group-', 'ad-']
const MESSAGE_PREFIX = 'msg-'

// Extensions a browser may render inline. Everything else is forced to download so a crafted
// document can never execute in the app's origin, whatever type it claims. Decided from the
// extension because express.static sets Content-Type after this middleware has run.
const INLINE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif',
  '.mp4', '.webm', '.mov', '.m4v',
  '.mp3', '.wav', '.ogg', '.m4a', '.aac',
])

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
      `SELECT conversation_id, is_deleted, deleted_for
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
    if (!INLINE_EXTENSIONS.has(path.extname(filename).toLowerCase())) {
      res.setHeader('Content-Disposition', 'attachment')
    }
    next()
  } catch (err) {
    next(err)
  }
}
