import client from './client'

export const getGroups = () => client.get('/groups').then((r) => r.data)
export const createGroup = (name, memberIds) => client.post('/groups', { name, memberIds }).then((r) => r.data)
export const getGroup = (id) => client.get(`/groups/${id}`).then((r) => r.data)
export const updateGroup = (id, data) => client.patch(`/groups/${id}`, data).then((r) => r.data)
export const addMember = (groupId, userId) => client.post(`/groups/${groupId}/members`, { userId }).then((r) => r.data)
export const removeMember = (groupId, userId) => client.delete(`/groups/${groupId}/members/${userId}`).then((r) => r.data)
