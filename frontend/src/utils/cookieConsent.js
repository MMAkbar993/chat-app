// Analytics cookies are non-essential, and the Cookie Policy commits to asking before any are
// set. So Google Analytics is not in index.html at all — nothing loads until someone accepts,
// which keeps a visitor who declines (or who never answers) free of analytics cookies entirely.

export const GA_MEASUREMENT_ID = 'G-Y3QTER6L97'

const STORAGE_KEY = 'pulse:cookieConsent'
// Fired when the choice changes, so the banner and the preferences link stay in step without
// either of them owning the state.
export const CONSENT_EVENT = 'pulse:cookie-consent'

// 'granted' | 'denied' | null (never asked)
export function readConsent() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    // Private mode, or storage blocked entirely. Treated as "never asked": the banner shows
    // again next time, which is the safe way round — it never silently assumes consent.
    return null
  }
}

export function setConsent(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Can't remember the choice, but still honour it for this page view.
  }
  if (value === 'granted') loadAnalytics()
  else disableAnalytics()
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }))
}

export function clearConsent() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch { /* nothing to clear */ }
  disableAnalytics()
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }))
}

let loaded = false

export function loadAnalytics() {
  if (loaded || typeof document === 'undefined') return
  loaded = true

  // Google's documented kill switch. Clearing it matters when consent is granted after having
  // been withdrawn earlier in the same page view.
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = false

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag() { window.dataLayer.push(arguments) }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID)
}

// Withdrawing consent has to stop collection now, not at the next reload, and take the cookies
// already set with it — otherwise "withdraw" would only mean "stop after you refresh".
export function disableAnalytics() {
  if (typeof document === 'undefined') return
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = true

  const host = window.location.hostname
  // A _ga cookie may have been written against the bare domain or a dot-prefixed parent, and a
  // delete only lands when the domain matches how it was set — so try each candidate.
  const domains = [undefined, host, `.${host}`]
  const parts = host.split('.')
  if (parts.length > 2) domains.push(`.${parts.slice(-2).join('.')}`)

  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim()
    if (!name.startsWith('_ga') && name !== '_gid') continue
    for (const domain of domains) {
      document.cookie =
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/` +
        (domain ? `; domain=${domain}` : '')
    }
  }
}

// Called once at startup: someone who accepted on an earlier visit should not be asked again.
export function initAnalytics() {
  if (readConsent() === 'granted') loadAnalytics()
}
