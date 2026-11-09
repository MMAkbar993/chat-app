import axios from 'axios'

// The giveaway has its own sign in (an email code, not a Pulse account), so it gets its own
// client: the main one turns any 401 into a refresh and a jump to /login, which is wrong here.
const api = axios.create({ baseURL: '/api/giveaway' })

const TOKEN_KEY = 'pulse_xmas_token'
const DEVICE_KEY = 'pulse_xmas_device'

// Storage can be missing or throw (private windows, blocked site data); the page still works,
// the person just signs in again with a new code.
function read(key) {
  try { return localStorage.getItem(key) } catch { return null }
}
function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch { /* storage unavailable */ }
}

export const getToken = () => read(TOKEN_KEY)
export const setToken = (token) => write(TOKEN_KEY, token)

// A random id for this browser, sent when joining so one browser cannot open many entries.
export function getDeviceId() {
  let id = read(DEVICE_KEY)
  if (!id || !/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
    const bytes = crypto.getRandomValues(new Uint8Array(18))
    id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    write(DEVICE_KEY, id)
  }
  return id
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Preview mode (testers only, decided by the server): the December day being tried. Kept for the
// browser tab, so a reload stays on the same day.
const PREVIEW_DAY_KEY = 'pulse_xmas_preview_day'
export function getPreviewDay() {
  try { return sessionStorage.getItem(PREVIEW_DAY_KEY) } catch { return null }
}
export function setPreviewDay(day) {
  try { sessionStorage.setItem(PREVIEW_DAY_KEY, day) } catch { /* storage unavailable */ }
}

export async function fetchState() {
  const day = getPreviewDay()
  const { data } = await api.get('/state', { params: day ? { day } : {} })
  return data
}

export async function resetPreview() {
  await api.post('/preview/reset')
}

export async function startJoin({ email, category, turnstileToken }) {
  const { data } = await api.post('/join/start', { email, category, turnstileToken, deviceId: getDeviceId() })
  return data
}

export async function verifyJoin({ email, code, category }) {
  const { data } = await api.post('/join/verify', { email, code, category, deviceId: getDeviceId() })
  setToken(data.token)
  return data
}

export async function spin() {
  const day = getPreviewDay()
  const { data } = await api.post('/spin', day ? { day } : {})
  return data
}

export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const msg = err?.response?.data?.error
  return typeof msg === 'string' && msg ? msg : fallback
}

export const CATEGORIES = [
  { value: 'affiliate_publisher', label: 'Affiliate / Publisher' },
  { value: 'casino_affiliate_manager', label: 'Casino / Affiliate Manager' },
  { value: 'event_organizer', label: 'Event Organizer' },
  { value: 'affiliate_network', label: 'Affiliate Network' },
  { value: 'other', label: 'Other (everyone else in iGaming)' },
]

// What a prize code is for. Public: the claim page shows the prize before anyone signs in.
export async function previewClaim(code) {
  const { data } = await api.get(`/claim/${encodeURIComponent(code)}`)
  return data
}
