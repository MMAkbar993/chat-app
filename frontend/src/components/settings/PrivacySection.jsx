import { useEffect, useState } from 'react'
import { getPrivacySettings, updatePrivacySettings } from '../../api/users'

function Toggle({ on, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 mt-0.5 disabled:opacity-50 ${
        on ? 'bg-violet-600' : 'bg-gray-400'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
        on ? 'translate-x-6' : 'translate-x-0'
      }`} />
    </button>
  )
}

const SETTINGS = [
  {
    key: 'hide_from_search',
    title: 'Hide my profile from search results',
    desc: 'People will not find you by username or by business name. You can still be reached by anyone you message first, and through group invite links you choose to open.',
  },
  {
    key: 'restrict_group_add',
    title: 'Only my contacts can add me to groups',
    desc: 'Anyone else who tries to add you to a group will be told to message you first. Group invite links you open yourself still work as normal.',
  },
]

export default function PrivacySection({ darkMode, onToast }) {
  const [privacy, setPrivacy] = useState(null)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    getPrivacySettings().then((d) => setPrivacy(d.privacy)).catch(() => setPrivacy({}))
  }, [])

  async function toggle(key) {
    const next = !privacy[key]
    // Flip first so the switch responds immediately, then put it back if the save fails —
    // a toggle that waits on a round trip feels broken even when it's working.
    setPrivacy((p) => ({ ...p, [key]: next }))
    setSaving(key)
    try {
      const d = await updatePrivacySettings({ [key]: next })
      setPrivacy(d.privacy)
    } catch {
      setPrivacy((p) => ({ ...p, [key]: !next }))
      onToast?.('Could not save that setting. Please try again.', 'error')
    }
    setSaving(null)
  }

  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const rule = darkMode ? 'border-gray-700' : 'border-gray-100'

  if (!privacy) {
    return (
      <div className="flex justify-center py-8">
        <span className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <p className={`text-xs mb-4 ${sub}`}>
        Control how easily other people can find you and pull you into conversations. Nothing
        here affects chats you are already part of.
      </p>

      <div className="space-y-4">
        {SETTINGS.map((s, i) => (
          <div key={s.key} className={`flex items-start justify-between gap-4 ${i > 0 ? `pt-4 border-t ${rule}` : ''}`}>
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.title}</p>
              <p className={`text-xs mt-0.5 leading-relaxed ${sub}`}>{s.desc}</p>
            </div>
            <Toggle on={Boolean(privacy[s.key])} disabled={saving === s.key} onClick={() => toggle(s.key)} />
          </div>
        ))}
      </div>
    </div>
  )
}
