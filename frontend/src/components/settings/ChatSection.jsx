import { useState } from 'react'
import { clearAllChats } from '../../api/users'
import { useChat } from '../../context/ChatContext'
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
  const { loadConversations, closeConversation, setMessages } = useChat()
  const [backup, setBackup] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [toast, setToast] = useState(null)

  const text    = darkMode ? 'text-white'    : 'text-gray-900'
  const sub     = darkMode ? 'text-gray-400' : 'text-gray-500'
  const divider = `border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleClearConfirm() {
    setShowClearConfirm(false)
    setClearing(true)
    try {
      await clearAllChats()
      closeConversation()
      setMessages([])
      await loadConversations()
      showToast('All chat history cleared on this device.')
    } catch {
      showToast('Could not clear chats.', 'error')
    }
    setClearing(false)
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
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <svg className={`w-4 h-4 mt-0.5 shrink-0 ${sub}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${text}`}>Clear All Chats</p>
              <p className={`text-xs mt-0.5 ${sub}`}>Remove all messages from your device only. Others keep their history.</p>
            </div>
          </div>
          <Toggle on={false} onClick={() => setShowClearConfirm(true)} />
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 py-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <svg className={`w-4 h-4 mt-0.5 shrink-0 ${sub}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${text}`}>Chat Backup</p>
            <p className={`text-xs mt-0.5 ${sub}`}>Save a copy of your chats.</p>
          </div>
        </div>
        <Toggle on={backup} onClick={() => setBackup((b) => !b)} />
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        darkMode={darkMode}
        title="Clear All Chats?"
        message="This removes all messages from your device only. Other participants keep the conversation intact and won't be notified."
        confirmLabel={clearing ? 'Clearing…' : 'Clear'}
        variant="warning"
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  )
}
