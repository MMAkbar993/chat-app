import { useState, useEffect } from 'react'
import client from '../../api/client'

const PLATFORMS = [
  { key: 'facebook',  label: 'Facebook',    color: '#1877F2', icon: 'f' },
  { key: 'instagram', label: 'Instagram',   color: '#E1306C', icon: '◎' },
  { key: 'twitter',   label: 'X (Twitter)', color: '#000000', icon: '𝕏' },
  { key: 'linkedin',  label: 'LinkedIn',    color: '#0A66C2', icon: 'in', urlOnly: true },
  { key: 'youtube',   label: 'YouTube',     color: '#FF0000', icon: '▶' },
  { key: 'kick',      label: 'Kick',        color: '#53FC18', icon: '▸' },
  { key: 'twitch',    label: 'Twitch',      color: '#9147FF', icon: '◈' },
]

export default function SocialLinksSection({ darkMode }) {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(null)
  const [error, setError] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [savingLinkedin, setSavingLinkedin] = useState(false)

  const bg = darkMode ? 'bg-gray-800' : 'bg-gray-50'
  const text = darkMode ? 'text-white' : 'text-gray-900'
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const rowBg = darkMode ? 'bg-gray-700' : 'bg-white'

  useEffect(() => {
    client.get('/users/me/social')
      .then(({ data }) => {
        setConnections(data.connections)
        const li = data.connections.find((c) => c.platform === 'linkedin')
        if (li?.profile_url) setLinkedinUrl(li.profile_url)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    // Listen for OAuth popup success
    const onMessage = (e) => {
      if (e.data?.type === 'social-connect-success') {
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

  async function saveLinkedin() {
    setSavingLinkedin(true)
    setError('')
    try {
      await client.post('/social/linkedin/save-url', { url: linkedinUrl })
      setConnections((prev) => {
        const filtered = prev.filter((c) => c.platform !== 'linkedin')
        if (linkedinUrl.trim()) return [...filtered, { platform: 'linkedin', profile_url: linkedinUrl.trim(), username: null }]
        return filtered
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save LinkedIn URL')
    }
    setSavingLinkedin(false)
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

          // LinkedIn: URL paste flow
          if (p.urlOnly) {
            return (
              <div key={p.key} className={`rounded-xl p-3 border ${darkMode ? 'border-gray-600' : 'border-gray-200'} ${rowBg}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: p.color }}>
                    {p.icon}
                  </div>
                  <p className={`text-sm font-medium flex-1 ${text}`}>{p.label}</p>
                  <span className={`text-xs ${sub}`}>URL only</span>
                </div>
                <div className="flex gap-2">
                  <input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourname"
                    className={`flex-1 min-w-0 rounded-xl px-3 py-1.5 text-xs outline-none border ${
                      darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
                    }`}
                  />
                  <button
                    onClick={saveLinkedin}
                    disabled={savingLinkedin}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold disabled:opacity-50 shrink-0 transition-colors"
                  >
                    {savingLinkedin ? '…' : 'Save'}
                  </button>
                </div>
              </div>
            )
          }

          return (
            <div
              key={p.key}
              className={`flex items-center gap-3 rounded-xl p-3 border ${
                darkMode ? 'border-gray-600' : 'border-gray-200'
              } ${rowBg}`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: p.color }}
              >
                {p.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${text}`}>{p.label}</p>
                {conn?.username && (
                  <p className={`text-xs truncate ${sub}`}>@{conn.username}</p>
                )}
              </div>

              {isConnected ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">Verified</span>
                  <button
                    onClick={() => disconnectPlatform(p.key)}
                    disabled={disconnecting === p.key}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 ${
                      darkMode ? 'hover:bg-red-900/20' : ''
                    }`}
                    title="Remove connection"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => connectPlatform(p.key)}
                  className="text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-1 font-medium shrink-0 transition-colors"
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
