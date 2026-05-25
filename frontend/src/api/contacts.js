import client from './client'

export const getContacts = () => client.get('/contacts').then((r) => r.data)
export const searchUsers = (q) => client.get('/contacts/search', { params: { q } }).then((r) => r.data)
export const addContact = (contactId) => client.post('/contacts', { contactId }).then((r) => r.data)
export const removeContact = (contactId) => client.delete(`/contacts/${contactId}`).then((r) => r.data)
export const updateContact = (contactId, firstName, lastName) =>
  client.patch(`/contacts/${contactId}`, { firstName, lastName }).then((r) => r.data)
export const sendInvite = (recipient, message) =>
  client.post('/contacts/invite', { recipient, message }).then((r) => r.data)
