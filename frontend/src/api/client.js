import axios from 'axios'

let accessToken = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

const client = axios.create({ baseURL: '/api', withCredentials: true })

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`
  }
  return config
})

let isRefreshing = false
let refreshQueue = []

function processQueue(error, token) {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  refreshQueue = []
}

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    // Only treat a 401 as "my session expired" if this request actually carried an access
    // token. Unauthenticated requests (login, register, etc.) never do — their 401s are real
    // errors (e.g. wrong password) and must not trigger a refresh + redirect-to-login.
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      original.headers?.Authorization
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers['Authorization'] = `Bearer ${token}`
          return client(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        accessToken = data.accessToken
        processQueue(null, accessToken)
        original.headers['Authorization'] = `Bearer ${accessToken}`
        return client(original)
      } catch (err) {
        processQueue(err, null)
        accessToken = null
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default client
