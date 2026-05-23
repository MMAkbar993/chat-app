import client from './client'

export const getMyProfile = () => client.get('/users/me').then((r) => r.data)
export const updateProfile = (data) => client.patch('/users/me', data).then((r) => r.data)
export const uploadAvatar = (file) => {
  const form = new FormData()
  form.append('avatar', file)
  return client.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
}
export const getUserById = (id) => client.get(`/users/${id}`).then((r) => r.data)
export const blockUser   = (id) => client.post(`/users/${id}/block`).then((r) => r.data)
export const unblockUser = (id) => client.delete(`/users/${id}/block`).then((r) => r.data)
export const reportUser  = (id, reason) => client.post(`/users/${id}/report`, { reason }).then((r) => r.data)
export const uploadFile  = (file) => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
}
