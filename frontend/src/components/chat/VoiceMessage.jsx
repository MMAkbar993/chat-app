import { useEffect, useRef, useState } from 'react'

// A voice note used to render as a bare <audio controls>, which every browser skins itself —
// Chrome's wide grey bar and Safari's narrower one looked like two different products, and
// Safari's showed a blank "Error" for formats it can't decode with no indication why. This is
// the same control everywhere, and says something useful when a file genuinely won't play.

function fmt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function VoiceMessage({ src, isMe, darkMode }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = audioRef.current
    if (!el) return undefined

    const onTime = () => setCurrent(el.currentTime)
    // A stream recorded by MediaRecorder often reports Infinity until it has been seeked once,
    // so fall back to whatever becomes known later rather than rendering "Infinity:NaN".
    const onMeta = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0)
    const onEnd = () => { setPlaying(false); setCurrent(0) }
    const onErr = () => { setFailed(true); setPlaying(false) }

    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('durationchange', onMeta)
    el.addEventListener('ended', onEnd)
    el.addEventListener('error', onErr)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('durationchange', onMeta)
      el.removeEventListener('ended', onEnd)
      el.removeEventListener('error', onErr)
    }
  }, [src])

  async function toggle() {
    const el = audioRef.current
    if (!el || failed) return
    if (playing) {
      el.pause()
      setPlaying(false)
      return
    }
    try {
      await el.play()
      setPlaying(true)
    } catch {
      // Autoplay policy or an undecodable file — the error handler above covers the latter.
      setFailed(true)
    }
  }

  function seek(e) {
    const el = audioRef.current
    if (!el || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)
    el.currentTime = ratio * duration
    setCurrent(el.currentTime)
  }

  const pct = duration ? Math.min((current / duration) * 100, 100) : 0
  const accent = isMe ? 'bg-white' : 'bg-violet-500'
  const track = isMe ? 'bg-white/30' : darkMode ? 'bg-gray-600' : 'bg-gray-200'
  const label = isMe ? 'text-white/80' : darkMode ? 'text-gray-300' : 'text-gray-500'
  const btn = isMe
    ? 'bg-white text-violet-600 hover:bg-white/90'
    : 'bg-violet-500 text-white hover:bg-violet-600'

  if (failed) {
    return (
      <div className={`flex items-center gap-2 text-xs ${label}`}>
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          This voice note can&apos;t play in this browser.{' '}
          <a href={src} download className="underline">Download</a>
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5 min-w-52">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause voice message' : 'Play voice message'}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${btn}`}
      >
        {playing ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div
          onClick={seek}
          className={`h-1.5 rounded-full cursor-pointer ${track}`}
        >
          <div className={`h-full rounded-full ${accent}`} style={{ width: `${pct}%` }} />
        </div>
        <p className={`text-[11px] mt-1 tabular-nums ${label}`}>
          {fmt(current)}{duration ? ` / ${fmt(duration)}` : ''}
        </p>
      </div>
    </div>
  )
}
