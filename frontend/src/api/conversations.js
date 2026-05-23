import client from './client'

export const getConversations = () => client.get('/conversations').then((r) => r.data)
export const getOrCreateDirect = (userId) => client.post('/conversations/direct', { userId }).then((r) => r.data)
export const getConversation = (id) => client.get(`/conversations/${id}`).then((r) => r.data)
export const markReadApi = (id) => client.patch(`/conversations/${id}/read`).then((r) => r.data)
export const getMessages = (conversationId, before) =>
  client.get(`/conversations/${conversationId}/messages`, { params: { before } }).then((r) => r.data)
export const sendMessageApi = (conversationId, content, messageType = 'text') =>
  client.post(`/conversations/${conversationId}/messages`, { content, messageType }).then((r) => r.data)

export const archiveConversation  = (id) => client.patch(`/conversations/${id}/archive`).then((r) => r.data)
export const pinConversation      = (id) => client.patch(`/conversations/${id}/pin`).then((r) => r.data)
export const favoriteConversation = (id) => client.patch(`/conversations/${id}/favorite`).then((r) => r.data)
export const muteConversation     = (id) => client.patch(`/conversations/${id}/mute`).then((r) => r.data)
export const deleteConversationApi = (id) => client.delete(`/conversations/${id}`).then((r) => r.data)
export const clearMessagesApi     = (id) => client.delete(`/conversations/${id}/messages`).then((r) => r.data)
export const forwardMessageApi    = (messageId, targetConversationId) =>
  client.post(`/conversations/messages/${messageId}/forward`, { targetConversationId }).then((r) => r.data)
export const deleteMessageApi     = (id) => client.delete(`/conversations/messages/${id}`).then((r) => r.data)
export const toggleReactionApi    = (messageId, emoji) =>
  client.post(`/conversations/messages/${messageId}/reactions`, { emoji }).then((r) => r.data)
