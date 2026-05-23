import { useState, useEffect } from 'react'
import { getContacts } from '../../api/contacts'

export default function NewCallModal({ darkMode, onClose, onCall }) {
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    getContacts().then((d) => setContacts(d.contacts || [])).catch(() => {})
  }, [])

  const filtered = contacts.filter((c) => {
    const name = c.display_name || c.full_name || ''
    return name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>New Call</h3>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className={`bg-transparent flex-1 outline-none text-sm ${darkMode ? 'text-white placeholder-gray-500' : 'placeholder-gray-400'}`}
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1">
            {filtered.length === 0 && (
              <p className={`text-sm text-center py-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                No contacts found
              </p>
            )}
            {filtered.map((contact) => {
              const name = contact.display_name || contact.full_name || 'Unknown'
              return (
                <div
                  key={contact.contact_id || contact.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                    {contact.avatar_url
                      ? <img src={contact.avatar_url} alt="" className="w-full h-full object-cover" />
                      : name[0].toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{name}</p>
                    <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>@{contact.username}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => onCall('audio', contact.contact_id || contact.id, name, contact.avatar_url)}
                      className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors"
                      title="Audio call"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onCall('video', contact.contact_id || contact.id, name, contact.avatar_url)}
                      className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white transition-colors"
                      title="Video call"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
