// Limits for files sent in chat. Keep in step with the backend (src/utils/uploads.js).
//
// The site sits behind Cloudflare, which refuses any single request over 100 MB. Files bigger
// than CHUNK_BYTES are sent in pieces (api/users.js uploadFile) and joined on the server, so the
// real ceiling is MAX_UPLOAD_BYTES.
export const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024   // 1 GB
export const CHUNK_BYTES = 50 * 1024 * 1024
// Files over this are kept for LARGE_FILE_DAYS, then deleted to save space (like Telegram).
export const LARGE_FILE_BYTES = 100 * 1024 * 1024
export const LARGE_FILE_DAYS = 30

export function formatMegabytes(bytes) {
  return bytes >= 1024 * 1024 * 1024
    ? `${+(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    : `${Math.round(bytes / (1024 * 1024))} MB`
}

// A file over the limit, caught before any upload starts.
export function tooLargeError(file) {
  return Object.assign(new Error('File too large'), { code: 'FILE_TOO_LARGE', size: file.size })
}

// What to tell the member when an upload fails.
export function getUploadErrorMessage(err) {
  if (err?.code === 'FILE_TOO_LARGE') {
    return `That file is ${formatMegabytes(err.size)}. Files can be up to ${formatMegabytes(MAX_UPLOAD_BYTES)}.`
  }
  const apiError = err?.response?.data?.error
  if (apiError) return apiError
  // A 413 from Nginx/Cloudflare comes back as an HTML page, not our { error } JSON.
  if (err?.response?.status === 413) return `That file is too large. Files can be up to ${formatMegabytes(MAX_UPLOAD_BYTES)}.`
  if (!err?.response) return 'Upload failed. Check your connection and try again.'
  return 'Upload failed. Please try again.'
}
