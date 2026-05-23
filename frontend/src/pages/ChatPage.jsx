import { useState, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
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
import CallingCard from '../components/calls/CallingCard'
import IncomingCallModal from '../components/calls/IncomingCallModal'

const PANEL_VIEWS = ['chats', 'contacts', 'groups', 'calls', 'profile', 'settings']

export default function ChatPage() {
  const [section, setSection] = useState('chats')
  const [darkMode, setDarkMode] = useState(false)
  const [activeCall, setActiveCall] = useState(null)
  const [incomingCall, setIncomingCall] = useState(null)
  const { socket } = useSocket()
  const { user } = useAuth()
  const { activeConversation } = useChat()

  useEffect(() => {
    if (!socket) return

    const onIncoming = (data) => setIncomingCall(data)

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

    socket.on('incoming-call', onIncoming)
    socket.on('call-accepted', onCallAccepted)
    socket.on('call-ended', onCallEnded)
    socket.on('call-rejected', onCallRejected)

    return () => {
      socket.off('incoming-call', onIncoming)
      socket.off('call-accepted', onCallAccepted)
      socket.off('call-ended', onCallEnded)
      socket.off('call-rejected', onCallRejected)
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
    setActiveCall({ ...incomingCall, isCaller: false, status: 'connected' })
    setIncomingCall(null)
  }

  function handleRejectCall() {
    if (!incomingCall) return
    socket?.emit('call-reject', { callId: incomingCall.callId, callerId: incomingCall.callerId })
    setIncomingCall(null)
  }

  const showChatWindow = ['chats', 'contacts', 'groups'].includes(section)
  const isProfileSettings = ['profile', 'settings'].includes(section)

  return (
    <div className={`h-screen flex overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <Sidebar active={section} onNav={setSection} darkMode={darkMode} onDarkMode={() => setDarkMode((d) => !d)} />

      {/* Left panel */}
      {section === 'chats' && <ChatsView darkMode={darkMode} />}
      {section === 'contacts' && <ContactsView darkMode={darkMode} onNavigate={setSection} />}
      {section === 'groups' && <GroupsView darkMode={darkMode} />}
      {section === 'calls' && <CallsView darkMode={darkMode} onCallStart={handleCallStart} onNewCall={handleNewCall} />}
      {section === 'profile' && <ProfileView darkMode={darkMode} />}
      {section === 'settings' && <SettingsView darkMode={darkMode} />}

      {/* Right panel */}
      {showChatWindow && activeConversation ? (
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
            socket?.emit('call-end', { callId: activeCall.id || activeCall.callId, targetUserId: activeCall.calleeId || activeCall.callee_id })
            setActiveCall(null)
          }}
        />
      )}

      {/* Active call (connected) */}
      {activeCall && activeCall.status === 'connected' && (
        <CallModal
          call={activeCall}
          darkMode={darkMode}
          isCaller={activeCall.isCaller}
          onEnd={() => setActiveCall(null)}
        />
      )}
    </div>
  )
}
