import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import { playCallConnected, playCallEnded } from '../../utils/sounds'
import { isProUser } from '../../utils/plan'
import { getCallUsage } from '../../api/calls'
import { useAgoraCall, useAgoraVideo } from '../../hooks/useAgoraCall'
import UpgradeModal from '../../features/payment/UpgradeModal'

// Media runs over Agora rather than a direct peer connection. The previous hand-rolled WebRTC
// path had no relay, so on mobile networks — where carrier-grade NAT blocks inbound connections
// — signalling completed and no media ever arrived: the call showed "Connected" with a running
// timer while neither side could see or hear anything. Socket.IO still carries the ringing
// (initiate / accept / reject / end); only the media transport moved.

function RemoteVideo({ track, className }) {
  const ref = useRef(null)
  useAgoraVideo(track, ref)
  return <div ref={ref} className={className} />
}

export default function CallModal({ call, darkMode, isCaller, onEnd, onLimitReached, minimized, onMinimize, onExpand }) {
  const { socket } = useSocket()
  const { user } = useAuth()
  const localVideoRef = useRef(null)
  const startTimeRef = useRef(Date.now())
  const endedRef = useRef(false)

  const [elapsed, setElapsed] = useState(0)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const remainingSecondsRef = useRef(null) // null = unlimited (Pro) or not yet loaded

  const canScreenShare = isProUser(user)
  // No mobile browser actually implements getDisplayMedia in a page context — the button was
  // showing everywhere and just failing silently on phones. Feature-detect rather than sniff
  // the UA, so a platform that does add support one day picks it up automatically.
  const screenShareSupported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getDisplayMedia)

  const callId = call.id || call.callId
  const targetUserId = isCaller ? call.calleeId || call.callee_id : call.callerId || call.caller_id
  const isVideo = call.callType === 'video' || call.call_type === 'video'
  const remoteName = isCaller
    ? call.calleeName || call.callerName || 'Call'
    : call.callerName || call.calleeName || 'Call'
  const remoteAvatar = isCaller
    ? call.calleeAvatar || call.callerAvatar
    : call.callerAvatar || call.calleeAvatar

  const {
    status: agoraStatus, remoteUsers, muted, videoOff, sharingScreen,
    localVideoTrack, toggleMute, toggleVideo, startScreenShare, stopScreenShare,
    speakerOn, speakerSupported, toggleSpeaker,
  } = useAgoraCall({ callId, isVideo })

  // The caller sits in "Calling..." until the callee actually joins the channel — Agora
  // reports us connected the moment we publish, which is before anyone is listening.
  const someoneElseHere = remoteUsers.length > 0
  const status =
    agoraStatus === 'failed' ? 'failed'
    : someoneElseHere ? 'connected'
    : agoraStatus === 'connected' ? (isCaller ? 'calling' : 'connecting')
    : agoraStatus

  const remoteVideoTrack = remoteUsers.find((u) => u.videoTrack)?.videoTrack || null

  useAgoraVideo(localVideoTrack, localVideoRef)

  useEffect(() => {
    if (isProUser(user)) return
    getCallUsage()
      .then((usage) => { remainingSecondsRef.current = usage.remainingSeconds })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let timer
    if (status === 'connected') {
      playCallConnected()
      timer = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1
          const limit = remainingSecondsRef.current
          if (limit != null && next >= limit && !endedRef.current) {
            onLimitReached?.()
            endCall(true)
          }
          return next
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [status])

  useEffect(() => {
    if (!socket) return
    const onEnded = () => endCall(false)
    socket.on('call-ended', onEnded)
    socket.on('call-rejected', onEnded)
    return () => {
      socket.off('call-ended', onEnded)
      socket.off('call-rejected', onEnded)
    }
  }, [socket])

  function endCall(emitEnd = true) {
    if (endedRef.current) return
    endedRef.current = true
    playCallEnded()
    if (emitEnd) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
      socket?.emit('call-end', { callId, targetUserId, durationSeconds: duration })
    }
    // Agora tracks and the channel are released by the hook's own cleanup on unmount.
    onEnd?.()
  }

  function handleScreenShare() {
    if (!canScreenShare) {
      setShowUpgrade(true)
      return
    }
    if (sharingScreen) stopScreenShare()
    else startScreenShare()
  }

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const statusLabel =
    status === 'connected' ? formatTime(elapsed)
    : status === 'calling' ? 'Calling...'
    : status === 'failed' ? "Couldn't connect — check your network"
    : 'Connecting...'

  return (
    <div className={
      minimized
        ? 'fixed bottom-4 right-4 z-50 w-64 h-40 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/20 bg-gray-900'
        : 'fixed inset-0 z-50 overflow-hidden bg-gray-900'
    }>

      {/* Background — remote video (video call) or gradient (audio call). Agora renders into a
          container it owns, so this is a div rather than a <video> we control. Always rendered
          regardless of minimized: the outer box just shrinks around it, so there's no unmount
          for the track to survive. */}
      {isVideo ? (
        <RemoteVideo track={remoteVideoTrack} className="absolute inset-0 w-full h-full [&_video]:object-cover" />
      ) : (
        <div className="absolute inset-0 bg-linear-to-b from-violet-900 via-gray-900 to-gray-900" />
      )}

      {/* Top bar — full name/status overlay, or a compact name+expand strip when minimized */}
      {minimized ? (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between gap-2 px-2.5 py-2 bg-linear-to-b from-black/70 to-transparent">
          <p className="text-white text-xs font-semibold truncate">{remoteName}</p>
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
      ) : (
        <div className="absolute top-0 left-0 right-0 px-6 pt-10 pb-20 bg-linear-to-b from-black/70 to-transparent pointer-events-none">
          <p className="text-white font-bold text-xl">{remoteName}</p>
          <p className="text-white/60 text-sm mt-1">{statusLabel}</p>
        </div>
      )}

      {/* Audio call — centered avatar, full size only; minimized shows a small avatar instead */}
      {!isVideo && !minimized && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 pb-32">
          <div className="w-32 h-32 rounded-full bg-violet-600 flex items-center justify-center text-white text-5xl font-bold overflow-hidden ring-4 ring-violet-400/40 shadow-2xl">
            {remoteAvatar
              ? <img src={remoteAvatar} alt="" className="w-full h-full object-cover" />
              : (remoteName || '?')[0].toUpperCase()
            }
          </div>
          <div className="text-center">
            <p className="text-white text-2xl font-bold">{remoteName}</p>
            <p className="text-white/60 text-sm mt-1">{statusLabel}</p>
          </div>
        </div>
      )}
      {!isVideo && minimized && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-violet-600 flex items-center justify-center text-white text-base font-bold overflow-hidden">
            {remoteAvatar
              ? <img src={remoteAvatar} alt="" className="w-full h-full object-cover" />
              : (remoteName || '?')[0].toUpperCase()
            }
          </div>
        </div>
      )}

      {/* Local PiP — video call. Hidden rather than unmounted when minimized: the div's ref is
          owned by this component (via useAgoraVideo above), so removing it from the tree would
          mean the track never gets reattached to a new node when the call is expanded again. */}
      {isVideo && (
        <div className={`absolute top-20 right-4 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-800 ${minimized ? 'hidden' : ''}`}>
          <div ref={localVideoRef} className="w-full h-full [&_video]:object-cover" />
        </div>
      )}

      {/* Bottom controls — compact bar when minimized, full row otherwise */}
      {minimized ? (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 py-2 bg-linear-to-t from-black/80 to-transparent">
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
            onClick={() => endCall(true)}
            className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      ) : (
      <div className="absolute bottom-0 left-0 right-0 pt-20 pb-12 bg-linear-to-t from-black/80 to-transparent">
        {/* Responsive gap/size: at 5 buttons (video + screen share) this row is the widest
            thing on the screen, and the fixed gap-8/w-14 combination ran off the edge of a
            phone viewport — the reported "Minimize" getting clipped. */}
        <div className="flex items-end justify-center gap-4 sm:gap-8 px-2">

          {/* Mute */}
          <div className="flex flex-col items-center gap-2">
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

          {/* End call */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => endCall(true)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-xl"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </button>
            <span className="text-white/70 text-xs">End</span>
          </div>

          {/* Camera toggle — video calls only */}
          {isVideo && (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={toggleVideo}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${
                  videoOff ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <span className="text-white/70 text-xs">{videoOff ? 'Start Cam' : 'Stop Cam'}</span>
            </div>
          )}

          {/* Screen share (video calls only, and only where the browser can actually do it —
              phones get no button rather than one that fails silently when tapped) */}
          {isVideo && screenShareSupported && (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleScreenShare}
                title={canScreenShare ? undefined : 'Upgrade to Pro to share your screen'}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors relative ${
                  sharingScreen ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {!canScreenShare && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-gray-900 text-[9px] font-bold flex items-center justify-center">★</span>
                )}
              </button>
              <span className="text-white/70 text-xs">{sharingScreen ? 'Stop Share' : 'Share Screen'}</span>
            </div>
          )}

          {/* Speaker — audio calls only */}
          {!isVideo && (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={toggleSpeaker}
                disabled={!speakerSupported}
                title={speakerSupported ? undefined : "Not supported by this browser — audio output can't be switched from the page."}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  speakerOn ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              </button>
              <span className="text-white/70 text-xs">Speaker</span>
            </div>
          )}

          {/* Minimize — lets the caller browse other chats without losing the call. Tracks and
              the channel keep running regardless of which layout above is rendered. */}
          <div className="flex flex-col items-center gap-2">
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
      )}

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  )
}
