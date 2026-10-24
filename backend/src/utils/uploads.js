import path from 'path'
import { fileURLToPath } from 'url'

// Limits for files sent in chat. Keep in step with the frontend (src/utils/uploadError.js).
//
// The site sits behind Cloudflare, which refuses any single request over 100 MB on its free and
// Pro plans. Files bigger than CHUNK_BYTES are therefore sent in pieces
// (controllers/chunkedUpload.controller.js) and joined on the server, so the real ceiling is
// MAX_UPLOAD_BYTES, not Cloudflare's.
export const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024        // 1 GB per file
export const SINGLE_UPLOAD_BYTES = 100 * 1024 * 1024      // one request (Cloudflare's limit)
export const CHUNK_BYTES = 50 * 1024 * 1024               // one piece of a chunked upload

// Large files are kept for a limited time to save disk space, like Telegram: anything over
// LARGE_FILE_BYTES is deleted LARGE_FILE_DAYS after upload (jobs/uploadCleanup.js) and its
// message shows that it has expired. Smaller files are kept.
export const LARGE_FILE_BYTES = 100 * 1024 * 1024
export const LARGE_FILE_DAYS = 30

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOAD_DIR = path.join(__dirname, '../../uploads')
// Pieces of chunked uploads in progress. Not servable: the uploads guard only serves known
// file-name prefixes at the top level.
export const CHUNK_DIR = path.join(UPLOAD_DIR, 'chunks')

export const megabytes = (bytes) => (bytes >= 1024 * 1024 * 1024
  ? `${+(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  : `${Math.round(bytes / (1024 * 1024))} MB`)
