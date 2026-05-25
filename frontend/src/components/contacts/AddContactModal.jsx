import { useState } from 'react'
import { searchUsers, addContact } from '../../api/contacts'

export default function AddContactModal({ darkMode, onClose, onAdded }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(null)
  const [added, setAdded] = useState({})
  const [toast, setToast] = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSearch(val) {
    setQ(val)
    if (val.length < 4) { setResults([]); return }
    setLoading(true)
    try {
      const data = await searchUsers(val)
      setResults(data.users || [])
    } catch {
      showToast('Search failed. Please try again.', 'error')
    }
    setLoading(false)
  }

  async function handleAdd(user) {
    setAdding(user.id)
    try {
      await addContact(user.id)
      setAdded((prev) => ({ ...prev, [user.id]: true }))
      showToast(`${user.display_name || user.full_name} added successfully.`)
      onAdded?.()
    } catch (err) {
      const msg = err?.response?.data?.error || ''
      if (msg.includes('already')) {
        showToast('This contact is already in your list.', 'error')
      } else if (msg.includes('yourself')) {
        showToast('You cannot add yourself as a contact.', 'error')
      } else {
        showToast('Could not add contact. Please try again.', 'error')
      }
    }
    setAdding(null)
  }

  const cardBg = darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
  const inputBg = darkMode ? 'bg-gray-800' : 'bg-gray-100'
  const rowBg   = darkMode ? 'bg-gray-800' : 'bg-gray-50'
  const sub     = darkMode ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`w-full max-w-sm rounded-2xl shadow-xl p-6 ${cardBg}`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Add Contact</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mb-3 px-3 py-2 rounded-xl text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Search input */}
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-1 ${inputBg}`}>
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by Username or Name"
            className={`flex-1 bg-transparent outline-none text-sm ${darkMode ? 'text-white placeholder-gray-500' : 'placeholder-gray-400'}`}
            autoFocus
          />
        </div>

        {/* Hint */}
        <p className={`text-xs mb-3 px-1 ${sub}`}>
          Enter at least 4 characters to find people by name, username, or email.
        </p>

        {/* Results */}
        {loading && <p className="text-center text-gray-400 text-sm py-4">Searching…</p>}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map((u) => (
            <div key={u.id} className={`flex items-center gap-3 p-3 rounded-xl ${rowBg}`}>
              <div className="w-9 h-9 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
                {u.avatar_url
                  ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  : (u.full_name || u.username || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{u.display_name || u.full_name}</p>
                <p className="text-xs text-gray-400">@{u.username}</p>
              </div>
              {added[u.id] ? (
                <span className="text-xs text-green-500 font-medium">Added</span>
              ) : (
                <button
                  onClick={() => handleAdd(u)}
                  disabled={adding === u.id}
                  className="text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  {adding === u.id ? '…' : 'Add'}
                </button>
              )}
            </div>
          ))}
          {!loading && q.length >= 4 && results.length === 0 && (
            <p className={`text-center text-sm py-4 ${sub}`}>No users found</p>
          )}
        </div>
      </div>
    </div>
  )
}
