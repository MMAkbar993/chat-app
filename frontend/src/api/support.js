import client from './client'

// The help bubble's message form on the public pages. No account needed.
export const contactSupport = (payload) => client.post('/support/contact', payload).then((r) => r.data)
