import client from './client'

export const getMyProfile = () => client.get('/users/me').then((r) => r.data)
export const updateProfile = (data) => client.patch('/users/me', data).then((r) => r.data)
export const uploadAvatar = (file) => {
  const form = new FormData()
  form.append('avatar', file)
  return client.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
}
export const getUserById = (id) => client.get(`/users/${id}`).then((r) => r.data)
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
export const initWebsiteVerify    = (url) => client.post('/users/me/website/verify-init', { url }).then((r) => r.data)
export const confirmWebsiteVerify = (websiteId) => client.post('/users/me/website/verify-confirm', { websiteId }).then((r) => r.data)
export const removeWebsiteVerify  = (id) => client.delete(`/users/me/website/${id}`).then((r) => r.data)
export const requestRepresentation = (url, ownerId) => client.post('/users/me/website/request-representation', { url, ownerId }).then((r) => r.data)
export const getRepresentationRequests = () => client.get('/users/me/website/representation-requests').then((r) => r.data)
export const handleRepresentationRequest = (id, action) => client.patch(`/users/me/website/representation-requests/${id}`, { action }).then((r) => r.data)
export const getNotifications = () => client.get('/users/me/notifications').then((r) => r.data)
export const markNotificationsRead = () => client.patch('/users/me/notifications/read-all').then((r) => r.data)
export const uploadFile  = (file) => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
}
