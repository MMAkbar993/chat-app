import { useState } from 'react'
import { useChat } from '../../context/ChatContext'

export default function ForwardModal({ darkMode, onClose, onForward }) {
  const { conversations } = useChat()
  const [search, setSearch] = useState('')

  const filtered = conversations.filter((c) => {
    const name = c.type === 'group' ? c.name : (c.other_user_display_name || c.other_user_name || '')
    return name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`w-80 rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Forward to</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className={`w-full text-sm outline-none bg-transparent ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
          />
        </div>

        <div className="max-h-64 overflow-y-auto">
          {filtered.map((c) => {
            const name = c.type === 'group' ? c.name : (c.other_user_display_name || c.other_user_name || 'Unknown')
            const avatar = c.other_user_avatar || c.avatar_url
            return (
              <button
                key={c.id}
                onClick={() => { onForward(c.id); onClose() }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-900'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-violet-500 overflow-hidden flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {avatar
                    ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                    : (name || '?')[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium truncate">{name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
