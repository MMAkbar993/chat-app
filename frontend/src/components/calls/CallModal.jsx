import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../../context/SocketContext'
import { playCallConnected, playCallEnded } from '../../utils/sounds'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export default function CallModal({ call, darkMode, isCaller, onEnd }) {
  const { socket } = useSocket()
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const startTimeRef = useRef(Date.now())
  const pendingOfferRef = useRef(null)
  const pendingCandidatesRef = useRef([])
  const endedRef = useRef(false)

  const [status, setStatus] = useState(isCaller ? 'calling' : 'connecting')
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [speakerOn, setSpeakerOn] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const targetUserId = isCaller ? call.calleeId || call.callee_id : call.callerId || call.caller_id
  const isVideo = call.callType === 'video' || call.call_type === 'video'
  const remoteName = isCaller
    ? call.calleeName || call.callerName || 'Call'
    : call.callerName || call.calleeName || 'Call'
  const remoteAvatar = isCaller
    ? call.calleeAvatar || call.callerAvatar
    : call.callerAvatar || call.calleeAvatar

  useEffect(() => {
    let timer
    if (status === 'connected') {
      playCallConnected()
      timer = setInterval(() => setElapsed((e) => e + 1), 1000)
    }
    return () => clearInterval(timer)
  }, [status])

  useEffect(() => {
    startCall()
    return () => cleanup()
  }, [])

  async function handleOffer(offer) {
    if (!pcRef.current) return
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer))
    for (const c of pendingCandidatesRef.current) {
      try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)) } catch {}
    }
    pendingCandidatesRef.current = []
    const answer = await pcRef.current.createAnswer()
    await pcRef.current.setLocalDescription(answer)
    socket?.emit('webrtc-answer', { callId: call.id || call.callId, targetUserId, answer })
  }

  async function startCall() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true })
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      const pc = new RTCPeerConnection(ICE_SERVERS)
      pcRef.current = pc

      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      pc.ontrack = (e) => {
        const remoteStream = e.streams[0]
        if (isVideo && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        } else if (!isVideo && remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream
        }
        setStatus('connected')
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket?.emit('webrtc-ice-candidate', { callId: call.id || call.callId, targetUserId, candidate: e.candidate })
        }
      }

      if (isCaller) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket?.emit('webrtc-offer', { callId: call.id || call.callId, targetUserId, offer })
      } else if (pendingOfferRef.current) {
        // Offer arrived before PC was ready — process it now
        const buffered = pendingOfferRef.current
        pendingOfferRef.current = null
        await handleOffer(buffered)
      }
    } catch (err) {
      console.error('startCall error:', err)
      setStatus('error')
    }
  }

  useEffect(() => {
    if (!socket) return

    const onOffer = async ({ offer }) => {
      if (!pcRef.current) {
        pendingOfferRef.current = offer
        return
      }
      await handleOffer(offer)
    }

    const onAnswer = async ({ answer }) => {
      if (!pcRef.current) return
      if (pcRef.current.signalingState !== 'have-local-offer') return
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer))
    }

    const onIce = async ({ candidate }) => {
      if (!candidate) return
      if (!pcRef.current?.remoteDescription) {
        pendingCandidatesRef.current.push(candidate)
        return
      }
      try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
    }

    const onEnded = () => endCall(false)

    socket.on('webrtc-offer', onOffer)
    socket.on('webrtc-answer', onAnswer)
    socket.on('webrtc-ice-candidate', onIce)
    socket.on('call-ended', onEnded)
    socket.on('call-rejected', onEnded)

    return () => {
      socket.off('webrtc-offer', onOffer)
      socket.off('webrtc-answer', onAnswer)
      socket.off('webrtc-ice-candidate', onIce)
      socket.off('call-ended', onEnded)
      socket.off('call-rejected', onEnded)
    }
  }, [socket])

  function cleanup() {
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    pcRef.current?.close()
  }

  function endCall(emitEnd = true) {
    if (endedRef.current) return
    endedRef.current = true
    playCallEnded()
    if (emitEnd) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
      socket?.emit('call-end', { callId: call.id || call.callId, targetUserId, durationSeconds: duration })
    }
    cleanup()
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

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const statusLabel =
    status === 'connected' ? formatTime(elapsed)
    : status === 'calling' ? 'Calling...'
    : 'Connecting...'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gray-900">

      {/* Remote audio for audio calls */}
      {!isVideo && <audio ref={remoteAudioRef} autoPlay />}

      {/* Background — remote video (video call) or gradient (audio call) */}
      {isVideo ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-b from-violet-900 via-gray-900 to-gray-900" />
      )}

      {/* Top overlay — name + status */}
      <div className="absolute top-0 left-0 right-0 px-6 pt-10 pb-20 bg-linear-to-b from-black/70 to-transparent pointer-events-none">
        <p className="text-white font-bold text-xl">{remoteName}</p>
        <p className="text-white/60 text-sm mt-1">{statusLabel}</p>
      </div>

      {/* Audio call — centered avatar */}
      {!isVideo && (
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

      {/* Local PiP — video call */}
      {isVideo && (
        <div className="absolute top-20 right-4 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        </div>
      )}

      {/* Bottom controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 pt-20 pb-12 bg-linear-to-t from-black/80 to-transparent">
        <div className="flex items-end justify-center gap-8">

          {/* Mute */}
          <div className="flex flex-col items-center gap-2">
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

          {/* End call */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => endCall(true)}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-xl"
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </button>
            <span className="text-white/70 text-xs">End</span>
          </div>

          {/* Camera toggle (video) / Speaker (audio) */}
          {isVideo ? (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  videoOff ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <span className="text-white/70 text-xs">{videoOff ? 'Start Cam' : 'Stop Cam'}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setSpeakerOn((s) => !s)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  speakerOn ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-4-4m4 4l4-4M9.172 16.828A4 4 0 016 13.5V10.5a4 4 0 013.172-3.328" />
                </svg>
              </button>
              <span className="text-white/70 text-xs">Speaker</span>
            </div>
          )}

        </div>
      </div>

      {/* Hidden local video element needed for track setup even on audio calls */}
      {!isVideo && <video ref={localVideoRef} autoPlay muted playsInline className="hidden" />}
    </div>
  )
}
