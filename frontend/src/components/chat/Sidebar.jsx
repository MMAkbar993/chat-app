import { useAuth } from '../../context/AuthContext'

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

export default function Sidebar({ active, onNav, darkMode, onDarkMode }) {
  const { user } = useAuth()

  return (
    <aside className={`w-16 flex flex-col items-center py-4 gap-1 border-r ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
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
      <button onClick={() => onNav('profile')} className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200 hover:border-violet-400 transition-colors">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="me" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
            {(user?.full_name || user?.username || '?')[0].toUpperCase()}
          </div>
        )}
      </button>
    </aside>
  )
}
