// Set by PublicProfilePage.jsx when a visitor clicks "Send Message" on someone's public profile,
// consumed once by ChatPage.jsx on mount — survives any number of redirects through login/signup/
// KYC in between, since none of those pages need to know about it.
export const PENDING_DM_KEY = 'pulse_pending_dm'

// Callers already inside the app (the business profile popup) fire this after setting the key:
// ChatPage is mounted already, so navigating to /chat wouldn't run its mount effect and the
// pending conversation would sit there unopened.
export const PENDING_DM_EVENT = 'pulse:pending-dm'

export function requestPendingDm(username) {
  localStorage.setItem(PENDING_DM_KEY, username)
  window.dispatchEvent(new Event(PENDING_DM_EVENT))
}
