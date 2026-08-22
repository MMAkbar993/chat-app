// A 413 from Nginx/Cloudflare (file too large) comes back as an HTML body, not our backend's
// { error } JSON shape — without this, that case silently fell through to a generic, unhelpful
// "Upload failed. Please try again." even though the real reason (file size) is knowable.
export function getUploadErrorMessage(err) {
  const apiError = err.response?.data?.error
  if (apiError) return apiError
  if (err.response?.status === 413) return 'That file is too large to upload.'
  return 'Upload failed. Please try again.'
}
