import { useState } from 'react'
import { clearAllChats, deleteAllChats } from '../../api/users'
import ConfirmDialog from '../ui/ConfirmDialog'

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

export default function ChatSection({ darkMode }) {
  const [clearPref, setClearPref] = useState(false)
  const [backup, setBackup] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  const text    = darkMode ? 'text-white'    : 'text-gray-900'
  const sub     = darkMode ? 'text-gray-400' : 'text-gray-500'
  const divider = `border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleClearToggle() {
    const next = !clearPref
    setClearPref(next)
    if (next) {
      try {
        await clearAllChats()
        showToast('Chat list cleared from view.')
      } catch {
        setClearPref(false)
        showToast('Could not clear chats.', 'error')
      }
    }
  }

  async function handleDeleteConfirm() {
    setShowDeleteConfirm(false)
    setDeleting(true)
    try {
      await deleteAllChats()
      showToast('All chats have been permanently deleted.')
    } catch {
      showToast('Could not delete chats.', 'error')
    }
    setDeleting(false)
  }

  return (
    <>
      {toast && (
        <div className={`mb-3 px-3 py-2 rounded-xl text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className={divider}>
        <div className="flex items-start justify-between gap-3 py-3">
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${text}`}>Clear All Chat</p>
            <p className={`text-xs mt-0.5 ${sub}`}>
              Saves your preference to clear chat list from view.
            </p>
          </div>
          <Toggle on={clearPref} onClick={handleClearToggle} />
        </div>
      </div>

      <div className={divider}>
        <div className="flex items-start justify-between gap-3 py-3">
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${text}`}>Delete All Chat</p>
            <p className={`text-xs mt-0.5 ${sub}`}>Permanently delete all messages and media.</p>
          </div>
          <Toggle on={false} onClick={() => setShowDeleteConfirm(true)} />
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 py-3">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${text}`}>Chat Backup</p>
          <p className={`text-xs mt-0.5 ${sub}`}>Save a copy of your chats.</p>
        </div>
        <Toggle on={backup} onClick={() => setBackup((b) => !b)} />
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        darkMode={darkMode}
        title="Delete All Chats?"
        message="This will permanently delete all messages, images, videos and documents in all chats. This cannot be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}
