import client from './client'

export const getLinkPreview = (url) =>
  client.get('/link-preview', { params: { url } }).then((r) => r.data)
