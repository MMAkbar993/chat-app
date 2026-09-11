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

// `blurb` is what the card shows before anything is connected. Once connected the card shows
// the actual handle instead, which is the more useful thing at that point.
const RECOMMENDED = [
  { key: 'instagram', label: 'Instagram',   blurb: 'Show your Instagram profile on your Pulse profile.' },
  { key: 'twitter',   label: 'X (Twitter)', blurb: 'Connect your X account to your Pulse profile.', connectKey: 'x' },
  { key: 'linkedin',  label: 'LinkedIn',    blurb: 'Show your LinkedIn profile on your Pulse profile.', urlOnly: true },
]

const GAMING = [
  { key: 'youtube', label: 'YouTube', blurb: 'Connect your YouTube channel to your Pulse profile.' },
  { key: 'kick',    label: 'Kick',    blurb: 'Connect your Kick channel to your Pulse profile.' },
  { key: 'twitch',  label: 'Twitch',  blurb: 'Connect your Twitch channel to your Pulse profile.' },
]

const OTHER = [
  { key: 'affiliate_roulette', label: 'Affiliate Roulette', blurb: 'Link your Affiliate Roulette listing to your Pulse profile.', urlOnly: true, affiliateRoulette: true },
]

function GroupLabel({ darkMode, children }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
      {children}
    </p>
  )
}

function StatusPill({ darkMode, state }) {
  if (state === 'none') {
    return (
      <span className={`shrink-0 text-xs font-medium rounded-full px-2.5 py-1 ${
        darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
      }`}>
        Not connected
      </span>
    )
  }
  // OAuth-verified and self-declared links are deliberately worded differently: one proves
  // control of the account, the other is a link the user typed. Showing both as "Verified"
  // would overstate what a plain URL actually establishes.
  const verified = state === 'verified'
  return (
    <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${
      verified
        ? darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'
        : darkMode ? 'bg-violet-900/30 text-violet-300' : 'bg-violet-50 text-violet-700'
    }`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" />
      </svg>
      {verified ? 'Verified' : 'Connected'}
    </span>
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
  const card = `rounded-2xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`
  const tile = `rounded-2xl border p-4 flex flex-col ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`

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
  const pct = totalCount ? Math.round((connectedCount / totalCount) * 100) : 0

  const primaryBtn = 'w-full rounded-xl py-2.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50'
  const quietBtn = `w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100'
  }`
  const manageBtn = `inline-flex items-center gap-1.5 text-xs font-medium mt-2 transition-colors ${
    darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
  }`

  function CardShell({ p, pill, children, footer }) {
    return (
      <div key={p.key} className={tile}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <SocialIcon platform={p.key} size={44} />
          {pill}
        </div>
        <p className={`text-base font-bold ${text}`}>{p.label}</p>
        {children}
        {/* mt-auto keeps every action button on the same baseline no matter how long the
            blurb or handle above it runs — a ragged grid was most of why this looked unfinished. */}
        <div className="mt-auto pt-3">{footer}</div>
      </div>
    )
  }

  function renderCard(p) {
    if (p.affiliateRoulette && !showAffiliateRoulette) return null

    const conn = connections.find((c) => c.platform === p.key)

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

      if (isEditingThis) {
        return (
          <CardShell
            key={p.key}
            p={p}
            pill={<StatusPill darkMode={darkMode} state={savedUrl ? 'linked' : 'none'} />}
            footer={
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button onClick={saveFn} disabled={saving} className={`${primaryBtn} flex-1`}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            }
          >
            <input
              value={urlValue}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className={`w-full mt-2 rounded-xl px-3 py-2 text-xs outline-none border focus:ring-2 focus:ring-violet-400 transition-colors ${
                darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
              }`}
            />
          </CardShell>
        )
      }

      return (
        <CardShell
          key={p.key}
          p={p}
          pill={<StatusPill darkMode={darkMode} state={savedUrl ? 'linked' : 'none'} />}
          footer={
            savedUrl ? (
              <>
                <a
                  href={savedUrl.startsWith('http') ? savedUrl : `https://${savedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${quietBtn} flex items-center justify-center gap-1.5`}
                >
                  View profile
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button onClick={() => setEditing(p.key)} className={manageBtn}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit link
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(p.key)} className={primaryBtn}>Add link</button>
            )
          }
        >
          {savedUrl ? (
            <p className="text-sm text-violet-500 truncate mt-0.5" title={savedUrl}>
              {savedUrl.replace(/^https?:\/\//, '')}
            </p>
          ) : (
            <p className={`text-sm mt-1 leading-relaxed ${sub}`}>{p.blurb}</p>
          )}
          {/* Worth saying once per card rather than in a tooltip: these two can't be proven
              with OAuth, so the pill says "Connected", not "Verified". */}
          {!savedUrl && (
            <p className={`text-xs mt-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Added as a link — not OAuth verified.
            </p>
          )}
        </CardShell>
      )
    }

    const isConnected = !!conn
    return (
      <CardShell
        key={p.key}
        p={p}
        pill={<StatusPill darkMode={darkMode} state={isConnected ? 'verified' : 'none'} />}
        footer={
          isConnected ? (
            <>
              {conn.profile_url ? (
                <a
                  href={conn.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${quietBtn} flex items-center justify-center gap-1.5`}
                >
                  View profile
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : null}
              <button
                onClick={() => setConfirmDisconnect(p.key)}
                disabled={disconnecting === p.key}
                className={`${manageBtn} disabled:opacity-50`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {disconnecting === p.key ? 'Removing…' : 'Manage connection'}
              </button>
            </>
          ) : (
            <button onClick={() => connectPlatform(p.key)} className={primaryBtn}>Connect</button>
          )
        }
      >
        {isConnected && conn.username ? (
          <p className="text-sm text-violet-500 truncate mt-0.5">@{conn.username}</p>
        ) : (
          <p className={`text-sm mt-1 leading-relaxed ${sub}`}>{p.blurb}</p>
        )}
      </CardShell>
    )
  }

  const grid = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'

  return (
    <div className="space-y-4">

      {/* Banner. The trust line lives here rather than in its own callout — it's reassurance,
          not an instruction, and a separate strip for it made the page feel like a form. */}
      <div className={`relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8 ${
        darkMode
          ? 'bg-gradient-to-br from-violet-900/50 via-gray-800 to-pink-900/30 border border-gray-700'
          : 'bg-gradient-to-br from-violet-100 via-violet-50 to-pink-50'
      }`}>
        <div className="relative z-10 max-w-lg">
          <p className={`text-[11px] font-bold uppercase tracking-[0.12em] mb-1.5 ${darkMode ? 'text-violet-300' : 'text-violet-500'}`}>
            Social Profiles
          </p>
          <h3 className={`text-2xl sm:text-3xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Connect Your Social Accounts
          </h3>
          <p className={`text-sm mt-2 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Verify your online presence and display your social profiles on your Pulse profile.
          </p>
          <p className={`inline-flex items-center gap-2 text-xs font-medium mt-4 rounded-full px-3 py-1.5 ${
            darkMode ? 'bg-gray-900/60 text-gray-300' : 'bg-white/70 text-gray-600'
          }`}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pulse never receives your social media passwords.
          </p>
        </div>

        {/* Decorative platform marks. Hidden below lg so they can never crowd the text. */}
        <div aria-hidden="true" className="hidden lg:block absolute inset-y-0 right-6 w-80 pointer-events-none select-none">
          <span className="absolute top-7 right-40 opacity-90 rotate-[-8deg]"><SocialIcon platform="instagram" size={54} /></span>
          <span className="absolute top-4 right-20 opacity-90 rotate-[6deg]"><SocialIcon platform="twitter" size={50} /></span>
          <span className="absolute top-10 right-0 opacity-90 rotate-[-4deg]"><SocialIcon platform="linkedin" size={52} /></span>
          <span className="absolute bottom-6 right-44 opacity-80 rotate-[7deg]"><SocialIcon platform="youtube" size={46} /></span>
          <span className="absolute bottom-4 right-24 opacity-80 rotate-[-6deg]"><SocialIcon platform="twitch" size={44} /></span>
          <span className="absolute bottom-9 right-2 opacity-80 rotate-[5deg]"><SocialIcon platform="kick" size={42} /></span>
        </div>
      </div>

      {/* Connected summary */}
      <div className={`${card} px-5 py-4 flex items-center gap-4 flex-wrap`}>
        <div className="min-w-[160px]">
          <p className={`text-sm font-bold ${text}`}>Connected accounts</p>
          <p className={`text-xs mt-0.5 ${sub}`}>{connectedCount} of {totalCount} connected</p>
        </div>
        <div className={`flex-1 min-w-[120px] h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-sm font-semibold tabular-nums ${text}`}>{pct}%</span>
      </div>

      {/* Platform groups */}
      <div>
        <GroupLabel darkMode={darkMode}>Recommended</GroupLabel>
        <div className={grid}>{RECOMMENDED.map(renderCard)}</div>
      </div>

      <div className="pt-1">
        <GroupLabel darkMode={darkMode}>Gaming &amp; Streaming</GroupLabel>
        <div className={grid}>{GAMING.map(renderCard)}</div>
      </div>

      {showAffiliateRoulette && (
        <div className="pt-1">
          <GroupLabel darkMode={darkMode}>Other</GroupLabel>
          <div className={grid}>{OTHER.map(renderCard)}</div>
        </div>
      )}

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
