import crypto from 'crypto'
import fs from 'fs'
import { mkdir, readFile, rm, stat, writeFile } from 'fs/promises'
import path from 'path'
import { pipeline } from 'stream/promises'
import { isProUser, FREE_FILE_SIZE_BYTES } from '../utils/plan.js'
import { isDangerous } from '../middleware/fileFilters.js'
import { CHUNK_BYTES, CHUNK_DIR, MAX_UPLOAD_BYTES, UPLOAD_DIR, megabytes } from '../utils/uploads.js'
import { displayName, messageTypeFor } from './upload.controller.js'

// Large chat files, sent in pieces of CHUNK_BYTES so no single request passes Cloudflare's
// 100 MB limit:
//   POST /upload/chunked/start          { fileName, mimeType, size } -> { uploadId, chunkSize }
//   PUT  /upload/chunked/:id/:index     raw bytes of one piece
//   POST /upload/chunked/:id/complete   -> { fileUrl, fileName, messageType } (as /upload)
// The same rules as a normal upload apply (file type, plan limit), checked before any byte is
// stored. Pieces live in uploads/chunks/<id>/ until joined; jobs/uploadCleanup.js removes
// abandoned ones after a day.

const ID_RE = /^[0-9a-f-]{36}$/

function dirOf(id) {
  if (!ID_RE.test(id)) throw Object.assign(new Error('Unknown upload'), { status: 404 })
  return path.join(CHUNK_DIR, id)
}

async function loadMeta(id, userId) {
  let meta
  try {
    meta = JSON.parse(await readFile(path.join(dirOf(id), 'meta.json'), 'utf8'))
  } catch {
    throw Object.assign(new Error('This upload has expired. Please send the file again.'), { status: 404 })
  }
  if (meta.userId !== userId) throw Object.assign(new Error('Unknown upload'), { status: 404 })
  return meta
}

export async function startChunkedUpload(req, res, next) {
  try {
    const { fileName, mimeType = '', size } = req.body || {}
    const bytes = Number(size)
    if (!fileName || !Number.isFinite(bytes) || bytes <= 0) return res.status(400).json({ error: 'Missing file details' })
    if (isDangerous({ originalname: String(fileName), mimetype: String(mimeType) })) {
      return res.status(400).json({ error: 'This file type is not allowed.' })
    }
    if (bytes > MAX_UPLOAD_BYTES) {
      return res.status(413).json({ error: `That file is too large. Files can be up to ${megabytes(MAX_UPLOAD_BYTES)}.` })
    }
    if (!isProUser(req.user) && bytes > FREE_FILE_SIZE_BYTES) {
      return res.status(413).json({ error: 'Free plan uploads are limited to 5MB. Upgrade to Pro for unlimited file sharing.' })
    }

    const uploadId = crypto.randomUUID()
    const dir = dirOf(uploadId)
    await mkdir(dir, { recursive: true })
    const meta = {
      userId: req.user.id,
      fileName: String(fileName),
      mimeType: String(mimeType),
      size: bytes,
      chunks: Math.ceil(bytes / CHUNK_BYTES),
      createdAt: Date.now(),
    }
    await writeFile(path.join(dir, 'meta.json'), JSON.stringify(meta))
    res.json({ uploadId, chunkSize: CHUNK_BYTES, chunks: meta.chunks })
  } catch (err) {
    next(err)
  }
}

// Streams one piece straight to disk, refusing more bytes than a piece may hold.
export async function receiveChunk(req, res, next) {
  try {
    const meta = await loadMeta(req.params.id, req.user.id)
    const index = Number(req.params.index)
    if (!Number.isInteger(index) || index < 0 || index >= meta.chunks) {
      return res.status(400).json({ error: 'Bad piece number' })
    }
    let received = 0
    const target = path.join(dirOf(req.params.id), `${index}.part`)
    req.on('data', (buf) => {
      received += buf.length
      if (received > CHUNK_BYTES) req.destroy(Object.assign(new Error('Piece too large'), { status: 413 }))
    })
    await pipeline(req, fs.createWriteStream(target))
    res.json({ ok: true, index, bytes: received })
  } catch (err) {
    next(err)
  }
}

export async function completeChunkedUpload(req, res, next) {
  const dir = (() => { try { return dirOf(req.params.id) } catch { return null } })()
  try {
    const meta = await loadMeta(req.params.id, req.user.id)
    let total = 0
    for (let i = 0; i < meta.chunks; i++) {
      const s = await stat(path.join(dir, `${i}.part`)).catch(() => null)
      if (!s) return res.status(400).json({ error: 'Part of the file is missing. Please send it again.' })
      total += s.size
    }
    if (total !== meta.size) return res.status(400).json({ error: 'The file did not arrive complete. Please send it again.' })

    const ext = path.extname(meta.fileName).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 10)
    const filename = `msg-${req.user.id}-${Date.now()}${ext}`
    const out = fs.createWriteStream(path.join(UPLOAD_DIR, filename))
    for (let i = 0; i < meta.chunks; i++) {
      await pipeline(fs.createReadStream(path.join(dir, `${i}.part`)), out, { end: false })
    }
    await new Promise((resolve, reject) => out.end((e) => (e ? reject(e) : resolve())))
    await rm(dir, { recursive: true, force: true })

    res.json({
      fileUrl: `/uploads/${filename}`,
      fileName: displayName(meta.fileName),
      messageType: messageTypeFor(meta.mimeType),
    })
  } catch (err) {
    next(err)
  }
}
