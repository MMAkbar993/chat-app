import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { useToast } from '../context/ToastContext'
import { getOrCreateDirect } from '../api/conversations'
import { playRingtone, stopRingtone } from '../utils/sounds'
import Sidebar from '../components/chat/Sidebar'
import ChatsView from '../components/chat/ChatsView'
import ContactsView from '../components/contacts/ContactsView'
import GroupsView from '../components/groups/GroupsView'
import CallsView from '../components/calls/CallsView'
import ProfileView from '../components/profile/ProfileView'
import SettingsView from '../components/settings/SettingsView'
import ChatWindow from '../components/chat/ChatWindow'
import WelcomeScreen from '../components/chat/WelcomeScreen'
import CallModal from '../components/calls/CallModal'
import GroupCallModal from '../components/calls/GroupCallModal'
import CallingCard from '../components/calls/CallingCard'
import IncomingCallModal from '../components/calls/IncomingCallModal'

export default function ChatPage() {
  const [section, setSection] = useState('chats')
  const [darkMode, setDarkMode] = useState(false)
  const [activeCall, setActiveCall] = useState(null)
  const [incomingCall, setIncomingCall] = useState(null)
  const { socket } = useSocket()
  const { user, refreshUser } = useAuth()
  const { activeConversation, openConversation } = useChat()
  const { showToast } = useToast()
  const activeCallRef = useRef(null)

  useEffect(() => { activeCallRef.current = activeCall }, [activeCall])

  useEffect(() => {
    if (!socket) return

    const onIncoming = (data) => {
      if (activeCallRef.current) {
        // Already on a call — silently reject so no ringtone plays
        socket?.emit('call-reject', { callId: data.callId, callerId: data.callerId })
        return
      }
      setIncomingCall(data)
    }

    const onCallBusy = () => {
      showToast('User is currently on another call', 'info')
      setActiveCall(null)
    }

    const onCallAccepted = ({ callId }) => {
      setActiveCall((prev) => {
        if (!prev) return prev
        if (prev.callId === callId || prev.id === callId) return { ...prev, status: 'connected' }
        return prev
      })
    }

    const onCallEnded = () => {
      setActiveCall(null)
      setIncomingCall(null)
    }

    const onCallRejected = () => setActiveCall(null)

    const onRepUpdate = () => refreshUser()

    socket.on('incoming-call', onIncoming)
    socket.on('call-accepted', onCallAccepted)
    socket.on('call-ended', onCallEnded)
    socket.on('call-rejected', onCallRejected)
    socket.on('call-busy', onCallBusy)
    socket.on('rep-request-update', onRepUpdate)

    return () => {
      socket.off('incoming-call', onIncoming)
      socket.off('call-accepted', onCallAccepted)
      socket.off('call-ended', onCallEnded)
      socket.off('call-rejected', onCallRejected)
      socket.off('call-busy', onCallBusy)
      socket.off('rep-request-update', onRepUpdate)
    }
  }, [socket])

  useEffect(() => {
    if (incomingCall) {
      playRingtone()
    } else {
      stopRingtone()
    }
    return () => stopRingtone()
  }, [incomingCall])

  function handleCallStart(callType) {
    if (activeConversation?.type === 'group') {
      socket?.emit('call-initiate', { callType, conversationId: activeConversation.id })
      socket?.once('call-created', ({ call }) => {
        setActiveCall({
          ...call,
          calleeId: null,
          calleeName: activeConversation.name || 'Group',
          calleeAvatar: activeConversation.avatar_url || null,
          conversationId: activeConversation.id,
          isCaller: true,
          isGroup: true,
          // no status: 'connected' — CallingCard shows while members ring
          // GroupCallModal opens when first member accepts (onCallAccepted sets status:'connected')
        })
      })
      return
    }
    if (!activeConversation?.other_user_id) return
    initiateCall(callType, activeConversation.other_user_id, activeConversation.id, {
      name: activeConversation.other_user_display_name || activeConversation.other_user_name,
      avatar: activeConversation.other_user_avatar,
    })
  }

  async function handleNewCall(callType, targetUserId, targetName, targetAvatar) {
    try {
      const data = await getOrCreateDirect(targetUserId)
      const convId = data.conversation?.id || data.id
      initiateCall(callType, targetUserId, convId, { name: targetName, avatar: targetAvatar })
    } catch {}
  }

  function initiateCall(callType, targetUserId, conversationId, targetInfo) {
    socket?.emit('call-initiate', { targetUserId, callType, conversationId })
    socket?.once('call-created', ({ call }) => {
      setActiveCall({
        ...call,
        calleeId: targetUserId,
        calleeName: targetInfo?.name || 'Unknown',
        calleeAvatar: targetInfo?.avatar || null,
        isCaller: true,
      })
    })
  }

  function handleAcceptCall() {
    if (!incomingCall) return
    socket?.emit('call-accept', { callId: incomingCall.callId, callerId: incomingCall.callerId })
    setActiveCall({
      ...incomingCall,
      isCaller: false,
      status: 'connected',
      ...(incomingCall.isGroup && { isGroup: true, calleeId: null }),
    })
    setIncomingCall(null)
  }

  function handleRejectCall() {
    if (!incomingCall) return
    socket?.emit('call-reject', { callId: incomingCall.callId, callerId: incomingCall.callerId })
    setIncomingCall(null)
  }

  return (
    <div className={`h-screen flex overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <Sidebar active={section} onNav={setSection} darkMode={darkMode} onDarkMode={() => setDarkMode((d) => !d)} />

      {/* Left panel */}
      {section === 'chats' && <ChatsView darkMode={darkMode} />}
      {section === 'contacts' && <ContactsView darkMode={darkMode} onNavigate={setSection} onNewCall={handleNewCall} />}
      {section === 'groups' && <GroupsView darkMode={darkMode} />}
      {section === 'calls' && <CallsView darkMode={darkMode} onCallStart={handleCallStart} onNewCall={handleNewCall} onOpenChat={async (userId) => { try { const data = await getOrCreateDirect(userId); openConversation(data.conversation); setSection('chats') } catch {} }} />}
      {section === 'profile' && <ProfileView darkMode={darkMode} />}
      {section === 'settings' && <SettingsView darkMode={darkMode} />}

      {/* Right panel — chat window on chats/groups tabs, welcome screen everywhere else */}
      {(section === 'chats' || section === 'groups') && activeConversation ? (
        <ChatWindow darkMode={darkMode} onCallStart={handleCallStart} />
      ) : (
        <WelcomeScreen darkMode={darkMode} />
      )}

      {/* Incoming call */}
      {incomingCall && !activeCall && (
        <IncomingCallModal
          call={incomingCall}
          darkMode={darkMode}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Calling card (ringing state) */}
      {activeCall && activeCall.status !== 'connected' && (
        <CallingCard
          call={activeCall}
          darkMode={darkMode}
          onEnd={() => {
            socket?.emit('call-end', { callId: activeCall.id || activeCall.callId, targetUserId: activeCall.calleeId || activeCall.callee_id, conversationId: activeCall.conversation_id })
            setActiveCall(null)
          }}
        />
      )}

      {/* Active call (connected) */}
      {activeCall && activeCall.status === 'connected' && (
        activeCall.isGroup
          ? <GroupCallModal call={activeCall} darkMode={darkMode} onEnd={() => setActiveCall(null)} />
          : <CallModal call={activeCall} darkMode={darkMode} isCaller={activeCall.isCaller} onEnd={() => setActiveCall(null)} />
      )}
    </div>
  )
}
