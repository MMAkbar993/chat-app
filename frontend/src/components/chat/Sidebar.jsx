import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { getNotifications, markNotificationsRead, clearNotifications } from '../../api/users'
import UserProfileModal from '../ui/UserProfileModal'

const NAV = [
  { key: 'chats', label: 'Chats', icon: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M12 9c-.6-1.2-2.2-1.2-2.8 0-.3.7-.1 1.5.6 2.1L12 13l2.2-1.9c.7-.6.9-1.4.6-2.1-.6-1.2-2.2-1.2-2.8 0z" />
    </>
  )},
  { key: 'contacts', label: 'Contacts', icon: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" strokeWidth={1.75} fill="none" stroke="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M16 3.5l1.5 1.5L20 2.5" />
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
    <>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M15.05 5A5 5 0 0119 8.95M15.05 1A9 9 0 0123 8.94" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.22 1.2 2 2 0 012.22 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.85 7.91A16 16 0 0016.15 17.2l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 18z" />
    </>
  )},
  { key: 'profile', label: 'Profile', icon: (
    <>
      <circle cx="12" cy="12" r="10" strokeWidth={1.75} fill="none" stroke="currentColor" />
      <circle cx="12" cy="10" r="3" strokeWidth={1.75} fill="none" stroke="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M7 20.662V19a2 2 0 012-2h6a2 2 0 012 2v1.662" />
    </>
  )},
  { key: 'settings', label: 'Settings', icon: (
    <>
      <circle cx="12" cy="12" r="3" strokeWidth={1.75} fill="none" stroke="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </>
  )},
]

function formatNotif(n) {
  if (n.type === 'rep_request') {
    return `${n.data.requesterName} requested to represent ${n.data.websiteUrl}`
  }
  if (n.type === 'rep_decision') {
    const verb = n.data.action === 'approve' ? 'approved' : 'rejected'
    return `${n.data.ownerName} ${verb} your request for ${n.data.websiteUrl}`
  }
  return 'New notification'
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

export default function Sidebar({ active, onNav, darkMode, onDarkMode }) {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [notifications, setNotifications] = useState([])
  const [showPanel, setShowPanel] = useState(false)
  const [showOwnProfile, setShowOwnProfile] = useState(false)
  const [clearing, setClearing] = useState(false)
  const unread = notifications.filter((n) => !n.read).length

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
    <aside className={`w-20 flex flex-col items-center py-5 gap-1 border-r relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      {/* Logo */}
      <div className="mb-5">
        <img src="/Icon.png" alt="logo" className="w-9 h-9" />
      </div>

      {NAV.map(({ key, label, icon }) => (
        <button
          key={key}
          title={label}
          onClick={() => onNav(key)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
            active === key
              ? 'bg-violet-600 text-white'
              : darkMode
              ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icon}
          </svg>
        </button>
      ))}

      <div className="flex-1" />

      {/* Notification bell */}
      <button
        title="Notifications"
        onClick={handleOpenPanel}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors mb-1 relative ${
          darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dark mode */}
      <button
        onClick={onDarkMode}
        title="Toggle dark mode"
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors mb-2 ${
          darkMode ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-100'
        }`}
      >
        {darkMode ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 18.364l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Avatar */}
      <button onClick={() => setShowOwnProfile(true)} className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200 hover:border-violet-400 transition-colors">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="me" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
            {(user?.full_name || user?.username || '?')[0].toUpperCase()}
          </div>
        )}
      </button>
    </aside>

    {showOwnProfile && (
      <UserProfileModal
        isSelf
        darkMode={darkMode}
        onClose={() => setShowOwnProfile(false)}
        onNav={(key) => { onNav(key); setShowOwnProfile(false) }}
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
                  } ${!n.read ? (darkMode ? 'bg-violet-900/20' : 'bg-violet-50') : ''}`}
                >
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-violet-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {formatNotif(n)}
                    </p>
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
