import client from './client'

export const getCurrentAd = () => client.get('/ads/current').then((r) => r.data)
export const trackAdClick = (id) => client.post(`/ads/${id}/click`).then((r) => r.data)
export const dismissAdApi = (id) => client.post(`/ads/${id}/dismiss`).then((r) => r.data)
