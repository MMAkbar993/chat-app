// Turns a failed call join into something a member can act on. Agora reports device and
// network trouble as AgoraRTCError codes; the browser's own getUserMedia errors arrive by name;
// our token request fails as an HTTP error. Every message carries the raw code too, so a
// report like "calls don't work on Edge" comes back with the actual cause.
const DEVICE_BLOCKED = new Set(['PERMISSION_DENIED', 'NotAllowedError', 'SecurityError'])
const DEVICE_MISSING = new Set(['DEVICE_NOT_FOUND', 'NotFoundError', 'OverconstrainedError'])
const DEVICE_BUSY = new Set(['NOT_READABLE', 'NotReadableError', 'AbortError'])
const UNREACHABLE = new Set([
  'CAN_NOT_GET_GATEWAY_SERVER', 'NETWORK_ERROR', 'NETWORK_TIMEOUT', 'NETWORK_RESPONSE_ERROR',
  'WS_ABORT', 'WS_DISCONNECT', 'WS_ERR', 'UNEXPECTED_RESPONSE', 'CAN_NOT_PUBLISH_MULTIPLE_VIDEO_TRACKS',
])

export function describeCallError(err) {
  const code = err?.code || err?.name || (err?.response?.status ? `HTTP ${err.response.status}` : 'UNKNOWN')
  const raw = String(err?.code || err?.name || '')
  // getUserMedia errors are sometimes wrapped: the browser's name sits in the message.
  const text = `${raw} ${err?.message || ''}`
  const has = (set) => set.has(raw) || [...set].some((k) => text.includes(k))

  let message
  if (err?.response?.data?.error) {
    message = err.response.data.error
  } else if (has(DEVICE_BLOCKED)) {
    message = 'Your browser is blocking the microphone or camera. Click the lock icon next to the address bar, allow them for this site, then call again.'
  } else if (has(DEVICE_MISSING)) {
    message = 'No microphone or camera was found. Connect one and call again.'
  } else if (has(DEVICE_BUSY)) {
    message = 'Your microphone or camera is being used by another app. Close it and call again.'
  } else if (has(UNREACHABLE)) {
    message = "Couldn't reach the call service. Check your connection. In Microsoft Edge, set Tracking prevention to Balanced (Settings, Privacy) and call again."
  } else if (raw === 'NOT_SUPPORTED') {
    message = 'This browser cannot make calls. Please use an up to date Chrome, Edge, Firefox or Safari.'
  } else {
    message = "Couldn't connect the call. Please try again."
  }
  return { code, message }
}
