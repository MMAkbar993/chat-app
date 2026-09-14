import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { useToast } from '../context/ToastContext'
import { getOrCreateDirect } from '../api/conversations'
import { markTourSeen } from '../api/users'
import client from '../api/client'
import { PENDING_DM_KEY } from '../utils/pendingDm'
import { PENDING_JOIN_KEY } from '../utils/pendingJoin'
import { joinGroupByInvite } from '../api/groups'
import { playRingtone, stopRingtone } from '../utils/sounds'
import Sidebar from '../components/chat/Sidebar'
import ChatsView from '../components/chat/ChatsView'
import ContactsView from '../components/contacts/ContactsView'
import GroupsView from '../components/groups/GroupsView'
import CallsView from '../components/calls/CallsView'
import SettingsView from '../components/settings/SettingsView'
import SettingsDetailPanel from '../components/settings/SettingsDetailPanel'
import ChatWindow from '../components/chat/ChatWindow'
import WelcomeScreen from '../components/chat/WelcomeScreen'
import CallModal from '../components/calls/CallModal'
import GroupCallModal from '../components/calls/GroupCallModal'
import CallingCard from '../components/calls/CallingCard'
import IncomingCallModal from '../components/calls/IncomingCallModal'
import UpgradeModal from '../features/payment/UpgradeModal'
import ProductTour from '../components/onboarding/ProductTour'

const DARK_MODE_KEY = 'pulse:darkMode'

// Lazy initialiser. Storage can throw outright in private-browsing modes, so a failed read
// just means "light mode" rather than a blank screen.
function readStoredDarkMode() {
  try {
    return localStorage.getItem(DARK_MODE_KEY) === '1'
  } catch {
    return false
  }
}

export default function ChatPage() {
  const [section, setSection] = useState('chats')
  const [settingsSection, setSettingsSection] = useState(null)
  // Persisted: the toggle used to live only in component state, so every reload — and every
  // OAuth round-trip that re-mounts the app — dropped the user back to light mode.
  const [darkMode, setDarkMode] = useState(readStoredDarkMode)
  const [activeCall, setActiveCall] = useState(null)
  // Whether a connected call is tucked into a small floating window instead of taking the
  // whole screen. Reset at every call boundary (new call starts, current one ends) so a fresh
  // call never inherits a "minimized" state left over from the last one.
  const [callMinimized, setCallMinimized] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)
  const [showCallLimitUpgrade, setShowCallLimitUpgrade] = useState(false)
  const [tourRestartCount, setTourRestartCount] = useState(0)
  const { socket } = useSocket()
  const { user, refreshUser } = useAuth()
  const { activeConversation, openConversation } = useChat()
  const { showToast } = useToast()
  const activeCallRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(DARK_MODE_KEY, darkMode ? '1' : '0')
    } catch {
      // Storage unavailable — the choice just won't survive this session.
    }
  }, [darkMode])

  useEffect(() => { activeCallRef.current = activeCall }, [activeCall])

  // "Send Message" from a public profile page (/u/:username) sets this before redirecting through
  // login/signup/KYC — pick it up once here, however many hops it took to actually land on /chat.
  useEffect(() => {
    const username = localStorage.getItem(PENDING_DM_KEY)
    if (!username) return
    localStorage.removeItem(PENDING_DM_KEY)
    client.get(`/users/profile/${username}`)
      .then(({ data }) => getOrCreateDirect(data.user.id))
      .then((data) => {
        openConversation(data.conversation)
        setSection('chats')
      })
      .catch(() => {})
  }, [openConversation])

  // Same idea for a group invite link opened while signed out: JoinGroupPage stashes the code
  // before sending them to log in, and it's redeemed here once they finally arrive.
  useEffect(() => {
    const code = localStorage.getItem(PENDING_JOIN_KEY)
    if (!code) return
    localStorage.removeItem(PENDING_JOIN_KEY)
    joinGroupByInvite(code)
      .then(({ conversationId }) => client.get(`/groups/${conversationId}`))
      .then(({ data }) => {
        openConversation(data.group)
        setSection('groups')
      })
      .catch(() => {
        // Revoked while they were signing up, most likely. They're in the app either way.
      })
  }, [openConversation])

  // A ?conversation=<id> deep link opens that thread. Group invite links land here after
  // joining, and nothing was reading the parameter, so following one dropped people on an
  // empty chat pane with the group they had just joined sitting unopened in the list.
  // Read once into a ref so a re-render can't reopen it after the user navigates away.
  const pendingConvRef = useRef(new URLSearchParams(window.location.search).get('conversation'))
  useEffect(() => {
    const id = pendingConvRef.current
    if (!id) return
    pendingConvRef.current = null
    client.get(`/conversations/${id}`)
      .then(({ data }) => {
        const conv = data.conversation
        // The list endpoint supplies my_role, but a single-conversation fetch doesn't — derive
        // it from the participants so admin-only affordances (pinning, posting in
        // announcement groups) don't silently disappear for an admin arriving through a link.
        // (other_user_* / is_contact for direct chats now come from the API response itself.)
        const myRole = conv.participants?.find((p) => p.id === user?.id)?.role
        openConversation({ ...conv, my_role: myRole })
        setSection(conv.type === 'group' ? 'groups' : 'chats')
        // Drop the parameter so a reload doesn't fight with whatever they opened since.
        window.history.replaceState({}, '', window.location.pathname)
      })
      .catch(() => {
        // Not a participant, or the conversation is gone. They're in the app either way.
      })
  }, [openConversation, user?.id])

  // Mobile: only one panel (list vs. detail) is shown at a time, Telegram-style.
  const mobileDetail = section === 'settings'
    ? !!settingsSection
    : (section === 'chats' || section === 'groups') && !!activeConversation

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
      setCallMinimized(false)
    }

    const onCallAccepted = ({ callId }) => {
      setActiveCall((prev) => {
        if (!prev) return prev
        if (prev.callId === callId || prev.id === callId) return { ...prev, status: 'connected' }
        return prev
      })
      setCallMinimized(false)
    }

    const onCallEnded = () => {
      setActiveCall(null)
      setCallMinimized(false)
      setIncomingCall(null)
    }

    const onCallRejected = () => { setActiveCall(null); setCallMinimized(false) }

    const onCallBlocked = () => {
      setActiveCall(null)
      setCallMinimized(false)
      showToast("You've used your free monthly call minutes", 'info')
      setShowCallLimitUpgrade(true)
    }

    // Answered or declined on another device this account is signed in on. Dismiss the ring
    // here — otherwise this device keeps ringing and its 30s no-answer timer eventually fires
    // a reject that would end the call the other device is actively on.
    const onCallHandled = () => setIncomingCall(null)

    const onRepUpdate = () => refreshUser()

    socket.on('incoming-call', onIncoming)
    socket.on('call-accepted', onCallAccepted)
    socket.on('call-ended', onCallEnded)
    socket.on('call-rejected', onCallRejected)
    socket.on('call-handled', onCallHandled)
    socket.on('call-busy', onCallBusy)
    socket.on('call-blocked', onCallBlocked)
    socket.on('rep-request-update', onRepUpdate)

    return () => {
      socket.off('incoming-call', onIncoming)
      socket.off('call-accepted', onCallAccepted)
      socket.off('call-ended', onCallEnded)
      socket.off('call-rejected', onCallRejected)
      socket.off('call-handled', onCallHandled)
      socket.off('call-busy', onCallBusy)
      socket.off('call-blocked', onCallBlocked)
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
        setCallMinimized(false)
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
      setCallMinimized(false)
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
    setCallMinimized(false)
    setIncomingCall(null)
  }

  function handleRejectCall() {
    if (!incomingCall) return
    socket?.emit('call-reject', { callId: incomingCall.callId, callerId: incomingCall.callerId })
    setIncomingCall(null)
  }

  return (
    <div
      className={`h-dvh flex overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <h1 className="sr-only">Pulse</h1>
      <Sidebar
        active={section}
        onNav={setSection}
        onEditProfile={() => { setSection('settings'); setSettingsSection('profile') }}
        darkMode={darkMode}
        onDarkMode={() => setDarkMode((d) => !d)}
        mobileHidden={mobileDetail}
      />

      {/* Left panel */}
      {section === 'chats' && <ChatsView darkMode={darkMode} mobileHidden={mobileDetail} />}
      {section === 'contacts' && <ContactsView darkMode={darkMode} onNavigate={setSection} onNewCall={handleNewCall} mobileHidden={mobileDetail} />}
      {section === 'groups' && <GroupsView darkMode={darkMode} mobileHidden={mobileDetail} />}
      {section === 'calls' && <CallsView darkMode={darkMode} onCallStart={handleCallStart} onNewCall={handleNewCall} onOpenChat={async (userId) => { try { const data = await getOrCreateDirect(userId); openConversation(data.conversation); setSection('chats') } catch {} }} mobileHidden={mobileDetail} />}
      {section === 'settings' && (
        <SettingsView darkMode={darkMode} onDarkMode={() => setDarkMode((d) => !d)} activeSection={settingsSection} onSelect={setSettingsSection} mobileHidden={mobileDetail} onStartTour={() => setTourRestartCount((c) => c + 1)} />
      )}

      {/* Right panel — settings detail on that tab, chat window on chats/groups, welcome screen otherwise.
          Hidden on mobile until a chat/setting is actually opened, since the list fills the screen until then. */}
      <div className={`${mobileDetail ? 'flex' : 'hidden md:flex'} flex-1 overflow-hidden`}>
      {section === 'settings' ? (
        <SettingsDetailPanel darkMode={darkMode} section={settingsSection} onBack={() => setSettingsSection(null)} />
      ) : (section === 'chats' || section === 'groups') && activeConversation ? (
        <ChatWindow darkMode={darkMode} onCallStart={handleCallStart} />
      ) : (
        <WelcomeScreen darkMode={darkMode} />
      )}
      </div>

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
            setCallMinimized(false)
          }}
        />
      )}

      {/* Active call (connected). Minimizing swaps CallModal/GroupCallModal's own layout down
          to a small floating window rather than unmounting either — that's what keeps the
          Agora client, published tracks and channel membership alive while the caller looks at
          other chats, instead of the call silently dropping the moment they navigate away. */}
      {activeCall && activeCall.status === 'connected' && (
        activeCall.isGroup
          ? <GroupCallModal
              call={activeCall}
              darkMode={darkMode}
              onEnd={() => { setActiveCall(null); setCallMinimized(false) }}
              minimized={callMinimized}
              onMinimize={() => setCallMinimized(true)}
              onExpand={() => setCallMinimized(false)}
            />
          : <CallModal
              call={activeCall}
              darkMode={darkMode}
              isCaller={activeCall.isCaller}
              onEnd={() => { setActiveCall(null); setCallMinimized(false) }}
              onLimitReached={() => setShowCallLimitUpgrade(true)}
              minimized={callMinimized}
              onMinimize={() => setCallMinimized(true)}
              onExpand={() => setCallMinimized(false)}
            />
      )}

      <UpgradeModal isOpen={showCallLimitUpgrade} onClose={() => setShowCallLimitUpgrade(false)} />

      <ProductTour
        hasSeenTour={user?.has_seen_tour}
        onMarkSeen={async () => { await markTourSeen().catch(() => {}); refreshUser() }}
        setSection={setSection}
        darkMode={darkMode}
        restartSignal={tourRestartCount}
      />
    </div>
  )
}
