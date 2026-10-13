// The message to show a member when an API call fails. Our backend answers errors as
// { error: '...' } written for people, so that wins; anything else (network down, a proxy
// error page) gets the plain fallback the caller supplies.
export function apiErrorMessage(err, fallback) {
  const msg = err?.response?.data?.error
  return typeof msg === 'string' && msg ? msg : fallback
}
