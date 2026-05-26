import { useState, useEffect } from 'react'
import client, { getAccessToken } from '../../api/client'
import ConfirmDialog from '../ui/ConfirmDialog'

const PLATFORMS = [
  { key: 'facebook',  label: 'Facebook',    color: '#1877F2', icon: 'f' },
  { key: 'instagram', label: 'Instagram',   color: '#E1306C', icon: '◎' },
  { key: 'twitter',   label: 'X (Twitter)', color: '#000000', icon: '𝕏' },
  { key: 'linkedin',  label: 'LinkedIn',    color: '#0A66C2', icon: 'in', urlOnly: true },
  { key: 'youtube',   label: 'YouTube',     color: '#FF0000', icon: '▶' },
  { key: 'kick',      label: 'Kick',        color: '#53FC18', icon: '▸' },
  { key: 'twitch',    label: 'Twitch',      color: '#9147FF', icon: '◈' },
]

export default function SocialLinksSection({ darkMode, onToast }) {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(null)
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [savingLinkedin, setSavingLinkedin] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(null)

  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const text = darkMode ? 'text-white' : 'text-gray-900'
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

    const onMessage = (e) => {
      if (e.data?.type === 'social-connect-success') {
        const label = PLATFORMS.find((p) => p.key === e.data.platform)?.label || e.data.platform
        onToast?.(`${label} account connected successfully.`)
        client.get('/users/me/social')
          .then(({ data }) => setConnections(data.connections))
          .catch(() => {})
      }
      if (e.data?.type === 'social-connect-error') {
        onToast?.(e.data.reason || 'Could not connect account. Please try again.', 'error')
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onToast])

  function connectPlatform(key) {
    const apiBase = import.meta.env.VITE_API_URL || window.location.origin.replace(':5173', ':3001')
    const token = getAccessToken()
    const url = `${apiBase}/api/social/${key}/connect${token ? `?token=${encodeURIComponent(token)}` : ''}`
    window.open(url, 'oauth-connect', 'width=600,height=700,menubar=no,toolbar=no')
  }

  async function disconnectPlatform(key) {
    setDisconnecting(key)
    try {
      await client.delete(`/social/${key}`)
      setConnections((prev) => prev.filter((c) => c.platform !== key))
      onToast?.('Account disconnected.')
    } catch (err) {
      onToast?.(err.response?.data?.error || 'Could not disconnect account. Please try again.', 'error')
    }
    setDisconnecting(null)
  }

  async function saveLinkedin() {
    setSavingLinkedin(true)
    try {
      await client.post('/social/linkedin/save-url', { url: linkedinUrl })
      setConnections((prev) => {
        const filtered = prev.filter((c) => c.platform !== 'linkedin')
        if (linkedinUrl.trim()) return [...filtered, { platform: 'linkedin', profile_url: linkedinUrl.trim(), username: null }]
        return filtered
      })
      onToast?.('LinkedIn profile URL saved.')
    } catch (err) {
      onToast?.(err.response?.data?.error || 'Failed to save LinkedIn URL', 'error')
    }
    setSavingLinkedin(false)
  }

  if (loading) return null

  const confirmLabel = PLATFORMS.find((p) => p.key === confirmDisconnect)?.label || ''

  return (
    <>
      <p className={`text-xs mb-4 ${sub}`}>
        All social profiles are verified via OAuth unless otherwise stated.
        Verified links are shown with a badge. Other links are displayed as provided.
      </p>

      <div className="space-y-2">
        {PLATFORMS.map((p) => {
          const conn = connections.find((c) => c.platform === p.key)
          const isConnected = !!conn

          if (p.urlOnly) {
            return (
              <div key={p.key} className={`rounded-xl p-3 border ${darkMode ? 'border-gray-600' : 'border-gray-200'} ${rowBg}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: p.color }}>
                    {p.icon}
                  </div>
                  <p className={`text-sm font-medium flex-1 ${text}`}>{p.label}</p>
                  <div className="relative group">
                    <svg className={`w-3.5 h-3.5 cursor-help ${sub}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className={`absolute right-0 bottom-5 w-52 text-xs rounded-lg px-2.5 py-1.5 z-20 leading-snug opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-white'}`}>
                      LinkedIn does not allow OAuth to verify profile.
                    </div>
                  </div>
                </div>
                <p className={`text-xs mb-2 ${sub}`}>
                  Your LinkedIn profile URL (e.g. https://www.linkedin.com/in/yourname).
                </p>
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
                <p className={`text-sm font-medium whitespace-nowrap ${text}`}>{p.label}</p>
                {conn?.username && (
                  <p className={`text-xs truncate ${sub}`}>@{conn.username}</p>
                )}
              </div>

              {isConnected ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">Verified</span>
                  <button
                    onClick={() => setConfirmDisconnect(p.key)}
                    disabled={disconnecting === p.key}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 ${
                      darkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
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

      <ConfirmDialog
        open={!!confirmDisconnect}
        darkMode={darkMode}
        title="Remove social account?"
        message="Remove this social account? You can connect again later."
        confirmLabel={disconnecting ? 'Removing…' : 'Remove'}
        variant="danger"
        onConfirm={() => {
          const key = confirmDisconnect
          setConfirmDisconnect(null)
          disconnectPlatform(key)
        }}
        onCancel={() => setConfirmDisconnect(null)}
      />
    </>
  )
}
