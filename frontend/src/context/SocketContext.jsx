import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { getAccessToken, refreshAccessToken } from '../api/client'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  // Guards against a refresh loop if the refresh token itself is dead.
  const authRetryRef = useRef(false)

  useEffect(() => {
    if (!user) return

    const s = io('/', {
      // A callback, not a fixed value: socket.io calls this for every connection attempt,
      // so reconnects pick up the current token. Passing `auth: { token }` once meant every
      // reconnect after the 15-minute access token expired was rejected by the server — and
      // because that's a middleware error, socket.io stops retrying entirely. The tab then
      // sat there silently dead: no incoming messages, and outgoing emits going nowhere,
      // until the user manually refreshed the page.
      auth: (cb) => cb({ token: getAccessToken() }),
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    s.on('connect', () => {
      authRetryRef.current = false
      setConnected(true)
    })
    s.on('disconnect', () => setConnected(false))

    s.on('connect_error', async (err) => {
      setConnected(false)
      // Auth rejections come from the server's io.use() middleware, and socket.io does not
      // retry those on its own — we have to get a fresh token and reconnect by hand.
      const isAuthError = /token/i.test(err?.message || '')
      if (!isAuthError || authRetryRef.current) return
      authRetryRef.current = true
      try {
        await refreshAccessToken()
        s.connect()
      } catch {
        // Refresh token is gone too — the axios layer handles sending them to /login.
      }
    })

    setSocket(s)

    // A tab that was asleep (laptop closed, phone locked, background tab) can come back with
    // a socket that's quietly dead. Nudge it whenever the tab becomes visible or the network
    // returns, so the user doesn't have to refresh to start receiving again.
    const revive = () => { if (!s.connected) s.connect() }
    const onVisible = () => { if (document.visibilityState === 'visible') revive() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', revive)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', revive)
      s.disconnect()
      setSocket(null)
      setConnected(false)
    }
  }, [user])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
