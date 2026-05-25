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
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${text}`}>Message Notifications</p>
            <p className={`text-xs mt-0.5 ${sub}`}>Get notified when a new message arrives.</p>
          </div>
          <Toggle on={messageNotifs} onClick={toggleMessageNotifs} />
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 py-3">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${text}`}>Notification Sound</p>
          <p className={`text-xs mt-0.5 ${sub}`}>Play a sound with each new notification.</p>
        </div>
        <Toggle on={sound} onClick={toggleSound} />
      </div>
    </div>
  )
}
