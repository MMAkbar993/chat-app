import { readdir, rm, stat, unlink } from 'fs/promises'
import path from 'path'
import { query } from '../config/database.js'
import { CHUNK_DIR, LARGE_FILE_BYTES, LARGE_FILE_DAYS, UPLOAD_DIR } from '../utils/uploads.js'

const DAY = 24 * 60 * 60 * 1000

// Run hourly:
//   - chat files over LARGE_FILE_BYTES are deleted LARGE_FILE_DAYS after upload, like Telegram,
//     and their messages are marked media_expired so the app says so
//   - pieces of chunked uploads that were never finished are removed after a day
export async function cleanUpUploads() {
  const now = Date.now()

  for (const name of await readdir(UPLOAD_DIR).catch(() => [])) {
    if (!name.startsWith('msg-')) continue
    const file = path.join(UPLOAD_DIR, name)
    const s = await stat(file).catch(() => null)
    if (!s || !s.isFile() || s.size <= LARGE_FILE_BYTES) continue
    if (now - s.mtimeMs < LARGE_FILE_DAYS * DAY) continue
    await query(`UPDATE messages SET media_expired = true WHERE media_url = $1`, [`/uploads/${name}`])
    await unlink(file).catch(() => {})
  }

  for (const id of await readdir(CHUNK_DIR).catch(() => [])) {
    const dir = path.join(CHUNK_DIR, id)
    const s = await stat(dir).catch(() => null)
    if (s && now - s.mtimeMs > DAY) await rm(dir, { recursive: true, force: true })
  }
}
