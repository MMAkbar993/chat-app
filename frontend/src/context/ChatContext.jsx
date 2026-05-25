import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSocket } from './SocketContext'
import { useAuth } from './AuthContext'
import { playReceivedSound } from '../utils/sounds'
import {
  getConversations, getMessages, sendMessageApi, markReadApi, markUnreadApi,
  archiveConversation, pinConversation, favoriteConversation, muteConversation,
  deleteConversationApi, clearMessagesApi,
} from '../api/conversations'

const ChatContext = createContext(null)

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
  const activeConvRef = useRef(null)

  useEffect(() => {
    activeConvRef.current = activeConversation
  }, [activeConversation])

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
      setConversations(data.conversations || [])
    } catch {}
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const openConversation = useCallback(async (conv) => {
    if (activeConvRef.current?.id === conv.id) return
    setActiveConversation(conv)
    setMessages([])
    setLoadingMessages(true)
    try {
      socket?.emit('join-conversation', conv.id)
      const data = await getMessages(conv.id)
      setMessages(data.messages || [])
      await markReadApi(conv.id)
      socket?.emit('mark-read', { conversationId: conv.id })
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
      )
    } catch {}
    setLoadingMessages(false)
  }, [socket])

  const closeConversation = useCallback(() => {
    if (activeConvRef.current) {
      socket?.emit('leave-conversation', activeConvRef.current.id)
    }
    setActiveConversation(null)
    setMessages([])
  }, [socket])

  const sendMessage = useCallback(async (conversationId, content, messageType = 'text', replyToMessageId = null) => {
    if (!socket) return
    const isMedia = messageType !== 'text'
    socket.emit('send-message', {
      conversationId,
      content: isMedia ? null : content,
      mediaUrl: isMedia ? content : null,
      messageType,
      replyToMessageId,
    })
    await loadConversations()
  }, [socket, loadConversations])

  const setReplyTo = useCallback((msg) => {
    setReplyToState(msg ? { id: msg.id, content: msg.content, senderName: msg.sender_display_name || msg.sender_name } : null)
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
      setConversations((prev) => prev.map((c) => c.id === id ? { ...c, is_deleted: true } : c))
      if (activeConvRef.current?.id === id) {
        setActiveConversation(null)
        setMessages([])
      }
    } catch {}
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
    } catch {}
  }, [])

  useEffect(() => {
    if (!socket) return

    const onNewMessage = (msg) => {
      if (msg.sender_id !== user?.id) {
        playReceivedSound()
      }
      if (activeConvRef.current?.id === msg.conversation_id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          const uploadingIdx = prev.findIndex((m) => m.uploading && m.sender_id === msg.sender_id)
          if (uploadingIdx !== -1) {
            const next = [...prev]
            next[uploadingIdx] = msg
            return next
          }
          return [...prev, msg]
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

    const onReactionUpdated = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => m.id === messageId ? { ...m, reactions } : m)
      )
    }

    socket.on('new-message', onNewMessage)
    socket.on('user-typing', onTyping)
    socket.on('user-stop-typing', onStopTyping)
    socket.on('reaction-updated', onReactionUpdated)
    socket.on('message-status-updated', onMessageStatusUpdated)

    return () => {
      socket.off('new-message', onNewMessage)
      socket.off('user-typing', onTyping)
      socket.off('user-stop-typing', onStopTyping)
      socket.off('reaction-updated', onReactionUpdated)
      socket.off('message-status-updated', onMessageStatusUpdated)
    }
  }, [socket, loadConversations])

  return (
    <ChatContext.Provider value={{
      conversations, filteredConversations, loadConversations,
      conversationFilter, setConversationFilter,
      activeConversation, openConversation, closeConversation,
      messages, setMessages, loadingMessages,
      sendMessage,
      typingUsers,
      replyTo, setReplyTo, clearReply,
      toggleConversationFlag, removeConversation, clearConversationMessages, markConversationUnread,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  return useContext(ChatContext)
}
