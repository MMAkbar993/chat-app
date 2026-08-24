import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { useChat } from '../../context/ChatContext'
import { getNotifications, markNotificationsRead, clearNotifications } from '../../api/users'
import UserProfileModal from '../ui/UserProfileModal'
import UpgradeModal from '../../features/payment/UpgradeModal'
import { isProUser } from '../../utils/plan'

const NAV = [
  { key: 'chats', label: 'Chats', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  )},
  { key: 'contacts', label: 'Contacts', icon: (
    <>
      <circle cx="12" cy="8" r="4" strokeWidth={1.75} fill="none" stroke="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M20 21a8 8 0 00-16 0" />
    </>
  )},
  { key: 'groups', label: 'Groups', icon: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" strokeWidth={1.75} fill="none" stroke="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </>
  )},
  { key: 'calls', label: 'Calls', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  )},
  { key: 'settings', label: 'Settings', icon: (
    <>
      <circle cx="12" cy="12" r="3" strokeWidth={1.75} fill="none" stroke="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </>
  )},
]

function websiteLink(url) {
  const href = url.startsWith('http') ? url : `https://${url}`
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
      className="text-violet-600 hover:underline break-all">
      {url}
    </a>
  )
}

function formatNotif(n) {
  if (n.type === 'rep_request') {
    return <>{n.data.requesterName} requested to represent {websiteLink(n.data.websiteUrl)}</>
  }
  if (n.type === 'rep_decision') {
    const verb = n.data.action === 'approve' ? 'approved' : 'rejected'
    return <>{n.data.ownerName} {verb} your request for {websiteLink(n.data.websiteUrl)}</>
  }
  return 'New notification'
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g

// Splits text on URLs and turns each one into a real link — broadcast bodies are admin-authored
// free text that may contain a URL (e.g. "check it out https://..."), and rendering that as plain
// text left it looking like unstyled, half-broken content sitting inside a notification feed.
function linkify(text) {
  return text.split(URL_REGEX).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-violet-600 hover:underline break-all">
        {part}
      </a>
    ) : part
  )
}

function BroadcastIcon() {
  return (
    <div className="mt-0.5 w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    </div>
  )
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function Sidebar({ active, onNav, onEditProfile, darkMode, onDarkMode, mobileHidden }) {
  const { user } = useAuth()
  const { socket } = useSocket()
  const { conversations } = useChat()
  const [notifications, setNotifications] = useState([])
  const [showPanel, setShowPanel] = useState(false)
  const [showOwnProfile, setShowOwnProfile] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [clearing, setClearing] = useState(false)
  const unread = notifications.filter((n) => !n.read).length
  const activeConversations = conversations.filter((c) => !c.is_deleted)
  // unread_count comes from a Postgres COUNT(), which node-postgres returns as a string — summing
  // with `+` unconverted silently does string concatenation ("0" + "1" + "0" = "010") instead of
  // addition, so every conversation's count must be coerced to a real number first.
  const chatsUnreadCount = activeConversations.reduce((sum, c) => sum + Number(c.unread_count || 0), 0)
  const groupsUnreadCount = activeConversations
    .filter((c) => c.type === 'group')
    .reduce((sum, c) => sum + Number(c.unread_count || 0), 0)
  const NAV_BADGES = { chats: chatsUnreadCount, groups: groupsUnreadCount }

  useEffect(() => {
    getNotifications()
      .then((d) => setNotifications(d.notifications || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!socket) return
    const onNotif = (notif) => {
      setNotifications((prev) => [{ ...notif, read: false, created_at: new Date().toISOString() }, ...prev])
    }
    socket.on('notification', onNotif)
    return () => socket.off('notification', onNotif)
  }, [socket])


  function handleOpenPanel() {
    setShowPanel((v) => !v)
    if (!showPanel && unread > 0) {
      markNotificationsRead().catch(() => {})
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  async function handleClear() {
    setClearing(true)
    try {
      await clearNotifications()
      setNotifications([])
    } catch {}
    setClearing(false)
  }

  return (
    <>
    <aside className={`hidden md:flex w-64 shrink-0 flex-col py-5 border-r relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      {/* Logo — the full wordmark only fits once the sidebar expands at md:, so mobile falls
          back to just the icon glyph */}
      <div className="flex items-center justify-center md:justify-start px-2 md:px-5 mb-6 shrink-0">
        <img src="/Icon.png" alt="Pulse" className="w-8 h-8 shrink-0 md:hidden" />
        <img src="/full-logo.png" alt="Pulse" className="hidden md:block h-9 w-auto" />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 md:px-3 space-y-1 min-h-0">
        {NAV.map(({ key, label, icon }) => {
          const badge = NAV_BADGES[key]
          return (
            <button
              key={key}
              title={label}
              data-tour={`sidebar-${key}`}
              onClick={() => onNav(key)}
              className={`relative w-full flex items-center justify-center md:justify-start gap-3 px-0 md:px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active === key
                  ? 'bg-violet-600 text-white'
                  : darkMode
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {icon}
              </svg>
              <span className="hidden md:inline flex-1 text-left truncate">{label}</span>
              {badge > 0 && (
                <>
                  <span className={`hidden md:flex shrink-0 text-xs font-bold rounded-full min-w-5 h-5 px-1.5 items-center justify-center ${
                    active === key ? 'bg-white/25 text-white' : 'bg-violet-600 text-white'
                  }`}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                  <span className={`md:hidden absolute top-1.5 right-2.5 w-2.5 h-2.5 rounded-full bg-red-500 ${active === key ? '' : darkMode ? 'ring-2 ring-gray-900' : 'ring-2 ring-white'}`} />
                </>
              )}
            </button>
          )
        })}
      </nav>

      <div className={`px-2 md:px-3 pt-3 mt-1 space-y-3 border-t shrink-0 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        {/* Upgrade — hidden once the account is already Pro, nothing left to upgrade to */}
        {!isProUser(user) && (
          <button
            title="Upgrade to Premium"
            data-tour="sidebar-upgrade"
            onClick={() => setShowUpgrade(true)}
            className="w-full flex items-center justify-center md:justify-start gap-3 px-0 md:px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm hover:shadow-md hover:brightness-105 transition-all"
          >
            <svg className="w-4.5 h-4.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" />
            </svg>
            <span className="hidden md:inline flex-1 text-left">Upgrade to Pro</span>
          </button>
        )}

        {/* Notifications */}
        <button
          title="Notifications"
          onClick={handleOpenPanel}
          className={`relative w-full flex items-center justify-center md:justify-start gap-3 px-0 md:px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="hidden md:inline flex-1 text-left">Notifications</span>
          {unread > 0 && (
            <>
              <span className="hidden md:flex shrink-0 text-xs font-bold rounded-full min-w-5 h-5 px-1.5 items-center justify-center bg-red-500 text-white">
                {unread > 9 ? '9+' : unread}
              </span>
              <span className={`md:hidden absolute top-1.5 right-2.5 w-2.5 h-2.5 rounded-full bg-red-500 ${darkMode ? 'ring-2 ring-gray-900' : 'ring-2 ring-white'}`} />
            </>
          )}
        </button>

        {/* Dark mode */}
        <button
          title="Toggle dark mode"
          onClick={onDarkMode}
          className={`w-full flex items-center justify-center md:justify-start gap-3 px-0 md:px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {darkMode ? (
            <svg className="w-4.5 h-4.5 shrink-0 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 18.364l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          <span className="hidden md:inline flex-1 text-left">Dark Mode</span>
          <span className={`hidden md:block shrink-0 relative w-9 h-5 rounded-full transition-colors duration-200 ${darkMode ? 'bg-violet-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
          </span>
        </button>
      </div>

      {/* Own profile — name + plan */}
      <button
        onClick={() => setShowOwnProfile(true)}
        data-tour="sidebar-avatar"
        className={`mx-2 md:mx-3 mt-3 shrink-0 flex items-center justify-center md:justify-start gap-3 px-0 md:px-2.5 py-2.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
      >
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 border-gray-200">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="me" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
              {(user?.full_name || user?.username || '?')[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="hidden md:block flex-1 min-w-0 text-left">
          <p title={user?.display_name || user?.full_name || user?.username || 'Me'} className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {user?.display_name || user?.full_name || user?.username || 'Me'}
          </p>
          <p className="text-xs text-violet-500 font-medium">{isProUser(user) ? 'Pro Plan' : 'Free Plan'}</p>
        </div>
      </button>
    </aside>

    {/* Mobile bottom tab bar — replaces the desktop rail below md:, Telegram/WhatsApp style.
        Hidden once a deeper view (an open chat, a settings detail) takes over the screen, same
        as the desktop rail was via mobileHidden — the compose bar takes its place there instead. */}
    {!mobileHidden && (
      <nav
        className={`md:hidden fixed bottom-0 inset-x-0 z-30 flex border-t ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV.map(({ key, label, icon }) => {
          const badge = NAV_BADGES[key]
          return (
            <button
              key={key}
              data-tour={`sidebar-${key}`}
              onClick={() => onNav(key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                active === key
                  ? 'text-violet-600'
                  : darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
                {badge > 0 && (
                  <span className={`absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ${darkMode ? 'ring-2 ring-gray-900' : 'ring-2 ring-white'}`} />
                )}
              </div>
              {label}
            </button>
          )
        })}
      </nav>
    )}

    <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />

    {showOwnProfile && (
      <UserProfileModal
        isSelf
        darkMode={darkMode}
        onClose={() => setShowOwnProfile(false)}
        onEditProfile={onEditProfile}
      />
    )}

    {/* Notifications modal */}
    {showPanel && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onMouseDown={(e) => { if (e.target === e.currentTarget) setShowPanel(false) }}
      >
        <div className={`w-96 max-h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ${
          darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className="font-bold text-base">Notifications</h2>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                    darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  {clearing ? 'Clearing…' : 'Clear feed'}
                </button>
              )}
              <button
                onClick={() => setShowPanel(false)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Feed */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <svg className={`w-10 h-10 ${darkMode ? 'text-gray-700' : 'text-gray-200'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-5 py-4 border-b last:border-0 flex gap-3 items-start ${
                    darkMode ? 'border-gray-800' : 'border-gray-50'
                  } ${
                    n.type === 'broadcast'
                      ? (darkMode ? 'bg-violet-900/10' : 'bg-violet-50/60')
                      : !n.read ? (darkMode ? 'bg-violet-900/20' : 'bg-violet-50') : ''
                  }`}
                >
                  {n.type === 'broadcast' ? (
                    <BroadcastIcon />
                  ) : (
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-violet-500' : 'bg-transparent'}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    {n.type === 'broadcast' ? (
                      <>
                        <p className={`text-xs font-semibold uppercase tracking-wide text-violet-500 mb-0.5`}>Announcement</p>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{n.data.title}</p>
                        <p className={`text-sm leading-relaxed mt-0.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {linkify(n.data.body)}
                        </p>
                      </>
                    ) : (
                      <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {formatNotif(n)}
                      </p>
                    )}
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}
