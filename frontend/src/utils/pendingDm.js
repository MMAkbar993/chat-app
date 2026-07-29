// Set by PublicProfilePage.jsx when a visitor clicks "Send Message" on someone's public profile,
// consumed once by ChatPage.jsx on mount — survives any number of redirects through login/signup/
// KYC in between, since none of those pages need to know about it.
export const PENDING_DM_KEY = 'pulse_pending_dm'
