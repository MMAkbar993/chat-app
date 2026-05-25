import { useState, useEffect } from 'react'
import { getBlockedUsers, unblockUser } from '../../api/users'
import ConfirmDialog from '../ui/ConfirmDialog'

export default function BlockedContactsModal({ darkMode, onClose }) {
  const [blocked, setBlocked] = useState([])
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState(null) // user to unblock
  const [unblocking, setUnblocking] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getBlockedUsers()
      .then((data) => setBlocked(data.blockedUsers || data.blocked_users || data.users || []))
      .catch(() => {})
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleUnblock() {
    const user = confirm
    setConfirm(null)
    setUnblocking(user.id)
    try {
      await unblockUser(user.id)
      setBlocked((prev) => prev.filter((u) => u.id !== user.id))
      showToast(`${user.display_name || user.full_name || user.username} has been unblocked.`)
    } catch {
      showToast('Could not unblock user.', 'error')
    }
    setUnblocking(null)
  }

  const filtered = blocked.filter((u) => {
    const name = (u.display_name || u.full_name || u.username || '').toLowerCase()
    return name.includes(search.toLowerCase())
  })

  const cardBg  = darkMode ? 'bg-gray-900 text-white'  : 'bg-white text-gray-900'
  const inputBg = darkMode ? 'bg-gray-800' : 'bg-gray-100'
  const rowBg   = darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
  const sub     = darkMode ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-[420px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl ${cardBg}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className="font-semibold text-base">Blocked Contacts</h2>
          <button onClick={onClose} className={`p-1 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3 flex-1 overflow-hidden">

          {/* Toast */}
          {toast && (
            <div className={`px-3 py-2 rounded-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {toast.msg}
            </div>
          )}

          {/* Search */}
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${inputBg}`}>
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search blocked contacts…"
              className={`flex-1 bg-transparent outline-none text-sm ${darkMode ? 'text-white placeholder-gray-500' : 'placeholder-gray-400'}`}
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {filtered.length === 0 && (
              <p className={`text-sm text-center py-8 ${sub}`}>
                {search ? 'No matches found.' : 'No blocked contacts.'}
              </p>
            )}
            {filtered.map((u) => {
              const name = u.display_name || u.full_name || u.username || 'Unknown'
              return (
                <div key={u.id} className={`flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors ${rowBg}`}>
                  <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                      : name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{name}</p>
                    <p className={`text-xs ${sub}`}>@{u.username}</p>
                  </div>
                  <button
                    onClick={() => setConfirm(u)}
                    disabled={unblocking === u.id}
                    className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                  >
                    {unblocking === u.id ? '…' : 'Unblock'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        darkMode={darkMode}
        title="Unblock User"
        message="Are you sure you want to unblock this user?"
        confirmLabel="Unblock"
        variant="warning"
        onConfirm={handleUnblock}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
