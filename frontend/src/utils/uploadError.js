// The largest file a chat message can carry. Must match the backend (routes/upload.routes.js,
// multer fileSize) and Nginx (client_max_body_size in DEPLOY.md).
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024

export function formatMegabytes(bytes) {
  return `${Math.round(bytes / (1024 * 1024))} MB`
}

// A file over the limit, caught before any upload starts: Nginx answers an oversized upload by
// closing the connection, which the browser reports as a bare network error after the member
// has waited for most of the file to send.
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
  // No response at all: the connection dropped, which is also what an oversized file looks like.
  if (!err?.response) return `Upload failed. Check your connection and try again. Files can be up to ${formatMegabytes(MAX_UPLOAD_BYTES)}.`
  return 'Upload failed. Please try again.'
}
