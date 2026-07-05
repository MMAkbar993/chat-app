import { useState } from 'react'

function Toggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 mt-0.5 ${
        on ? 'bg-violet-600' : 'bg-gray-400'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
        on ? 'translate-x-6' : 'translate-x-0'
      }`} />
    </button>
  )
}

const STORAGE_KEY = 'notif_prefs'

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

export default function NotificationsSection({ darkMode }) {
  const [messageNotifs, setMessageNotifs] = useState(() => loadPrefs().messageNotifs ?? true)
  const [sound, setSound]                 = useState(() => loadPrefs().sound ?? true)

  function save(key, val) {
    const prefs = loadPrefs()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, [key]: val }))
  }

  function toggleMessageNotifs() {
    const next = !messageNotifs
    setMessageNotifs(next)
    save('messageNotifs', next)
  }

  function toggleSound() {
    const next = !sound
    setSound(next)
    save('sound', next)
  }

  const text    = darkMode ? 'text-white'    : 'text-gray-900'
  const sub     = darkMode ? 'text-gray-400' : 'text-gray-500'
  const divider = `border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`

  return (
    <div>
      <div className={divider}>
        <div className="flex items-start justify-between gap-3 py-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <svg className={`w-4 h-4 mt-0.5 shrink-0 ${sub}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${text}`}>Message Notifications</p>
              <p className={`text-xs mt-0.5 ${sub}`}>Get notified when a new message arrives.</p>
            </div>
          </div>
          <Toggle on={messageNotifs} onClick={toggleMessageNotifs} />
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 py-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <svg className={`w-4 h-4 mt-0.5 shrink-0 ${sub}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M9 9v6l4 3V6l-4 3zm-2 0H4a1 1 0 00-1 1v4a1 1 0 001 1h3" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${text}`}>Notification Sound</p>
            <p className={`text-xs mt-0.5 ${sub}`}>Play a sound with each new notification.</p>
          </div>
        </div>
        <Toggle on={sound} onClick={toggleSound} />
      </div>
    </div>
  )
}
