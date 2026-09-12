import { useCallback, useEffect, useRef, useState } from 'react'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { getRtcToken } from '../api/calls'

// Everything both call surfaces need from Agora, in one place: join, publish, track remote
// users, and the mute / camera / screen-share controls. The 1:1 and group modals differ only
// in how they lay the results out, so keeping the transport here stops the two from drifting.
//
// Agora replaced a hand-rolled WebRTC mesh. The mesh could not survive mobile networks — it had
// no relay, so media never flowed off the local network — and in a group it opened a peer
// connection per participant, which stops scaling at about four people. Agora routes through
// its own SFU, so each client sends its stream once regardless of how many others are present.

// Agora's own logging is extremely chatty; warnings and errors are enough to debug from.
AgoraRTC.setLogLevel(2)

export function useAgoraCall({ callId, isVideo, enabled = true }) {
  // 'idle' | 'connecting' | 'connected' | 'failed'
  const [status, setStatus] = useState('idle')
  const [remoteUsers, setRemoteUsers] = useState([])
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [sharingScreen, setSharingScreen] = useState(false)
  const [speakerOn, setSpeakerOn] = useState(false)
  // Output-device selection is the only thing the web platform exposes for "which speaker" —
  // there is no earpiece/loudspeaker concept. Safari and Firefox don't implement it, so the
  // control has to be able to disable itself rather than silently do nothing.
  const speakerSupported = typeof HTMLMediaElement !== 'undefined'
    && typeof HTMLMediaElement.prototype.setSinkId === 'function'

  // Mirrored into state because the UI renders them: a ref set during an async join does not
  // re-render, so the local preview would appear only if some other state happened to change.
  const [localVideoTrack, setLocalVideoTrack] = useState(null)
  const [localAudioTrack, setLocalAudioTrack] = useState(null)

  const clientRef = useRef(null)
  const micTrackRef = useRef(null)
  const camTrackRef = useRef(null)
  const screenTrackRef = useRef(null)
  // Guards the async join: a modal closed mid-join must not leave a client in the channel.
  const leftRef = useRef(false)

  useEffect(() => {
    if (!enabled || !callId) return undefined
    leftRef.current = false
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    clientRef.current = client

    // Agora hands over a user only after its track is ready to subscribe to, so the modal
    // re-renders once per publish rather than once per connection state change.
    //
    // videoTrack/audioTrack are getters on Agora's prototype, not own properties on the user
    // object — object-spreading a remote user (`{ ...u }`) silently drops both, since spread
    // only copies own enumerable properties. Every remote user reaching React state came out
    // with no video track at all, which is why video never rendered while audio (read from the
    // live object inside onUserPublished, before any copy was made) worked. Read each field
    // explicitly instead, which does invoke the getter.
    const syncUsers = () => setRemoteUsers(client.remoteUsers.map((u) => ({
      uid: u.uid,
      hasAudio: u.hasAudio,
      hasVideo: u.hasVideo,
      audioTrack: u.audioTrack,
      videoTrack: u.videoTrack,
    })))

    const onUserPublished = async (remoteUser, mediaType) => {
      try {
        await client.subscribe(remoteUser, mediaType)
        // Audio plays with no element of its own; video is attached by the component.
        if (mediaType === 'audio') remoteUser.audioTrack?.play()
        syncUsers()
      } catch {
        // A participant who leaves mid-subscribe throws here; their departure event follows.
      }
    }
    const onUserUnpublished = () => syncUsers()
    const onUserLeft = () => syncUsers()

    // Tokens outlive any realistic call, but a long one would otherwise be cut off mid-sentence.
    const onTokenExpiring = async () => {
      try {
        const { token } = await getRtcToken(callId)
        await client.renewToken(token)
      } catch {
        // Nothing useful to do — the call drops at expiry and the UI reports it.
      }
    }

    client.on('user-published', onUserPublished)
    client.on('user-unpublished', onUserUnpublished)
    client.on('user-left', onUserLeft)
    client.on('token-privilege-will-expire', onTokenExpiring)

    ;(async () => {
      try {
        setStatus('connecting')
        const { appId, channel, uid, token } = await getRtcToken(callId)
        if (leftRef.current) return
        await client.join(appId, channel, token, uid)

        // Created after joining so a permission prompt can't hold the channel open.
        const tracks = []
        micTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack()
        tracks.push(micTrackRef.current)
        if (isVideo) {
          camTrackRef.current = await AgoraRTC.createCameraVideoTrack()
          tracks.push(camTrackRef.current)
        }
        if (leftRef.current) return
        setLocalAudioTrack(micTrackRef.current)
        setLocalVideoTrack(camTrackRef.current)
        if (leftRef.current) return
        await client.publish(tracks)
        setStatus('connected')
      } catch (err) {
        console.error('Agora join failed:', err)
        if (!leftRef.current) setStatus('failed')
      }
    })()

    return () => {
      leftRef.current = true
      client.off('user-published', onUserPublished)
      client.off('user-unpublished', onUserUnpublished)
      client.off('user-left', onUserLeft)
      client.off('token-privilege-will-expire', onTokenExpiring)
      setLocalVideoTrack(null)
      setLocalAudioTrack(null)
      ;[micTrackRef, camTrackRef, screenTrackRef].forEach((ref) => {
        ref.current?.stop()
        ref.current?.close()
        ref.current = null
      })
      client.leave().catch(() => {})
    }
  }, [callId, isVideo, enabled])

  const toggleMute = useCallback(async () => {
    const track = micTrackRef.current
    if (!track) return
    const next = !muted
    // setEnabled keeps the track published but stops sending — the other side sees a muted
    // participant rather than one whose audio vanished.
    await track.setEnabled(!next)
    setMuted(next)
  }, [muted])

  const toggleVideo = useCallback(async () => {
    const track = camTrackRef.current
    if (!track) return
    const next = !videoOff
    await track.setEnabled(!next)
    setVideoOff(next)
  }, [videoOff])

  const stopScreenShare = useCallback(async () => {
    const client = clientRef.current
    if (!client || !screenTrackRef.current) return
    try {
      await client.unpublish(screenTrackRef.current)
    } catch { /* already gone */ }
    screenTrackRef.current.stop()
    screenTrackRef.current.close()
    screenTrackRef.current = null
    if (camTrackRef.current) {
      try { await client.publish(camTrackRef.current) } catch { /* ignore */ }
    }
    setLocalVideoTrack(camTrackRef.current)
    setSharingScreen(false)
  }, [])

  const startScreenShare = useCallback(async () => {
    const client = clientRef.current
    if (!client) return
    try {
      const screenTrack = await AgoraRTC.createScreenVideoTrack({ encoderConfig: '1080p_1' })
      // createScreenVideoTrack can return [video, audio] when the user shares tab audio.
      const videoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack
      screenTrackRef.current = videoTrack
      if (camTrackRef.current) {
        try { await client.unpublish(camTrackRef.current) } catch { /* ignore */ }
      }
      await client.publish(videoTrack)
      // Fires when the user stops sharing from the browser's own bar rather than our button.
      videoTrack.on('track-ended', () => { stopScreenShare() })
      setLocalVideoTrack(videoTrack)
      setSharingScreen(true)
    } catch {
      // User dismissed the picker.
    }
  }, [stopScreenShare])

  const toggleSpeaker = useCallback(async () => {
    if (!speakerSupported) return
    try {
      const devices = await AgoraRTC.getPlaybackDevices()
      const next = !speakerOn
      const speaker = devices.find((d) => /speaker/i.test(d.label))
      const deviceId = next ? (speaker?.deviceId || 'default') : 'default'
      // Applies to everyone currently talking, and to anyone who joins later via the
      // subscribe handler reading the same state.
      await Promise.all(
        (clientRef.current?.remoteUsers || [])
          .map((u) => u.audioTrack?.setPlaybackDevice?.(deviceId))
          .filter(Boolean),
      )
      setSpeakerOn(next)
    } catch {
      // Device disappeared or permission withheld — leave the toggle where it was.
    }
  }, [speakerOn, speakerSupported])

  return {
    status,
    remoteUsers,
    speakerOn,
    speakerSupported,
    toggleSpeaker,
    muted,
    videoOff,
    sharingScreen,
    localVideoTrack,
    localAudioTrack,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  }
}

// Attaches an Agora track to a div. Agora renders into a container it manages rather than into
// a <video> element we control, so playback is a side effect keyed on the track.
export function useAgoraVideo(track, ref) {
  useEffect(() => {
    if (!track || !ref.current) return undefined
    track.play(ref.current)
    return () => { try { track.stop() } catch { /* track already closed */ } }
  }, [track, ref])
}
