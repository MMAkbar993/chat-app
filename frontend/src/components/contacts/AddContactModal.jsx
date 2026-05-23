import { useState } from 'react'
import { searchUsers, addContact } from '../../api/contacts'

export default function AddContactModal({ darkMode, onClose, onAdded }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(null)

  async function handleSearch(val) {
    setQ(val)
    if (val.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const data = await searchUsers(val)
      setResults(data.users || [])
    } catch {}
    setLoading(false)
  }

  async function handleAdd(user) {
    setAdding(user.id)
    try {
      await addContact(user.id)
      onAdded?.()
    } catch {}
    setAdding(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`w-full max-w-sm rounded-2xl shadow-xl p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Add Contact</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or username..."
            className={`flex-1 bg-transparent outline-none text-sm ${darkMode ? 'text-white placeholder-gray-500' : 'placeholder-gray-400'}`}
            autoFocus
          />
        </div>
        {loading && <p className="text-center text-gray-400 text-sm py-4">Searching...</p>}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map((u) => (
            <div key={u.id} className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="w-9 h-9 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.full_name || u.username || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{u.display_name || u.full_name}</p>
                <p className="text-xs text-gray-400">@{u.username}</p>
              </div>
              <button
                onClick={() => handleAdd(u)}
                disabled={adding === u.id}
                className="text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {adding === u.id ? '...' : 'Add'}
              </button>
            </div>
          ))}
          {!loading && q.length >= 2 && results.length === 0 && (
            <p className={`text-center text-sm py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No users found</p>
          )}
        </div>
      </div>
    </div>
  )
}
