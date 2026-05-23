import client from './client'

export const getCalls = () => client.get('/calls').then((r) => r.data)
export const initiateCall = (calleeId, callType, conversationId) =>
  client.post('/calls', { calleeId, callType, conversationId }).then((r) => r.data)
export const endCall = (callId, status, durationSeconds) =>
  client.patch(`/calls/${callId}`, { status, durationSeconds }).then((r) => r.data)
