import { getAccessToken } from '../api/client'

export const OAUTH_STORAGE_KEY = 'social-oauth-result'

export const PLATFORM_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  kick: 'Kick',
  twitch: 'Twitch',
  affiliate_roulette: 'Affiliate Roulette',
}

export function getPlatformLabel(platform) {
  return PLATFORM_LABELS[platform] || platform
}

const handledKeys = new Set()
const listeners = new Set()
let globalListenersAttached = false

function dedupe(key, ttl = 5000) {
  if (handledKeys.has(key)) return true
  handledKeys.add(key)
  setTimeout(() => handledKeys.delete(key), ttl)
  return false
}

function ingestOAuthResult(data) {
  if (!data?.type) return

  if (data.type === 'social-connect-success') {
    if (dedupe(`ok:${data.platform}`)) return
  } else if (data.type === 'social-connect-error') {
    if (dedupe(`err:${data.reason}:${data.ts || ''}`)) return
  }

  listeners.forEach((fn) => fn(data))
}

export function subscribeSocialOAuthResults(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function ensureSocialOAuthListeners() {
  if (globalListenersAttached) return
  globalListenersAttached = true

  window.addEventListener('message', (e) => {
    if (e.data?.type === 'social-connect-success' || e.data?.type === 'social-connect-error') {
      ingestOAuthResult(e.data)
    }
  })

  window.addEventListener('storage', (e) => {
    if (e.key !== OAUTH_STORAGE_KEY || !e.newValue) return
    try {
      ingestOAuthResult(JSON.parse(e.newValue))
    } catch {
      // ignore malformed payload
    }
  })
}

export function reportSocialOAuthSuccess(platform) {
  ingestOAuthResult({ type: 'social-connect-success', platform, ts: Date.now() })
}

export function publishSocialOAuthError(reason) {
  const payload = { type: 'social-connect-error', reason, ts: Date.now() }
  try {
    localStorage.setItem(OAUTH_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage errors
  }
  if (window.opener) {
    try {
      window.opener.postMessage(payload, '*')
    } catch {
      // ignore postMessage errors
    }
  }
  ingestOAuthResult(payload)
}

export function openSocialOAuthPopup(platform, { wasConnected, onPopupClosed } = {}) {
  ensureSocialOAuthListeners()

  const apiBase = import.meta.env.VITE_API_URL || window.location.origin
  const token = getAccessToken()
  const url = `${apiBase}/api/social/${platform}/connect${token ? `?token=${encodeURIComponent(token)}` : ''}`
  const popup = window.open(url, 'oauth-connect', 'width=600,height=700,menubar=no,toolbar=no')

  if (!popup) return { blocked: true }

  const poll = setInterval(() => {
    if (!popup.closed) return
    clearInterval(poll)
    if (!wasConnected) onPopupClosed?.()
  }, 500)

  return { blocked: false }
}
