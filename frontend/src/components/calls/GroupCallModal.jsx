import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import { playCallConnected, playCallEnded } from '../../utils/sounds'
import { useAgoraCall, useAgoraVideo } from '../../hooks/useAgoraCall'

// Two layers, deliberately separate. Socket.IO tracks who is *in* the call — names and avatars,
// so a tile can appear the moment someone joins rather than when their camera finally starts.
// Agora carries the media.
//
// This replaced a full peer-to-peer mesh: every participant held an RTCPeerConnection to every
// other, so a five-person call meant four uploads of your own camera from one laptop. Agora's
// SFU takes one upload per person regardless of how many are in the room.

function VideoTile({ track, name, avatar, muted }) {
  const ref = useRef(null)
  useAgoraVideo(track, ref)

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center min-h-0">
      {track
        ? <div ref={ref} className="w-full h-full [&_video]:object-cover" />
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
      <div className="absolute bottom-2 left-3 pointer-events-none flex items-center gap-1.5">
        <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">{name || 'Unknown'}</span>
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
  )
}

function AudioTile({ name, avatar }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* No element needed — Agora plays remote audio itself once subscribed. */}
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

export default function GroupCallModal({ call, onEnd, minimized, onMinimize, onExpand }) {
  const { socket } = useSocket()
  const { user } = useAuth()

  const callId = call.id || call.callId
  const conversationId = call.conversationId || call.conversation_id
  const isVideo = call.callType === 'video' || call.call_type === 'video'
  const groupName = call.calleeName || call.callerName || call.conversationName || 'Group Call'

  // userId → { name, avatar }, straight from the socket room.
  const [directory, setDirectory] = useState({})
  const [elapsed, setElapsed] = useState(0)
  const localVideoRef = useRef(null)
  const connectedOnceRef = useRef(false)

  const {
    status, remoteUsers, muted, videoOff, localVideoTrack, toggleMute, toggleVideo,
  } = useAgoraCall({ callId, isVideo })

  useAgoraVideo(localVideoTrack, localVideoRef)

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (status === 'connected' && !connectedOnceRef.current) {
      connectedOnceRef.current = true
      playCallConnected()
    }
  }, [status])

  useEffect(() => {
    if (!socket) return

    const onJoined = ({ participants }) => {
      setDirectory(Object.fromEntries((participants || []).map((p) => [p.id, { name: p.name, avatar: p.avatar }])))
    }
    const onUserJoined = ({ user: joined }) => {
      setDirectory((d) => ({ ...d, [joined.id]: { name: joined.name, avatar: joined.avatar } }))
    }
    const onUserLeft = ({ userId }) => {
      setDirectory((d) => {
        const next = { ...d }
        delete next[userId]
        return next
      })
    }
    const onCallEnded = () => { playCallEnded(); onEnd?.() }

    socket.on('group-call-joined', onJoined)
    socket.on('group-call-user-joined', onUserJoined)
    socket.on('group-call-user-left', onUserLeft)
    socket.on('call-ended', onCallEnded)
    socket.emit('group-call-join', { callId, conversationId })

    return () => {
      socket.off('group-call-joined', onJoined)
      socket.off('group-call-user-joined', onUserJoined)
      socket.off('group-call-user-left', onUserLeft)
      socket.off('call-ended', onCallEnded)
      socket.emit('group-call-leave', { callId })
    }
  }, [socket, callId, conversationId])

  function handleLeave() {
    playCallEnded()
    socket?.emit('group-call-leave', { callId })
    // Agora tracks and channel membership are released by the hook's cleanup on unmount.
    onEnd?.()
  }

  // Anyone the socket knows about, plus anyone Agora is already carrying — a person who joined
  // but hasn't published yet still deserves a tile, and a publisher whose join event was missed
  // shouldn't be invisible.
  const mediaByUid = Object.fromEntries(remoteUsers.map((u) => [String(u.uid), u]))
  const peerIds = [...new Set([...Object.keys(directory), ...Object.keys(mediaByUid)])]
    .filter((id) => id !== user?.id)

  const total = peerIds.length + 1
  const gridCols =
    total === 1 ? 'grid-cols-1' :
    total === 2 ? 'grid-cols-2' :
    total <= 4 ? 'grid-cols-2' :
      'grid-cols-3'

  return (
    <div className={
      minimized
        ? 'fixed bottom-4 right-4 z-50 w-64 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/20 bg-gray-900 flex flex-col'
        : 'fixed inset-0 z-50 bg-gray-900 flex flex-col'
    }>
      {/* Compact header — minimized only */}
      {minimized && (
        <div className="shrink-0 flex items-center justify-between gap-2 px-2.5 py-2 bg-black/50">
          <p className="text-white text-xs font-semibold truncate">{groupName}</p>
          <button
            onClick={onExpand}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white shrink-0"
            title="Expand"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5v4m0-4h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      )}

      {/* Full header */}
      <div className={`shrink-0 flex items-center gap-4 px-6 py-4 bg-black/50 ${minimized ? 'hidden' : ''}`}>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg truncate">{groupName}</p>
          <p className="text-white/60 text-sm">
            {status === 'failed'
              ? "Couldn't connect — check your network"
              : `${fmt(elapsed)} · ${total} participant${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${isVideo ? 'bg-violet-600/40 text-violet-300' : 'bg-white/10 text-white/60'}`}>
          {isVideo ? 'Video' : 'Voice'}
        </span>
      </div>

      {/* Main area — always mounted, just hidden when minimized. It hosts the local video tile,
          whose ref is owned by this component (via useAgoraVideo above); unmounting it would
          mean the track never reattaches to a new node once the call is expanded again. */}
      <div className={`flex-1 overflow-hidden p-3 min-h-0 ${minimized ? 'hidden' : ''}`}>
        {isVideo ? (
          <div className={`h-full grid gap-3 ${gridCols}`}>
            {/* Local tile */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-800 min-h-0">
              <div ref={localVideoRef} className="w-full h-full [&_video]:object-cover" />
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
            {peerIds.map((id) => (
              <VideoTile
                key={id}
                track={mediaByUid[id]?.videoTrack || null}
                name={directory[id]?.name}
                avatar={directory[id]?.avatar}
                muted={mediaByUid[id] ? !mediaByUid[id].hasAudio : false}
              />
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
            {peerIds.map((id) => (
              <AudioTile key={id} name={directory[id]?.name} avatar={directory[id]?.avatar} />
            ))}
          </div>
        )}
      </div>

      {/* Compact controls — minimized only */}
      {minimized && (
        <div className="shrink-0 flex items-center justify-center gap-2 py-2 bg-black/50">
          <button
            onClick={toggleMute}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              muted ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {muted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>
          <button
            onClick={handleLeave}
            className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      )}

      {/* Full controls */}
      <div className={`shrink-0 flex items-center justify-center gap-4 sm:gap-8 px-2 py-5 sm:py-7 bg-black/50 ${minimized ? 'hidden' : ''}`}>
        {/* Mute */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={toggleMute}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${
              muted ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-xl"
          >
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${
                videoOff ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        {/* Minimize — the grid area hides rather than unmounts, so tracks stay published and
            everyone else in the call keeps hearing/seeing this participant while it's tucked
            into the corner. */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={onMinimize}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-white/70 text-xs">Minimize</span>
        </div>
      </div>
    </div>
  )
}
