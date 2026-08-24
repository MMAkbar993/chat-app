import { useEffect, useRef, useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/ChatContext'
import { useSocket } from '../../context/SocketContext'
import { useToast } from '../../context/ToastContext'
import { deleteMessageApi, deleteMessageForMeApi, editMessageApi } from '../../api/conversations'
import { blockUser, unblockUser, getBlockedUsers, reportUser } from '../../api/users'
import { getGroup } from '../../api/groups'
import { addContact } from '../../api/contacts'
import ConfirmDialog from '../ui/ConfirmDialog'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import ContactInfoPanel from './ContactInfoPanel'
import GroupInfoPanel from '../groups/GroupInfoPanel'
import ChatHeaderMenu from './ChatHeaderMenu'
import UserProfileModal from '../ui/UserProfileModal'
import ScheduleMeetingModal from '../calendar/ScheduleMeetingModal'

function formatDuration(secs) {
  if (!secs) return ''
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatLastSeen(ts) {
  if (!ts) return 'Offline'
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'last seen just now'
  if (diffMins < 60) return `last seen ${diffMins}m ago`
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const today = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (date >= today) return `last seen today at ${timeStr}`
  if (date >= yesterday) return `last seen yesterday at ${timeStr}`
  return `last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
}

function CallEventPill({ msg, userId, darkMode, meAvatar, meName }) {
  let callData = {}
  try { callData = JSON.parse(msg.content || '{}') } catch {}
  const isCaller = msg.sender_id === userId
  const isVideo = callData.call_type === 'video'
  const callType = isVideo ? 'Video' : 'Audio'
  const isMissed = callData.status === 'missed'
  const dur = formatDuration(callData.duration)
  const label = isMissed
    ? isCaller ? 'No answer' : `Missed ${callType.toLowerCase()} call`
    : `${callType} call`
  const sub = isMissed ? `${callType} call` : (dur || new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

  const callIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {isVideo
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      }
    </svg>
  )

  return (
    <div className={`flex ${isCaller ? 'justify-end' : 'justify-start'} mb-1 items-end gap-2`}>
      {!isCaller && (
        <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
          {msg.sender_avatar
            ? <img src={msg.sender_avatar} alt="" className="w-full h-full object-cover" />
            : (msg.sender_display_name || msg.sender_name || '?')[0].toUpperCase()}
        </div>
      )}

      <div className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'}`}>
        <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isMissed
            ? darkMode ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-500'
            : darkMode ? 'bg-violet-900/40 text-violet-400' : 'bg-violet-100 text-violet-600'
        }`}>
          {callIcon}
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${isMissed ? 'text-red-500' : darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{label}</p>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{sub}</p>
        </div>
      </div>

      {isCaller && (
        <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden order-last">
          {meAvatar
            ? <img src={meAvatar} alt="" className="w-full h-full object-cover" />
            : (meName || '?')[0].toUpperCase()}
        </div>
      )}
    </div>
  )
}

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
  const { socket } = useSocket()
  const {
    activeConversation, messages, setMessages, loadingMessages,
    sendMessage, typingUsers,
    replyTo, setReplyTo, clearReply,
    toggleConversationFlag, removeConversation, clearConversationMessages,
    onlineUsers, lastSeenMap, closeConversation, loadConversations,
  } = useChat()
  const { showToast } = useToast()
  const bottomRef = useRef(null)
  const searchInputRef = useRef(null)
  const tempMediaRef = useRef(null)
  const scrolledForConvRef = useRef(null)
  const dragCounterRef = useRef(0)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [droppedFile, setDroppedFile] = useState(null)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [groupParticipants, setGroupParticipants] = useState([])
  const [confirm, setConfirm] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchIndex, setSearchIndex] = useState(0)
  const [showReportPrompt, setShowReportPrompt] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [showScheduleMeeting, setShowScheduleMeeting] = useState(false)
  const [editingMessage, setEditingMessage] = useState(null)
  const [contactBannerDismissed, setContactBannerDismissed] = useState(false)
  const [contactAddedFor, setContactAddedFor] = useState(null)
  const [addingContact, setAddingContact] = useState(false)

  const matchIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return messages
      .filter((m) => !m.is_deleted && m.content && m.message_type !== 'call' && m.content.toLowerCase().includes(q))
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
    if (!bottomRef.current || !messages.length) return
    const convId = activeConversation?.id
    const isNewConv = scrolledForConvRef.current !== convId
    if (isNewConv) scrolledForConvRef.current = convId
    bottomRef.current.scrollIntoView({ behavior: isNewConv ? 'instant' : 'smooth' })
  }, [messages, activeConversation?.id])

  // Reset panels and load blocked status / group participants when conversation changes
  useEffect(() => {
    setShowContactInfo(false)
    setShowHeaderMenu(false)
    setIsBlocked(false)
    setGroupParticipants([])
    setContactBannerDismissed(false)
    setEditingMessage(null)
    setDroppedFile(null)
    closeSearch()
    if (!activeConversation?.id) return
    if (activeConversation.type === 'group') {
      getGroup(activeConversation.id)
        .then((data) => setGroupParticipants(data.group.participants || []))
        .catch(() => {})
    } else {
      const otherId = activeConversation.other_user_id
      if (otherId) {
        getBlockedUsers()
          .then(({ blockedIds }) => setIsBlocked(blockedIds.includes(otherId)))
          .catch(() => {})
      }
    }
  }, [activeConversation?.id])

  useEffect(() => {
    if (!socket || activeConversation?.type !== 'group') return
    const onMembersUpdated = ({ conversationId, participants }) => {
      if (conversationId === activeConversation.id) setGroupParticipants(participants)
    }
    socket.on('group-members-updated', onMembersUpdated)
    return () => socket.off('group-members-updated', onMembersUpdated)
  }, [socket, activeConversation?.id, activeConversation?.type])

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

  async function handleAddContact() {
    const otherId = activeConversation?.other_user_id
    if (!otherId) return
    setAddingContact(true)
    try {
      await addContact(otherId)
      setContactAddedFor(activeConversation.id)
      showToast('Added to your contacts', 'success')
      loadConversations()
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not add contact', 'error')
    }
    setAddingContact(false)
  }

  if (!activeConversation) return null

  const isGroup = activeConversation.type === 'group'
  const otherName = isGroup
    ? activeConversation.name
    : activeConversation.other_user_display_name || activeConversation.other_user_name || 'Account Deleted'

  const showAddContactBanner = !isGroup
    && activeConversation.other_user_id
    && activeConversation.is_contact === false
    && contactAddedFor !== activeConversation.id
    && !contactBannerDismissed

  const isTyping = typingUsers[activeConversation.id]

  function handleMediaPreview(localUrl, messageType, caption = null) {
    if (!localUrl) {
      if (tempMediaRef.current) {
        setMessages((prev) => prev.filter((m) => m.id !== tempMediaRef.current))
        tempMediaRef.current = null
      }
      return
    }
    const tempId = `uploading-${Date.now()}`
    tempMediaRef.current = tempId
    setMessages((prev) => [...prev, {
      id: tempId,
      sender_id: user.id,
      sender_display_name: user.display_name || user.full_name,
      message_type: messageType,
      media_url: localUrl,
      content: caption,
      created_at: new Date().toISOString(),
      uploading: true,
    }])
  }

  function handleSend(content, messageType = 'text', replyToMessageId = null, caption = null) {
    sendMessage(activeConversation.id, content, messageType, replyToMessageId, caption)
  }

  async function handleEditMessage(msgId, content) {
    try {
      const { message } = await editMessageApi(msgId, content)
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: message.content, edited_at: message.edited_at } : m))
    } catch {
      showToast('Could not save your edit. Please try again.', 'error')
    }
  }

  function startEditingMessage(msg) {
    clearReply()
    setEditingMessage(msg)
  }

  // dragenter/dragleave fire on every child crossed, not just the container's own boundary —
  // a counter (instead of a plain boolean) is the standard fix so the overlay doesn't flicker
  // as the pointer passes over messages/avatars while dragging.
  function handleDragEnter(e) {
    e.preventDefault()
    if (!e.dataTransfer.types.includes('Files')) return
    dragCounterRef.current++
    setIsDraggingFile(true)
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  function handleDragLeave(e) {
    e.preventDefault()
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
    if (dragCounterRef.current === 0) setIsDraggingFile(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDraggingFile(false)
    const file = e.dataTransfer.files?.[0]
    if (file) setDroppedFile(file)
  }

  async function handleDeleteMessage(msgId) {
    try {
      await deleteMessageApi(msgId)
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, is_deleted: true, content: null } : m))
    } catch {}
  }

  async function handleDeleteMessageForMe(msgId) {
    try {
      await deleteMessageForMeApi(msgId)
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
    } catch {}
  }

  const items = groupByDate(messages)

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Main chat area */}
      <div
        className={`relative flex-1 flex flex-col h-full min-w-0 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDraggingFile && (
          <div className="absolute inset-0 z-100 flex items-center justify-center bg-violet-600/10 border-4 border-dashed border-violet-500 pointer-events-none">
            <div className={`rounded-2xl px-6 py-5 shadow-xl flex flex-col items-center gap-2 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <svg className="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3" />
              </svg>
              <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Drop to send</p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={closeConversation}
              className={`md:hidden w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-9 h-9 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0 hover:ring-2 hover:ring-violet-400 transition-all"
            >
              {activeConversation.other_user_avatar || activeConversation.avatar_url ? (
                <img src={activeConversation.other_user_avatar || activeConversation.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (otherName || '?')[0].toUpperCase()
              )}
            </button>
            <div className="min-w-0">
              <p className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{otherName}</p>
              {isGroup ? (
                <div className="flex items-center gap-2">
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isTyping ? 'typing…' : `${groupParticipants.length} members`}
                  </p>
                  {groupParticipants.length > 0 && (
                    <div className="flex -space-x-1">
                      {groupParticipants.slice(0, 4).map((p) => (
                        <div key={p.id} className="w-4 h-4 rounded-full overflow-hidden border border-white bg-violet-400 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                          {p.avatar_url
                            ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                            : (p.display_name || p.full_name || '?')[0].toUpperCase()}
                        </div>
                      ))}
                      {groupParticipants.length > 4 && (
                        <div className="w-4 h-4 rounded-full bg-violet-600 border border-white flex items-center justify-center text-white text-[7px] font-bold shrink-0">
                          +{groupParticipants.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                isTyping
                  ? <p className="text-xs text-green-500">typing...</p>
                  : onlineUsers?.has(activeConversation.other_user_id)
                    ? <p className="text-xs text-green-500">Online</p>
                    : <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatLastSeen(lastSeenMap[activeConversation.other_user_id])}</p>
              )}
            </div>
          </div>

          {/* Header action buttons */}
          <div className="flex items-center gap-1 relative shrink-0">
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

            {onCallStart && (
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

            {activeConversation.type !== 'group' && (
              /* Schedule meeting */
              <button onClick={() => setShowScheduleMeeting(true)} title="Schedule meeting"
                className={`w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
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
                    message: 'This removes all messages from your device only. The other person keeps their history and won\'t be notified.',
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
                  onReport={() => { setReportReason(''); setShowReportPrompt(true) }}
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

        {/* Add contact prompt — mirrors Telegram's "not in your contacts" banner for DMs with strangers */}
        {showAddContactBanner && (
          <div className={`flex items-center justify-between gap-3 px-4 py-2.5 border-b text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
            <span>{otherName} is not in your contacts.</span>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleAddContact}
                disabled={addingContact}
                className={`text-xs font-semibold disabled:opacity-50 ${darkMode ? 'text-gray-200 hover:text-white' : 'text-amber-900 hover:text-amber-950'}`}
              >
                {addingContact ? 'Adding…' : 'Add Contact'}
              </button>
              <button
                onClick={() => setContactBannerDismissed(true)}
                title="Dismiss"
                className={darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-amber-400 hover:text-amber-600'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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
            ) : item.msg.message_type === 'call' ? (
              <CallEventPill
                key={item.msg.id}
                msg={item.msg}
                userId={user?.id}
                darkMode={darkMode}
                meAvatar={user?.avatar_url}
                meName={user?.display_name || user?.full_name}
              />
            ) : (
              <MessageBubble
                key={item.msg.id}
                msg={item.msg}
                darkMode={darkMode}
                onReply={(msg) => { setEditingMessage(null); setReplyTo(msg) }}
                onEdit={startEditingMessage}
                onDelete={handleDeleteMessage}
                onDeleteForMe={handleDeleteMessageForMe}
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
          onMediaPreview={handleMediaPreview}
          editingMessage={editingMessage}
          onClearEdit={() => setEditingMessage(null)}
          onEditSubmit={handleEditMessage}
          droppedFile={droppedFile}
        />
      </div>

      {/* Contact / Group Info Panel */}
      {showContactInfo && !isGroup && (
        <ContactInfoPanel
          conversation={activeConversation}
          darkMode={darkMode}
          onClose={() => setShowContactInfo(false)}
          onCallStart={onCallStart}
          isBlocked={isBlocked}
          onBlockChange={setIsBlocked}
          onSearch={() => setShowSearch(true)}
          isOnline={onlineUsers?.has(activeConversation.other_user_id)}
        />
      )}
      {showContactInfo && isGroup && (
        <GroupInfoPanel
          conversation={activeConversation}
          darkMode={darkMode}
          onClose={() => setShowContactInfo(false)}
          onCallStart={onCallStart}
          onSearch={() => setShowSearch(true)}
        />
      )}

      {/* Profile popup modal — same component used for viewing your own profile, so the two always match */}
      {showProfileModal && !isGroup && (
        <UserProfileModal
          userId={activeConversation.other_user_id}
          isOnline={onlineUsers?.has(activeConversation.other_user_id)}
          darkMode={darkMode}
          onClose={() => setShowProfileModal(false)}
          onCallStart={(type) => { setShowProfileModal(false); onCallStart?.(type) }}
        />
      )}

      {showScheduleMeeting && (
        <ScheduleMeetingModal
          isOpen={showScheduleMeeting}
          onClose={() => setShowScheduleMeeting(false)}
          onScheduled={(message) => setMessages((prev) => [...prev, message])}
          conversationId={activeConversation.id}
          darkMode={darkMode}
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

      {showReportPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`w-72 rounded-2xl shadow-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Report User</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              className={`w-full rounded-xl px-3 py-2 text-sm outline-none resize-none mb-3 ${
                darkMode ? 'bg-gray-700 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-800 placeholder-gray-400'
              }`}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowReportPrompt(false); setReportReason('') }}
                className={`flex-1 py-2 rounded-xl text-sm ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const otherId = activeConversation?.other_user_id
                  if (otherId) {
                    try {
                      await reportUser(otherId, reportReason)
                      showToast('Report submitted', 'success')
                    } catch {
                      showToast('Failed to submit report', 'error')
                    }
                  }
                  setShowReportPrompt(false)
                  setReportReason('')
                }}
                className="flex-1 py-2 rounded-xl text-sm bg-red-500 text-white hover:bg-red-600"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
