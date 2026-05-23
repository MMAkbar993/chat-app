import { useEffect, useRef, useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/ChatContext'
import { useToast } from '../../context/ToastContext'
import { deleteMessageApi } from '../../api/conversations'
import { blockUser, unblockUser, getBlockedUsers } from '../../api/users'
import ConfirmDialog from '../ui/ConfirmDialog'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import ContactInfoPanel from './ContactInfoPanel'
import ChatHeaderMenu from './ChatHeaderMenu'

function formatDate(ts) {
  const d = new Date(ts)
  const today = new Date()
  const diff = Math.floor((today - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString()
}

function groupByDate(messages) {
  const groups = []
  let lastDate = null
  for (const msg of messages) {
    const date = new Date(msg.created_at).toDateString()
    if (date !== lastDate) {
      groups.push({ type: 'date', label: formatDate(msg.created_at) })
      lastDate = date
    }
    groups.push({ type: 'msg', msg })
  }
  return groups
}

export default function ChatWindow({ darkMode, onCallStart }) {
  const { user } = useAuth()
  const {
    activeConversation, messages, setMessages, loadingMessages,
    sendMessage, typingUsers,
    replyTo, setReplyTo, clearReply,
    toggleConversationFlag, removeConversation, clearConversationMessages,
  } = useChat()
  const { showToast } = useToast()
  const bottomRef = useRef(null)
  const searchInputRef = useRef(null)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchIndex, setSearchIndex] = useState(0)

  const matchIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return messages
      .filter((m) => !m.is_deleted && m.content && m.content.toLowerCase().includes(q))
      .map((m) => m.id)
  }, [messages, searchQuery])

  useEffect(() => { setSearchIndex(0) }, [searchQuery])

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus()
  }, [showSearch])

  useEffect(() => {
    const id = matchIds[searchIndex]
    if (!id) return
    document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [matchIds, searchIndex])

  function goNext() { if (matchIds.length) setSearchIndex((i) => (i + 1) % matchIds.length) }
  function goPrev() { if (matchIds.length) setSearchIndex((i) => (i - 1 + matchIds.length) % matchIds.length) }

  function closeSearch() { setShowSearch(false); setSearchQuery(''); setSearchIndex(0) }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset panels and load blocked status when conversation changes
  useEffect(() => {
    setShowContactInfo(false)
    setShowHeaderMenu(false)
    setIsBlocked(false)
    closeSearch()
    const otherId = activeConversation?.other_user_id
    if (!otherId) return
    getBlockedUsers()
      .then(({ blockedIds }) => setIsBlocked(blockedIds.includes(otherId)))
      .catch(() => {})
  }, [activeConversation?.id])

  async function handleHeaderBlock() {
    const otherId = activeConversation?.other_user_id
    if (!otherId) return
    try {
      if (isBlocked) {
        await unblockUser(otherId)
        setIsBlocked(false)
        showToast('User unblocked', 'success')
      } else {
        await blockUser(otherId)
        setIsBlocked(true)
        showToast('User blocked', 'warning')
      }
    } catch {}
  }

  if (!activeConversation) return null

  const isGroup = activeConversation.type === 'group'
  const otherName = isGroup
    ? activeConversation.name
    : activeConversation.other_user_display_name || activeConversation.other_user_name || 'Unknown'

  const isTyping = typingUsers[activeConversation.id]

  function handleSend(content, messageType = 'text', replyToMessageId = null) {
    sendMessage(activeConversation.id, content, messageType, replyToMessageId)
  }

  async function handleDeleteMessage(msgId) {
    try {
      await deleteMessageApi(msgId)
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, is_deleted: true, content: null } : m))
    } catch {}
  }

  const items = groupByDate(messages)

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Main chat area */}
      <div className={`flex-1 flex flex-col h-full min-w-0 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
              {activeConversation.other_user_avatar || activeConversation.avatar_url ? (
                <img src={activeConversation.other_user_avatar || activeConversation.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (otherName || '?')[0].toUpperCase()
              )}
            </div>
            <div>
              <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{otherName}</p>
              {isTyping
                ? <p className="text-xs text-green-500">typing...</p>
                : <p className="text-xs text-green-500">Online</p>}
            </div>
          </div>

          {/* Header action buttons */}
          <div className="flex items-center gap-1 relative">
            {/* Search */}
            <button
              onClick={() => setShowSearch((v) => !v)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                showSearch
                  ? 'bg-violet-100 text-violet-600'
                  : `hover:bg-gray-100 dark:hover:bg-gray-700 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {!isGroup && onCallStart && (
              <>
                {/* Video call */}
                <button onClick={() => onCallStart('video')}
                  className={`w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>

                {/* Audio call */}
                <button onClick={() => onCallStart('audio')}
                  className={`w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </>
            )}

            {/* Contact info */}
            <button
              onClick={() => setShowContactInfo((v) => !v)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                showContactInfo
                  ? 'bg-violet-100 text-violet-600'
                  : `hover:bg-gray-100 dark:hover:bg-gray-700 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Three-dot menu */}
            <div className="relative">
              <button
                onClick={() => setShowHeaderMenu((v) => !v)}
                className={`w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {showHeaderMenu && (
                <ChatHeaderMenu
                  darkMode={darkMode}
                  conversationId={activeConversation.id}
                  isBlocked={isBlocked}
                  onClose={() => setShowHeaderMenu(false)}
                  onMute={() => {
                    toggleConversationFlag(activeConversation.id, 'is_muted')
                    showToast('Notifications muted', 'success')
                  }}
                  onClear={() => setConfirm({
                    title: 'Clear Messages',
                    message: 'All messages in this chat will be permanently deleted.',
                    confirmLabel: 'Clear',
                    onConfirm: () => {
                      clearConversationMessages(activeConversation.id)
                      showToast('Messages cleared', 'info')
                    },
                  })}
                  onDelete={() => setConfirm({
                    title: 'Delete Chat',
                    message: 'This will permanently delete this chat and all its messages.',
                    confirmLabel: 'Delete',
                    onConfirm: () => {
                      removeConversation(activeConversation.id)
                      showToast('Chat deleted', 'info')
                    },
                  })}
                  onBlock={() => setConfirm({
                    title: isBlocked ? 'Unblock User' : 'Block User',
                    message: isBlocked
                      ? 'You will be able to receive messages from this user again.'
                      : 'This user will no longer be able to send you messages.',
                    confirmLabel: isBlocked ? 'Unblock' : 'Block',
                    variant: isBlocked ? 'warning' : 'danger',
                    onConfirm: handleHeaderBlock,
                  })}
                />
              )}
            </div>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className={`flex items-center gap-2 px-4 py-2 border-b ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') goNext()
                if (e.key === 'Escape') closeSearch()
              }}
              placeholder="Search in chat..."
              className={`flex-1 bg-transparent outline-none text-sm ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
            />
            {searchQuery.trim() && (
              <span className={`text-xs shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {matchIds.length > 0 ? `${searchIndex + 1} of ${matchIds.length}` : 'No results'}
              </span>
            )}
            {matchIds.length > 1 && (
              <>
                <button onClick={goPrev} className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button onClick={goNext} className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </>
            )}
            <button onClick={closeSearch} className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {loadingMessages && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {items.map((item, i) =>
            item.type === 'date' ? (
              <div key={`date-${i}`} className="flex justify-center my-3">
                <span className={`text-xs px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                  {item.label}
                </span>
              </div>
            ) : (
              <MessageBubble
                key={item.msg.id}
                msg={item.msg}
                darkMode={darkMode}
                onReply={(msg) => setReplyTo(msg)}
                onDelete={handleDeleteMessage}
                searchQuery={searchQuery}
                isCurrentMatch={item.msg.id === matchIds[searchIndex]}
              />
            )
          )}
          <div ref={bottomRef} />
        </div>

        <MessageInput
          conversationId={activeConversation.id}
          onSend={handleSend}
          darkMode={darkMode}
          replyTo={replyTo}
          onClearReply={clearReply}
        />
      </div>

      {/* Contact Info Panel */}
      {showContactInfo && !isGroup && (
        <ContactInfoPanel
          conversation={activeConversation}
          darkMode={darkMode}
          onClose={() => setShowContactInfo(false)}
          onCallStart={onCallStart}
          isBlocked={isBlocked}
          onBlockChange={setIsBlocked}
          onSearch={() => setShowSearch(true)}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant}
        onConfirm={() => { confirm?.onConfirm(); setConfirm(null) }}
        onCancel={() => setConfirm(null)}
        darkMode={darkMode}
      />
    </div>
  )
}
