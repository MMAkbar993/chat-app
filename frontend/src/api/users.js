import client from './client'
import { MAX_UPLOAD_BYTES, CHUNK_BYTES, tooLargeError } from '../utils/uploadError'

export const getMyProfile = () => client.get('/users/me').then((r) => r.data)
export const updateProfile = (data) => client.patch('/users/me', data).then((r) => r.data)
export const updateTimezone = (timezone) => client.patch('/users/me/timezone', { timezone }).then((r) => r.data)
export const getPrivacySettings = () => client.get('/users/me/privacy').then((r) => r.data)
export const updatePrivacySettings = (data) => client.patch('/users/me/privacy', data).then((r) => r.data)
export const uploadAvatar = (file) => {
  const form = new FormData()
  form.append('avatar', file)
  return client.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
}
export const getUserById = (id) => client.get(`/users/${id}`).then((r) => r.data)
export const markTourSeen = () => client.patch('/users/me/tour-seen').then((r) => r.data)
export const blockUser       = (id) => client.post(`/users/${id}/block`).then((r) => r.data)
export const unblockUser     = (id) => client.delete(`/users/${id}/block`).then((r) => r.data)
export const reportUser      = (id, reason) => client.post(`/users/${id}/report`, { reason }).then((r) => r.data)
export const getBlockedUsers = () => client.get('/users/me/blocked').then((r) => r.data)
export const deactivateAccount = () => client.patch('/users/me/deactivate').then((r) => r.data)
export const changePassword  = (data) => client.patch('/users/me/password', data).then((r) => r.data)
export const deleteAccount   = () => client.delete('/users/me').then((r) => r.data)
export const clearAllChats   = () => client.patch('/users/me/chats/clear').then((r) => r.data)
export const deleteAllChats  = () => client.delete('/users/me/chats').then((r) => r.data)
export const getMyVerifiedWebsites = () => client.get('/users/me/websites').then((r) => r.data)
export const submitFeedback = (data) => client.post('/users/me/feedback', data).then((r) => r.data)
export const getWebsiteRepresentatives = (id) => client.get(`/users/me/website/${id}/representatives`).then((r) => r.data)
export const transferWebsiteOwnership = (id, newOwnerId) => client.post(`/users/me/website/${id}/transfer`, { newOwnerId }).then((r) => r.data)
export const initWebsiteVerify    = (url) => client.post('/users/me/website/verify-init', { url }).then((r) => r.data)
export const confirmWebsiteVerify = (websiteId) => client.post('/users/me/website/verify-confirm', { websiteId }).then((r) => r.data)
export const removeWebsiteVerify  = (id) => client.delete(`/users/me/website/${id}`).then((r) => r.data)
export const requestRepresentation = (url, ownerId) => client.post('/users/me/website/request-representation', { url, ownerId }).then((r) => r.data)
export const revokeRepresentation  = () => client.delete('/users/me/website/representation').then((r) => r.data)
export const getApprovedRepresentatives = () => client.get('/users/me/website/representatives').then((r) => r.data)
export const revokeRepresentative = (userId) => client.delete(`/users/me/website/representatives/${userId}`).then((r) => r.data)
export const getRepresentationRequests = () => client.get('/users/me/website/representation-requests').then((r) => r.data)
export const handleRepresentationRequest = (id, action) => client.patch(`/users/me/website/representation-requests/${id}`, { action }).then((r) => r.data)
export const getMyRepresentationStatus = () => client.get('/users/me/website/my-requests').then((r) => r.data)
export const cancelRepresentationRequest = (id) => client.delete(`/users/me/website/my-requests/${id}`).then((r) => r.data)
export const getNotifications = () => client.get('/users/me/notifications').then((r) => r.data)
export const markNotificationsRead = () => client.patch('/users/me/notifications/read-all').then((r) => r.data)
export const clearNotifications = () => client.delete('/users/me/notifications').then((r) => r.data)
// Files for chat messages. Over the size limit it fails at once, without sending anything.
// Up to CHUNK_BYTES goes in one request; anything bigger is sent in pieces of CHUNK_BYTES,
// because Cloudflare refuses any single request over 100 MB (backend chunkedUpload.controller.js).
// onProgress(0..100) is called as bytes go out.
export const uploadFile  = async (file, { onProgress } = {}) => {
  if (file.size > MAX_UPLOAD_BYTES) throw tooLargeError(file)
  if (file.size <= CHUNK_BYTES) {
    const form = new FormData()
    form.append('file', file)
    const r = await client.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    })
    return r.data
  }

  const { data: start } = await client.post('/upload/chunked/start', {
    fileName: file.name, mimeType: file.type, size: file.size,
  })
  let sent = 0
  for (let i = 0; i < start.chunks; i++) {
    const piece = file.slice(i * start.chunkSize, (i + 1) * start.chunkSize)
    // A dropped piece is retried a couple of times before the whole upload gives up.
    for (let attempt = 1; ; attempt++) {
      try {
        await client.put(`/upload/chunked/${start.uploadId}/${i}`, piece, {
          headers: { 'Content-Type': 'application/octet-stream' },
          onUploadProgress: (e) => onProgress?.(Math.round(((sent + e.loaded) / file.size) * 100)),
        })
        break
      } catch (err) {
        if (attempt >= 3 || err.response?.status < 500) throw err
      }
    }
    sent += piece.size
    onProgress?.(Math.round((sent / file.size) * 100))
  }
  const { data } = await client.post(`/upload/chunked/${start.uploadId}/complete`)
  return data
}

// Becoming a representative of a company by proving you receive mail at its domain. Admin
// rights still come only from a meta tag or a DNS record.
export const sendRepEmailCode = (url, email) =>
  client.post('/users/me/website/rep-email-code', { url, email }).then((r) => r.data)
export const confirmRepEmailCode = (url, code) =>
  client.post('/users/me/website/rep-email-confirm', { url, code }).then((r) => r.data)
export const removeMyRepresentationFor = (url) =>
  client.delete('/users/me/website/representation-for', { params: { url } }).then((r) => r.data)
