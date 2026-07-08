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

const RECOMMENDED = [
  { key: 'facebook',  label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'twitter',   label: 'X (Twitter)', connectKey: 'x' },
  { key: 'linkedin',  label: 'LinkedIn',    urlOnly: true },
]

const GAMING = [
  { key: 'youtube', label: 'YouTube' },
  { key: 'kick',    label: 'Kick' },
  { key: 'twitch',  label: 'Twitch' },
]

const OTHER = [
  { key: 'affiliate_roulette', label: 'Affiliate Roulette', urlOnly: true, affiliateRoulette: true },
]

function InfoTile({ darkMode, icon, title, desc }) {
  return (
    <div className="flex-1 min-w-0">
      <span className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${darkMode ? 'bg-gray-700 text-pink-300' : 'bg-pink-50 text-pink-600'}`}>
        {icon}
      </span>
      <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
      <p className={`text-xs mt-0.5 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
    </div>
  )
}

function GroupLabel({ darkMode, children }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{children}</p>
  )
}

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

  const sub  = darkMode ? 'text-gray-400' : 'text-gray-500'
  const text = darkMode ? 'text-white' : 'text-gray-900'
  const rowBg = darkMode ? 'bg-gray-900' : 'bg-white'
  const card = `rounded-2xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`

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
    const connectKey = [...RECOMMENDED, ...GAMING, ...OTHER].find((p) => p.key === key)?.connectKey || key
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

  const connectedCount = connections.length
  const totalCount = RECOMMENDED.length + GAMING.length + (showAffiliateRoulette ? OTHER.length : 0)

  function renderRow(p) {
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
        <div key={p.key} className={`rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-100'} ${rowBg} overflow-hidden`}>
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
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}`}
                  title={`Open ${p.label}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                {/* Edit pencil */}
                <button
                  onClick={() => setEditing(p.key)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
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
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Inline edit form — only when editing */}
          {isEditingThis && (
            <div className={`px-3 pb-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
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
        className={`flex items-center gap-3 rounded-xl p-3 border ${darkMode ? 'border-gray-700' : 'border-gray-100'} ${rowBg}`}
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
  }

  return (
    <div className="space-y-4">

      {/* Hero */}
      <div className={`${card} p-6 flex items-center gap-6 flex-wrap`}>
        <span className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-pink-900/30 text-pink-300' : 'bg-pink-50 text-pink-600'}`}>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </span>
        <div className="flex-1 min-w-[220px]">
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Connect Your Social Accounts</h3>
          <p className={`text-sm mt-1 ${sub}`}>
            {connectedCount > 0
              ? `${connectedCount} of ${totalCount} accounts connected.`
              : "Verify your accounts to earn a trusted badge on your profile."}
          </p>
        </div>
      </div>

      {/* Why connect */}
      <div className={`${card} grid grid-cols-1 sm:grid-cols-3 gap-4 p-5`}>
        <InfoTile
          darkMode={darkMode}
          icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          title="Show You're Real" desc="Verified accounts prove you're who you say you are."
        />
        <InfoTile
          darkMode={darkMode}
          icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>}
          title="Build Trust" desc="Members are more likely to connect with verified professionals."
        />
        <InfoTile
          darkMode={darkMode}
          icon={<svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
          title="Display Verified Links" desc="Your connected accounts appear publicly on your profile."
        />
      </div>

      {/* Platform groups */}
      <div className={`${card} p-5`}>
        <GroupLabel darkMode={darkMode}>Recommended Accounts</GroupLabel>
        <div className="space-y-2 mb-5">
          {RECOMMENDED.map(renderRow)}
        </div>

        <GroupLabel darkMode={darkMode}>Gaming &amp; Streaming</GroupLabel>
        <div className="space-y-2">
          {GAMING.map(renderRow)}
        </div>

        {showAffiliateRoulette && (
          <>
            <GroupLabel darkMode={darkMode}>
              <span className="mt-5 block">Other</span>
            </GroupLabel>
            <div className="space-y-2">
              {OTHER.map(renderRow)}
            </div>
          </>
        )}
      </div>

      <p className={`flex items-center gap-1.5 text-xs ${sub}`}>
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        We use secure sign-in (OAuth) to confirm ownership. We never see your passwords and cannot post on your behalf.
        LinkedIn and Affiliate Roulette don't support secure sign-in, so those are added as a plain link instead.
      </p>

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
    </div>
  )
}
