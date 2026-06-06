import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import { playCallConnected, playCallEnded } from '../../utils/sounds'

const ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

function PeerVideo({ stream, name, avatar }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream || null
  }, [stream])

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center min-h-0">
      {stream
        ? <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
        : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                : (name || '?')[0].toUpperCase()}
            </div>
            <p className="text-white/50 text-xs">Connecting…</p>
          </div>
        )}
      <div className="absolute bottom-2 left-3 pointer-events-none">
        <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">{name || 'Unknown'}</span>
      </div>
    </div>
  )
}

function AudioPeer({ name, avatar, stream }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream || null
  }, [stream])

  return (
    <div className="flex flex-col items-center gap-2">
      {stream && <audio ref={ref} autoPlay />}
      <div className="w-20 h-20 rounded-full overflow-hidden bg-violet-600 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-white/20">
        {avatar
          ? <img src={avatar} alt="" className="w-full h-full object-cover" />
          : (name || '?')[0].toUpperCase()}
      </div>
      <p className="text-white text-sm font-medium">{name || 'Unknown'}</p>
    </div>
  )
}

function fmt(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

export default function GroupCallModal({ call, onEnd }) {
  const { socket } = useSocket()
  const { user } = useAuth()

  const callId = call.id || call.callId
  const isVideo = call.callType === 'video' || call.call_type === 'video'
  const groupName = call.calleeName || call.callerName || call.conversationName || 'Group Call'

  const [peers, setPeers] = useState({})   // peerId → { name, avatar, stream }
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const pcsRef = useRef({})                // peerId → RTCPeerConnection
  const localStreamRef = useRef(null)
  const localVideoRef = useRef(null)
  const pendingCandidates = useRef({})     // peerId → RTCIceCandidate[]
  const peerInfoCache = useRef({})         // peerId → { name, avatar } (stable across re-renders)

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Boot: get media → join room
  useEffect(() => {
    async function boot() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true })
        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
        playCallConnected()
        socket?.emit('group-call-join', {
          callId,
          conversationId: call.conversationId || call.conversation_id,
        })
      } catch (err) {
        console.error('GroupCallModal boot error:', err)
      }
    }
    boot()
    return () => {
      playCallEnded()
      stopMedia()
      Object.values(pcsRef.current).forEach((pc) => pc.close())
      pcsRef.current = {}
    }
  }, [])

  function stopMedia() {
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
  }

  function makePc(peerId) {
    if (pcsRef.current[peerId]) return pcsRef.current[peerId]
    const pc = new RTCPeerConnection(ICE)
    pcsRef.current[peerId] = pc

    localStreamRef.current?.getTracks().forEach((t) =>
      pc.addTrack(t, localStreamRef.current)
    )

    pc.ontrack = (e) => {
      const stream = e.streams[0]
      setPeers((prev) => ({
        ...prev,
        [peerId]: { ...(peerInfoCache.current[peerId] || {}), ...prev[peerId], stream },
      }))
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit('group-webrtc-ice', { callId, targetUserId: peerId, candidate: e.candidate })
      }
    }

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        dropPeer(peerId)
      }
    }

    return pc
  }

  async function offerTo(peerId) {
    const pc = makePc(peerId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket?.emit('group-webrtc-offer', { callId, targetUserId: peerId, offer })
  }

  async function answerOffer(peerId, offer) {
    const pc = makePc(peerId)
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const pending = pendingCandidates.current[peerId] || []
    for (const c of pending) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
    }
    delete pendingCandidates.current[peerId]
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    socket?.emit('group-webrtc-answer', { callId, targetUserId: peerId, answer })
  }

  function dropPeer(peerId) {
    pcsRef.current[peerId]?.close()
    delete pcsRef.current[peerId]
    delete peerInfoCache.current[peerId]
    setPeers((prev) => {
      const next = { ...prev }
      delete next[peerId]
      return next
    })
  }

  // Socket listeners
  useEffect(() => {
    if (!socket) return

    const onJoined = async ({ participants }) => {
      for (const p of participants) {
        if (p.id === user?.id) continue
        peerInfoCache.current[p.id] = { name: p.name, avatar: p.avatar }
        setPeers((prev) => ({
          ...prev,
          [p.id]: { name: p.name, avatar: p.avatar, stream: null, ...prev[p.id] },
        }))
        await offerTo(p.id)
      }
    }

    const onUserJoined = ({ user: u }) => {
      if (u.id === user?.id) return
      peerInfoCache.current[u.id] = { name: u.name, avatar: u.avatar }
      setPeers((prev) => ({
        ...prev,
        [u.id]: { name: u.name, avatar: u.avatar, stream: null, ...prev[u.id] },
      }))
      // New joiner will send us an offer — just wait
    }

    const onUserLeft = ({ userId: uid }) => dropPeer(uid)

    const onOffer = ({ fromUserId, offer }) => answerOffer(fromUserId, offer)

    const onAnswer = async ({ fromUserId, answer }) => {
      const pc = pcsRef.current[fromUserId]
      if (!pc || pc.signalingState !== 'have-local-offer') return
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
      const pending = pendingCandidates.current[fromUserId] || []
      for (const c of pending) {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
      }
      delete pendingCandidates.current[fromUserId]
    }

    const onIce = async ({ fromUserId, candidate }) => {
      const pc = pcsRef.current[fromUserId]
      if (!pc?.remoteDescription) {
        if (!pendingCandidates.current[fromUserId]) pendingCandidates.current[fromUserId] = []
        pendingCandidates.current[fromUserId].push(candidate)
        return
      }
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
    }

    socket.on('group-call-joined', onJoined)
    socket.on('group-call-user-joined', onUserJoined)
    socket.on('group-call-user-left', onUserLeft)
    socket.on('group-webrtc-offer', onOffer)
    socket.on('group-webrtc-answer', onAnswer)
    socket.on('group-webrtc-ice', onIce)

    return () => {
      socket.off('group-call-joined', onJoined)
      socket.off('group-call-user-joined', onUserJoined)
      socket.off('group-call-user-left', onUserLeft)
      socket.off('group-webrtc-offer', onOffer)
      socket.off('group-webrtc-answer', onAnswer)
      socket.off('group-webrtc-ice', onIce)
    }
  }, [socket, user])

  function handleLeave() {
    socket?.emit('group-call-leave', { callId })
    stopMedia()
    Object.values(pcsRef.current).forEach((pc) => pc.close())
    pcsRef.current = {}
    onEnd?.()
  }

  function toggleMute() {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled })
    setMuted((m) => !m)
  }

  function toggleVideo() {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled })
    setVideoOff((v) => !v)
  }

  const peerList = Object.entries(peers)
  const total = peerList.length + 1
  const gridCols =
    total === 1 ? 'grid-cols-1' :
    total === 2 ? 'grid-cols-2' :
    total <= 4  ? 'grid-cols-2' :
                  'grid-cols-3'

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-4 px-6 py-4 bg-black/50">
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg truncate">{groupName}</p>
          <p className="text-white/60 text-sm">
            {fmt(elapsed)} · {total} participant{total !== 1 ? 's' : ''}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${isVideo ? 'bg-violet-600/40 text-violet-300' : 'bg-white/10 text-white/60'}`}>
          {isVideo ? 'Video' : 'Voice'}
        </span>
      </div>

      {/* Main area */}
      <div className="flex-1 overflow-hidden p-3 min-h-0">
        {isVideo ? (
          <div className={`h-full grid gap-3 ${gridCols}`}>
            {/* Local tile */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-800 min-h-0">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              {videoOff && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                    {user?.avatar_url
                      ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      : (user?.display_name || user?.full_name || '?')[0].toUpperCase()}
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-3 pointer-events-none flex items-center gap-1.5">
                <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">You</span>
                {muted && (
                  <span className="bg-red-500 rounded-full p-0.5">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
            {/* Remote tiles */}
            {peerList.map(([peerId, peer]) => (
              <PeerVideo key={peerId} stream={peer.stream} name={peer.name} avatar={peer.avatar} />
            ))}
          </div>
        ) : (
          // Audio — avatar grid
          <div className="h-full flex flex-wrap items-center justify-center gap-8 content-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-24 h-24 rounded-full overflow-hidden bg-violet-600 flex items-center justify-center text-white text-3xl font-bold ring-4 transition-colors ${muted ? 'ring-red-500/70' : 'ring-white/20'}`}>
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  : (user?.display_name || user?.full_name || '?')[0].toUpperCase()}
              </div>
              <p className="text-white text-sm font-medium">You{muted ? ' (muted)' : ''}</p>
            </div>
            {peerList.map(([peerId, peer]) => (
              <AudioPeer key={peerId} name={peer.name} avatar={peer.avatar} stream={peer.stream} />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 flex items-center justify-center gap-8 py-7 bg-black/50">
        {/* Mute */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              muted ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {muted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>
          <span className="text-white/70 text-xs">{muted ? 'Unmute' : 'Mute'}</span>
        </div>

        {/* Leave */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={handleLeave}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-xl"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
          <span className="text-white/70 text-xs">Leave</span>
        </div>

        {/* Camera (video only) */}
        {isVideo && (
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                videoOff ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {videoOff ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z M3 3l18 18" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                )}
              </svg>
            </button>
            <span className="text-white/70 text-xs">{videoOff ? 'Start Cam' : 'Stop Cam'}</span>
          </div>
        )}
      </div>
    </div>
  )
}
