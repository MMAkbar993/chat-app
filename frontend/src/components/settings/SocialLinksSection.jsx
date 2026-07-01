import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client'
import ConfirmDialog from '../ui/ConfirmDialog'
import SocialIcon from '../ui/SocialIcon'
import {
  openSocialOAuthPopup,
  reportSocialOAuthSuccess,
  subscribeSocialOAuthResults,
} from '../../utils/socialOAuth'

const AFFILIATE_ROULETTE_ROLES = [
  'affiliate_publisher',
  'casino_operator',
  'affiliate_manager',
  'influencer_streamer',
  'event_organizer',
]

const PLATFORMS = [
  { key: 'facebook',           label: 'Facebook' },
  { key: 'instagram',          label: 'Instagram' },
  { key: 'twitter',            label: 'X (Twitter)',        connectKey: 'x' },
  { key: 'linkedin',           label: 'LinkedIn',           urlOnly: true },
  { key: 'youtube',            label: 'YouTube' },
  { key: 'kick',               label: 'Kick' },
  { key: 'twitch',             label: 'Twitch' },
  { key: 'affiliate_roulette', label: 'Affiliate Roulette', urlOnly: true, affiliateRoulette: true },
]

export default function SocialLinksSection({ darkMode, onToast, profile }) {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(null)
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [savingLinkedin, setSavingLinkedin] = useState(false)
  const [affiliateRouletteUrl, setAffiliateRouletteUrl] = useState('')
  const [savingAffiliateRoulette, setSavingAffiliateRoulette] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(null)
  const [editing, setEditing] = useState(null) // 'linkedin' | 'affiliate_roulette'

  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const text = darkMode ? 'text-white' : 'text-gray-900'
  const rowBg = darkMode ? 'bg-gray-700' : 'bg-white'

  const refreshConnections = useCallback(() => {
    return client.get('/users/me/social')
      .then(({ data }) => {
        setConnections(data.connections)
        return data.connections
      })
      .catch(() => [])
  }, [])

  useEffect(() => {
    refreshConnections()
      .then((conns) => {
        const li = conns.find((c) => c.platform === 'linkedin')
        if (li?.profile_url) setLinkedinUrl(li.profile_url)
        const ar = conns.find((c) => c.platform === 'affiliate_roulette')
        if (ar?.profile_url) setAffiliateRouletteUrl(ar.profile_url)
      })
      .finally(() => setLoading(false))

    return subscribeSocialOAuthResults((data) => {
      if (data.type === 'social-connect-success') {
        refreshConnections()
      }
    })
  }, [refreshConnections])

  useEffect(() => {
    function onWindowFocus() {
      refreshConnections()
    }
    window.addEventListener('focus', onWindowFocus)
    return () => window.removeEventListener('focus', onWindowFocus)
  }, [refreshConnections])

  function connectPlatform(key) {
    const wasConnected = connections.some((c) => c.platform === key)
    const connectKey = PLATFORMS.find((p) => p.key === key)?.connectKey || key
    const { blocked } = openSocialOAuthPopup(connectKey, {
      wasConnected,
      onPopupClosed: () => {
        refreshConnections().then((conns) => {
          if (!wasConnected && conns.some((c) => c.platform === key)) {
            reportSocialOAuthSuccess(key)
          }
        })
      },
    })
    if (blocked) {
      onToast?.('Popup was blocked. Allow popups for this site and try again.', 'error')
    }
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

  async function saveAffiliateRoulette() {
    setSavingAffiliateRoulette(true)
    try {
      await client.post('/social/affiliate-roulette/save-url', { url: affiliateRouletteUrl })
      setConnections((prev) => {
        const filtered = prev.filter((c) => c.platform !== 'affiliate_roulette')
        if (affiliateRouletteUrl.trim()) return [...filtered, { platform: 'affiliate_roulette', profile_url: affiliateRouletteUrl.trim(), username: null }]
        return filtered
      })
      onToast?.('Affiliate Roulette URL saved.')
      setEditing(null)
    } catch (err) {
      onToast?.(err.response?.data?.error || 'Failed to save Affiliate Roulette URL', 'error')
    }
    setSavingAffiliateRoulette(false)
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
      setEditing(null)
    } catch (err) {
      onToast?.(err.response?.data?.error || 'Failed to save LinkedIn URL', 'error')
    }
    setSavingLinkedin(false)
  }

  if (loading) return null

  const userRole = profile?.primary_role
  const showAffiliateRoulette = AFFILIATE_ROULETTE_ROLES.includes(userRole)

  const confirmLabel = PLATFORMS.find((p) => p.key === confirmDisconnect)?.label || ''

  return (
    <>
      <p className={`text-xs mb-4 ${sub}`}>
        All social profiles are verified via OAuth unless otherwise stated.
        Verified links are shown with a badge. Other links are displayed as provided.
      </p>

      <div className="space-y-2">
        {PLATFORMS.map((p) => {
          if (p.affiliateRoulette && !showAffiliateRoulette) return null

          const conn = connections.find((c) => c.platform === p.key)
          const isConnected = !!conn

          if (p.urlOnly) {
            const isAR = p.affiliateRoulette
            const urlValue = isAR ? affiliateRouletteUrl : linkedinUrl
            const setUrl = isAR ? setAffiliateRouletteUrl : setLinkedinUrl
            const saveFn = isAR ? saveAffiliateRoulette : saveLinkedin
            const saving = isAR ? savingAffiliateRoulette : savingLinkedin
            const placeholder = isAR
              ? 'https://affiliateroulette.com/your-listing'
              : 'https://linkedin.com/in/yourname'
            const isEditingThis = editing === p.key
            const savedUrl = conn?.profile_url

            return (
              <div key={p.key} className={`rounded-xl border ${darkMode ? 'border-gray-600' : 'border-gray-200'} ${rowBg} overflow-hidden`}>
                {/* Main row — always visible */}
                <div className="flex items-center gap-3 p-3">
                  <SocialIcon platform={p.key} size={32} />
                  <p className={`text-sm font-medium flex-1 ${text}`}>{p.label}</p>

                  {savedUrl && !isEditingThis ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">Connected</span>
                      {/* Open URL arrow */}
                      <a
                        href={savedUrl.startsWith('http') ? savedUrl : `https://${savedUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}`}
                        title={`Open ${p.label}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      {/* Edit pencil */}
                      <button
                        onClick={() => setEditing(p.key)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
                        title="Edit URL"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  ) : !isEditingThis ? (
                    <button
                      onClick={() => setEditing(p.key)}
                      className="text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-3 py-1 font-medium shrink-0 transition-colors"
                    >
                      Add URL
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditing(null)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Inline edit form — only when editing */}
                {isEditingThis && (
                  <div className={`px-3 pb-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                    <div className="flex gap-2 mt-3">
                      <input
                        value={urlValue}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={placeholder}
                        autoFocus
                        className={`flex-1 min-w-0 rounded-xl px-3 py-1.5 text-xs outline-none border focus:ring-2 focus:ring-violet-400 transition-colors ${
                          darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
                        }`}
                      />
                      <button
                        onClick={saveFn}
                        disabled={saving}
                        className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold disabled:opacity-50 shrink-0 transition-colors"
                      >
                        {saving ? '…' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
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
              <SocialIcon platform={p.key} size={32} />

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
