import { useState, useEffect } from 'react'
import client from '../../api/client'

const PLATFORMS = [
  { key: 'linkedin',  label: 'LinkedIn',    color: '#0A66C2', icon: 'in' },
  { key: 'youtube',   label: 'YouTube',     color: '#FF0000', icon: '▶' },
  { key: 'facebook',  label: 'Facebook',    color: '#1877F2', icon: 'f' },
  { key: 'instagram', label: 'Instagram',   color: '#E1306C', icon: '◎' },
  { key: 'twitter',   label: 'X (Twitter)', color: '#000000', icon: '𝕏' },
  { key: 'twitch',    label: 'Twitch',      color: '#9147FF', icon: '◈' },
  { key: 'kick',      label: 'Kick',        color: '#53FC18', icon: '▸' },
]

export default function SocialLinksSection({ darkMode }) {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(null)
  const [error, setError] = useState('')

  const bg = darkMode ? 'bg-gray-800' : 'bg-gray-50'
  const text = darkMode ? 'text-white' : 'text-gray-900'
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const rowBg = darkMode ? 'bg-gray-700' : 'bg-white'

  useEffect(() => {
    client.get('/users/me/social')
      .then(({ data }) => setConnections(data.connections))
      .catch(() => {})
      .finally(() => setLoading(false))

    // Listen for OAuth popup success
    const onMessage = (e) => {
      if (e.data?.type === 'social-connect-success') {
        // Refresh connections
        client.get('/users/me/social')
          .then(({ data }) => setConnections(data.connections))
          .catch(() => {})
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function connectPlatform(key) {
    // In dev, backend is on :3001; in prod, same origin via proxy
    const apiBase = import.meta.env.VITE_API_URL || window.location.origin.replace(':5173', ':3001')
    const url = `${apiBase}/api/social/${key}/connect`
    window.open(url, 'oauth-connect', 'width=600,height=700,menubar=no,toolbar=no')
  }

  async function disconnectPlatform(key) {
    setDisconnecting(key)
    setError('')
    try {
      await client.delete(`/social/${key}`)
      setConnections((prev) => prev.filter((c) => c.platform !== key))
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disconnect')
    }
    setDisconnecting(null)
  }

  const connectedKeys = new Set(connections.map((c) => c.platform))

  if (loading) return null

  return (
    <div className={`rounded-2xl p-4 mb-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <span className={`text-sm font-bold ${text}`}>Social Accounts</span>
      </div>

      <p className={`text-xs mb-4 ${sub}`}>
        Connect your social accounts to verify your identity and display them on your public profile.
      </p>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      <div className="space-y-2">
        {PLATFORMS.map((p) => {
          const conn = connections.find((c) => c.platform === p.key)
          const isConnected = !!conn

          return (
            <div
              key={p.key}
              className={`flex items-center gap-3 rounded-xl p-3 border ${
                darkMode ? 'border-gray-600' : 'border-gray-200'
              } ${rowBg}`}
            >
              {/* Platform icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: p.color }}
              >
                {p.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${text}`}>{p.label}</p>
                {conn?.username && (
                  <p className={`text-xs truncate ${sub}`}>@{conn.username}</p>
                )}
              </div>

              {/* Action */}
              {isConnected ? (
                <button
                  onClick={() => disconnectPlatform(p.key)}
                  disabled={disconnecting === p.key}
                  className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 shrink-0"
                >
                  {disconnecting === p.key ? 'Removing…' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={() => connectPlatform(p.key)}
                  className="text-xs text-violet-600 hover:text-violet-800 font-medium shrink-0"
                >
                  Connect
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
