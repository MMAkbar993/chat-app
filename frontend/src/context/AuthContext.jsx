import { createContext, useContext, useState, useEffect } from 'react'
import client, { setAccessToken } from '../api/client'
import { updateTimezone } from '../api/users'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.post('/auth/refresh')
      .then(({ data }) => {
        setAccessToken(data.accessToken)
        setUser(data.user)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Report this browser's timezone so other people see this user's real local time rather than
  // their own clock. Only when it differs from what's stored, so it's one call after a move or
  // a first sign-in and nothing on every load.
  useEffect(() => {
    if (!user) return
    let zone
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return
    }
    if (!zone || zone === user.timezone) return
    updateTimezone(zone)
      .then(() => setUser((u) => (u ? { ...u, timezone: zone } : u)))
      .catch(() => {})
  }, [user])

  async function refreshUser() {
    try {
      const { data } = await client.get('/auth/me')
      setUser(data.user)
    } catch {}
  }

  function login(userData, token) {
    setAccessToken(token)
    setUser(userData)
  }

  function logout() {
    client.post('/auth/logout').catch(() => {})
    setAccessToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
