import { createContext, useContext, useState, useEffect } from 'react'
import client, { setAccessToken } from '../api/client'

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
