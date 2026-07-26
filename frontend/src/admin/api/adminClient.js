import axios from 'axios'

const STORAGE_KEY = 'admin_token'

export function getAdminToken() {
  return localStorage.getItem(STORAGE_KEY)
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(STORAGE_KEY, token)
  else localStorage.removeItem(STORAGE_KEY)
}

const adminClient = axios.create({ baseURL: '/api/admin' })

adminClient.interceptors.request.use((config) => {
  const token = getAdminToken()
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

adminClient.interceptors.response.use(
  (res) => res,
  (error) => {
    // A 401 from the login request itself is a real "wrong credentials" error, not an
    // expired session — must not trigger the hard reload below, or the error never gets seen.
    if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
      setAdminToken(null)
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

export default adminClient
