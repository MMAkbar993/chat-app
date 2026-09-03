import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSocket } from './SocketContext'
import { useAuth } from './AuthContext'
import { playReceivedSound } from '../utils/sounds'
import { enrichMessagesWithReplyMeta, enrichMessageReplyMeta } from '../utils/replyPreview'
import {
  getConversations, getMessages, sendMessageApi, markReadApi, markUnreadApi,
  archiveConversation, pinConversation, favoriteConversation, muteConversation,
  deleteConversationApi, clearMessagesApi,
} from '../api/conversations'

const ChatContext = createContext(null)

// Must match the backend's default page size in getMessages() — a returned page smaller
// than this is how we know we've reached the start of the conversation.
const MESSAGE_PAGE_SIZE = 50

export function ChatProvider({ children }) {
  const { socket } = useSocket()
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [typingUsers, setTypingUsers] = useState({})
  const [replyTo, setReplyToState] = useState(null)
  const [conversationFilter, setConversationFilter] = useState('all')
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [lastSeenMap, setLastSeenMap] = useState({})
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const activeConvRef = useRef(null)
  const conversationsRef = useRef([])
  const messagesRef = useRef([])
  // Guards against re-entrancy while a page is in flight, and against firing once the
  // server has told us there's nothing older left.
  const loadingOlderRef = useRef(false)
  const hasMoreRef = useRef(false)
  // conversationId -> unsent composer text. Lives here (not in MessageInput's own state) so a
  // draft survives MessageInput unmounting — which happens on every navigation away from the
  // Chats/Groups section, since ChatWindow only renders while one of those is active.
  const messageDrafts = useRef(new Map())

  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  useEffect(() => {
    activeConvRef.current = activeConversation
  }, [activeConversation])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const filteredConversations = useMemo(() => {
    let list
    if (conversationFilter === 'all')       list = conversations.filter((c) => !c.is_archived && !c.is_deleted)
    else if (conversationFilter === 'favourite') list = conversations.filter((c) => c.is_favorite && !c.is_archived && !c.is_deleted)
    else if (conversationFilter === 'pinned')    list = conversations.filter((c) => c.is_pinned && !c.is_archived && !c.is_deleted)
    else if (conversationFilter === 'archive')   list = conversations.filter((c) => c.is_archived && !c.is_deleted)
    else if (conversationFilter === 'trash')     list = conversations.filter((c) => c.is_deleted)
    else list = conversations.filter((c) => !c.is_deleted)
    return [...list].sort((a, b) => {
      if (conversationFilter === 'trash') return 0
      if (a.is_pinned === b.is_pinned) return 0
      return a.is_pinned ? -1 : 1
    })
  }, [conversations, conversationFilter])

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations()
      const convs = data.conversations || []
      setConversations(convs)
      setLastSeenMap((prev) => {
        const next = { ...prev }
        convs.forEach((c) => {
          if (c.other_user_id && c.other_user_last_seen_at) {
            next[c.other_user_id] = c.other_user_last_seen_at
          }
        })
        return next
      })
    } catch {}
  }, [])

  useEffect(() => {
    loadConversations()
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [loadConversations])

  const openConversation = useCallback(async (conv) => {
    if (activeConvRef.current?.id === conv.id) return
    setActiveConversation(conv)
    setMessages([])
    setLoadingMessages(true)
    try {
      socket?.emit('join-conversation', conv.id)
      const data = await getMessages(conv.id)
      const first = data.messages || []
      setMessages(enrichMessagesWithReplyMeta(first))
      // A full page back means there's very likely more history behind it; a short page
      // means we already have everything, so scrolling up shouldn't keep asking.
      const more = first.length >= MESSAGE_PAGE_SIZE
      hasMoreRef.current = more
      setHasMoreMessages(more)
      await markReadApi(conv.id)
      socket?.emit('mark-read', { conversationId: conv.id })
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
      )
    } catch {}
    setLoadingMessages(false)
  }, [socket])

  // Older history is fetched a page at a time, keyed on the timestamp of the oldest message
  // we currently hold — the chat only ever loaded the most recent page before this, so
  // scrolling up simply hit a wall at whatever the 50th-newest message happened to be.
  const loadOlderMessages = useCallback(async () => {
    const conv = activeConvRef.current
    if (!conv || loadingOlderRef.current || !hasMoreRef.current) return
    const oldest = messagesRef.current[0]
    if (!oldest) return

    loadingOlderRef.current = true
    setLoadingOlderMessages(true)
    try {
      const data = await getMessages(conv.id, oldest.created_at)
      const older = data.messages || []
      if (older.length < MESSAGE_PAGE_SIZE) {
        hasMoreRef.current = false
        setHasMoreMessages(false)
      }
      if (older.length > 0) {
        setMessages((prev) => {
          // The page boundary can overlap if a message landed on the exact cutoff timestamp.
          const known = new Set(prev.map((m) => m.id))
          const fresh = older.filter((m) => !known.has(m.id))
          return fresh.length ? enrichMessagesWithReplyMeta([...fresh, ...prev]) : prev
        })
      }
    } catch {}
    loadingOlderRef.current = false
    setLoadingOlderMessages(false)
  }, [])

  const closeConversation = useCallback(() => {
    if (activeConvRef.current) {
      socket?.emit('leave-conversation', activeConvRef.current.id)
    }
    setActiveConversation(null)
    setMessages([])
  }, [socket])

  const sendMessage = useCallback(async (conversationId, content, messageType = 'text', replyToMessageId = null, caption = null) => {
    if (!socket) return
    const isMedia = messageType !== 'text'
    socket.emit('send-message', {
      conversationId,
      content: isMedia ? (caption || null) : content,
      mediaUrl: isMedia ? content : null,
      messageType,
      replyToMessageId,
    })
    await loadConversations()
  }, [socket, loadConversations])

  const setReplyTo = useCallback((msg) => {
    const mediaUrl = msg.media_url || (msg.message_type !== 'text' ? msg.content : null)
    setReplyToState(msg ? {
      id: msg.id,
      content: msg.message_type === 'text' ? msg.content : null,
      messageType: msg.message_type,
      mediaUrl,
      senderName: msg.sender_display_name || msg.sender_name,
    } : null)
  }, [])

  const clearReply = useCallback(() => {
    setReplyToState(null)
  }, [])

  const flagApiMap = {
    is_archived: archiveConversation,
    is_pinned:   pinConversation,
    is_favorite: favoriteConversation,
    is_muted:    muteConversation,
  }

  const toggleConversationFlag = useCallback(async (id, flag) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [flag]: !c[flag] } : c))
    )
    try {
      const apiFn = flagApiMap[flag]
      if (apiFn) await apiFn(id)
    } catch {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [flag]: !c[flag] } : c))
      )
    }
  }, [])

  const removeConversation = useCallback(async (id) => {
    try {
      await deleteConversationApi(id)
    } catch {}
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, is_deleted: true } : c))
    if (activeConvRef.current?.id === id) {
      setActiveConversation(null)
      setMessages([])
    }
  }, [])

  // Drop a conversation from local state immediately without calling the delete API
  const dropConversation = useCallback((id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeConvRef.current?.id === id) {
      setActiveConversation(null)
      setMessages([])
    }
  }, [])

  const markConversationUnread = useCallback(async (id) => {
    try {
      await markUnreadApi(id)
      setConversations((prev) =>
        prev.map((c) => c.id === id ? { ...c, unread_count: Math.max(1, c.unread_count || 1) } : c)
      )
    } catch {}
  }, [])

  const clearConversationMessages = useCallback(async (id) => {
    try {
      await clearMessagesApi(id)
      if (activeConvRef.current?.id === id) {
        setMessages([])
      }
      await loadConversations()
    } catch {}
  }, [loadConversations])

  useEffect(() => {
    if (!socket) return

    const getNotifPrefs = () => {
      try { return JSON.parse(localStorage.getItem('notif_prefs')) || {} } catch { return {} }
    }

    const showBrowserNotif = (msg) => {
      const prefs = getNotifPrefs()
      if (prefs.messageNotifs === false) return
      if (document.hasFocus()) return
      if (Notification.permission !== 'granted') return
      const title = msg.sender_display_name || msg.sender_name || 'New message'
      const body = msg.message_type === 'text' ? (msg.content || '') : `Sent a ${msg.message_type}`
      new Notification(title, { body, icon: '/Icon.png' })
    }

    const onNewMessage = (msg) => {
      if (msg.sender_id !== user?.id) {
        try {
          const conv = conversationsRef.current.find((c) => c.id === msg.conversation_id)
          const isMuted = conv?.is_muted
          const prefs = getNotifPrefs()
          if (!isMuted && prefs.sound !== false) playReceivedSound()
          if (!isMuted) showBrowserNotif(msg)
        } catch {}
      }
      if (activeConvRef.current?.id === msg.conversation_id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          let next
          const uploadingIdx = prev.findIndex((m) => m.uploading && m.sender_id === msg.sender_id)
          if (uploadingIdx !== -1) {
            next = [...prev]
            next[uploadingIdx] = msg
          } else {
            next = [...prev, msg]
          }
          const byId = new Map(next.map((m) => [m.id, m]))
          return next.map((m) => enrichMessageReplyMeta(m, byId))
        })
        markReadApi(msg.conversation_id).catch(() => {})
        socket?.emit('mark-read', { conversationId: msg.conversation_id })
      }
      loadConversations()
    }

    const onMessageStatusUpdated = ({ messageIds, status }) => {
      setMessages((prev) =>
        prev.map((m) => messageIds.includes(m.id) ? { ...m, status } : m)
      )
      setConversations((prev) =>
        prev.map((c) =>
          c.last_message_id && messageIds.includes(c.last_message_id)
            ? { ...c, last_message_status: status }
            : c
        )
      )
    }

    const onTyping = ({ conversationId, userId }) => {
      setTypingUsers((prev) => ({ ...prev, [conversationId]: userId }))
    }

    const onStopTyping = ({ conversationId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev }
        delete next[conversationId]
        return next
      })
    }

    const onMessageEdited = ({ messageId, content, edited_at }) => {
      setMessages((prev) =>
        prev.map((m) => m.id === messageId ? { ...m, content, edited_at } : m)
      )
      // The edited message may be a conversation's last message — re-sync the sidebar preview
      // the same way a brand-new message already does, instead of leaving it showing stale text.
      loadConversations()
    }

    const onMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => m.id === messageId ? { ...m, is_deleted: true, content: null } : m)
      )
      // Same reasoning as onMessageEdited — deleting the last message means some earlier message
      // is now the true last message, and only a fresh fetch knows what that is.
      loadConversations()
    }

    const onReactionUpdated = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => m.id === messageId ? { ...m, reactions } : m)
      )
    }

    const onPresence = ({ userId, online, lastSeenAt }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        if (online) next.add(userId)
        else next.delete(userId)
        return next
      })
      if (!online && lastSeenAt) {
        setLastSeenMap((prev) => ({ ...prev, [userId]: lastSeenAt }))
      }
    }

    const onOnlineList = ({ userIds }) => setOnlineUsers(new Set(userIds))

    const onReloadConversations = () => loadConversations()

    const onConversationRemoved = ({ conversationId }) => {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      if (activeConvRef.current?.id === conversationId) {
        setActiveConversation(null)
        setMessages([])
      }
    }

    socket.on('new-message', onNewMessage)
    socket.on('user-typing', onTyping)
    socket.on('user-stop-typing', onStopTyping)
    socket.on('reaction-updated', onReactionUpdated)
    socket.on('message-edited', onMessageEdited)
    socket.on('message-deleted', onMessageDeleted)
    socket.on('message-status-updated', onMessageStatusUpdated)
    socket.on('user-presence', onPresence)
    socket.on('online-users', onOnlineList)
    socket.on('reload-conversations', onReloadConversations)
    socket.on('conversation-removed', onConversationRemoved)
    socket.emit('get-online-users')

    return () => {
      socket.off('new-message', onNewMessage)
      socket.off('user-typing', onTyping)
      socket.off('user-stop-typing', onStopTyping)
      socket.off('reaction-updated', onReactionUpdated)
      socket.off('message-edited', onMessageEdited)
      socket.off('message-deleted', onMessageDeleted)
      socket.off('message-status-updated', onMessageStatusUpdated)
      socket.off('user-presence', onPresence)
      socket.off('online-users', onOnlineList)
      socket.off('reload-conversations', onReloadConversations)
      socket.off('conversation-removed', onConversationRemoved)
    }
  }, [socket, loadConversations])

  return (
    <ChatContext.Provider value={{
      conversations, filteredConversations, loadConversations,
      conversationFilter, setConversationFilter,
      activeConversation, openConversation, closeConversation,
      messages, setMessages, loadingMessages,
      loadOlderMessages, loadingOlderMessages, hasMoreMessages,
      sendMessage,
      typingUsers,
      replyTo, setReplyTo, clearReply,
      toggleConversationFlag, removeConversation, dropConversation, clearConversationMessages, markConversationUnread,
      onlineUsers, lastSeenMap,
      messageDrafts,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  return useContext(ChatContext)
}
