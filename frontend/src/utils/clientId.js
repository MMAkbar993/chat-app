// A name for one outgoing message, made on the sender's device. The server uses it to tell a
// retry from a new message, so a slow connection never produces a duplicate.
export function newClientId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
