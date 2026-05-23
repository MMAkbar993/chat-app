import { useState, useEffect, useCallback } from 'react'
import { getContacts } from '../../api/contacts'
import { getOrCreateDirect } from '../../api/conversations'
import { useChat } from '../../context/ChatContext'
import AddContactModal from './AddContactModal'

export default function ContactsView({ darkMode, onNavigate }) {
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const { openConversation } = useChat()

  const load = useCallback(async () => {
    try {
      const data = await getContacts()
      setContacts(data.contacts || [])
    } catch {}
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = contacts.filter((c) =>
    (c.display_name || c.full_name || c.username || '').toLowerCase().includes(search.toLowerCase())
  )

  // Group alphabetically
  const grouped = {}
  filtered.forEach((c) => {
    const key = (c.display_name || c.full_name || c.username || '#')[0].toUpperCase()
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(c)
  })

  async function handleChat(contact) {
    try {
      const data = await getOrCreateDirect(contact.id)
      openConversation(data.conversation)
      onNavigate('chats')
    } catch {}
  }

  return (
    <div className={`w-80 flex flex-col border-r ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contacts</h2>
        <button onClick={() => setShowAdd(true)}
          className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white hover:bg-violet-700 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <div className="px-4 pb-3">
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className={`bg-transparent flex-1 outline-none text-sm ${darkMode ? 'text-white placeholder-gray-500' : 'placeholder-gray-400'}`}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 mb-2">
          <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>All Contacts</span>
        </div>
        {Object.keys(grouped).sort().map((letter) => (
          <div key={letter}>
            <div className={`px-4 py-1 text-xs font-bold ${darkMode ? 'text-gray-400 bg-gray-800' : 'text-gray-500 bg-gray-50'}`}>{letter}</div>
            {grouped[letter].map((c) => (
              <button key={c.id} onClick={() => handleChat(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
                  {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">{(c.display_name || c.full_name || '?')[0].toUpperCase()}</div>}
                </div>
                <div className="min-w-0">
                  <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{c.display_name || c.full_name}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{c.primary_role || c.username}</p>
                </div>
              </button>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className={`text-sm text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No contacts yet</p>
        )}
      </div>

      {showAdd && <AddContactModal darkMode={darkMode} onClose={() => setShowAdd(false)} onAdded={() => { load(); setShowAdd(false) }} />}
    </div>
  )
}
