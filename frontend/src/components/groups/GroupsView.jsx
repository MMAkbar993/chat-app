import { useState, useEffect, useCallback } from 'react'
import { useChat } from '../../context/ChatContext'
import CreateGroupModal from './CreateGroupModal'

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString()
}

export default function GroupsView({ darkMode }) {
  const { conversations, openConversation, loadConversations } = useChat()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const groups = conversations.filter((c) => c.type === 'group').filter((g) =>
    (g.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={`w-80 flex flex-col border-r ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Group</h2>
        <button onClick={() => setShowCreate(true)}
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
          <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>All Groups</span>
        </div>
        {groups.map((g) => (
          <button key={g.id} onClick={() => openConversation(g)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
            <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
              {g.avatar_url ? <img src={g.avatar_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm">{(g.name || '?')[0].toUpperCase()}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{g.name}</span>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(g.last_message_at || g.updated_at)}</span>
              </div>
              <span className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{g.last_message || ' '}</span>
            </div>
          </button>
        ))}
        {groups.length === 0 && (
          <p className={`text-sm text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No groups yet</p>
        )}
      </div>

      {showCreate && (
        <CreateGroupModal
          darkMode={darkMode}
          onClose={() => setShowCreate(false)}
          onCreated={() => { loadConversations(); setShowCreate(false) }}
        />
      )}
    </div>
  )
}
