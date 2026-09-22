import client from './client'

export const getMyBusinesses = () => client.get('/businesses/me').then((r) => r.data)
export const createBusiness = (data) => client.post('/businesses', data).then((r) => r.data)
export const updateBusiness = (id, data) => client.patch(`/businesses/${id}`, data).then((r) => r.data)
export const getPublicBusiness = (slug) => client.get(`/businesses/slug/${encodeURIComponent(slug)}`).then((r) => r.data)

function uploadImage(id, kind, file) {
  const form = new FormData()
  form.append('file', file)
  return client.post(`/businesses/${id}/${kind}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
}
export const uploadBusinessLogo = (id, file) => uploadImage(id, 'logo', file)
export const uploadBusinessCover = (id, file) => uploadImage(id, 'cover', file)
