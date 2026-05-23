import client from './client'

export const getContacts = () => client.get('/contacts').then((r) => r.data)
export const searchUsers = (q) => client.get('/contacts/search', { params: { q } }).then((r) => r.data)
export const addContact = (contactId) => client.post('/contacts', { contactId }).then((r) => r.data)
export const removeContact = (contactId) => client.delete(`/contacts/${contactId}`).then((r) => r.data)
