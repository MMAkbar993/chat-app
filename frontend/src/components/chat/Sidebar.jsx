import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { getNotifications, markNotificationsRead, clearNotifications } from '../../api/users'
import UserProfileModal from '../ui/UserProfileModal'

const NAV = [
  { key: 'chats', label: 'Chats', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  )},
  { key: 'contacts', label: 'Contacts', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  )},
  { key: 'groups', label: 'Groups', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  )},
  { key: 'calls', label: 'Calls', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  )},
  { key: 'profile', label: 'Profile', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  )},
  { key: 'settings', label: 'Settings', icon: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
    <aside className={`w-16 flex flex-col items-center py-4 gap-1 border-r relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      {/* Logo */}
      <div className="mb-4">
        <img src="/Icon.png" alt="logo" className="w-8 h-8" />
      </div>

      {NAV.map(({ key, label, icon }) => (
        <button
          key={key}
          title={label}
          onClick={() => onNav(key)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            active === key
              ? 'bg-violet-600 text-white'
              : darkMode
              ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
