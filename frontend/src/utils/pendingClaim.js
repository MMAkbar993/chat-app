// Set by the giveaway claim page (/claim) when a winner still has to sign up, sign in or verify
// their ID. ChatPage.jsx sends them back to /claim once they land in the app, so the prize code
// survives the whole sign up and ID check flow, none of which knows about the giveaway.
export const PENDING_CLAIM_KEY = 'pulse_pending_giveaway_claim'

export function setPendingClaim(code) {
  try { localStorage.setItem(PENDING_CLAIM_KEY, code) } catch { /* storage unavailable */ }
}

export function takePendingClaim() {
  try {
    const code = localStorage.getItem(PENDING_CLAIM_KEY)
    if (code) localStorage.removeItem(PENDING_CLAIM_KEY)
    return code
  } catch {
    return null
  }
}
