import { createContext, useContext, useState, useEffect } from 'react'
import adminClient, { getAdminToken, setAdminToken } from '../api/adminClient'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getAdminToken()
    if (!token) { setLoading(false); return }
    adminClient.get('/me')
      .then(({ data }) => setAdmin(data.admin))
      .catch(() => setAdminToken(null))
      .finally(() => setLoading(false))
  }, [])

  function login(adminData, token) {
    setAdminToken(token)
    setAdmin(adminData)
  }

  function logout() {
    setAdminToken(null)
    setAdmin(null)
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, setAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}
