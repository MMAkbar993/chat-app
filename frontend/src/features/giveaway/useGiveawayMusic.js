import { useCallback, useEffect, useRef, useState } from 'react'

// Background music for the giveaway page. Browsers block sound until the visitor interacts, so it
// starts on their first tap or click anywhere on the page, unless they muted it on an earlier
// visit. Until the music file is in place (public/christmas/music.mp3) the button stays hidden.
const SRC = '/christmas/music.mp3'
const MUTE_KEY = 'pulse_xmas_muted'

function readMuted() {
  try { return localStorage.getItem(MUTE_KEY) === '1' } catch { return false }
}

export function useGiveawayMusic() {
  const audio = useRef(null)
  const [available, setAvailable] = useState(false)
  const [muted, setMuted] = useState(readMuted)
  const [playing, setPlaying] = useState(false)
  const mutedRef = useRef(muted)
  useEffect(() => { mutedRef.current = muted }, [muted])

  useEffect(() => {
    const a = new Audio()
    a.loop = true
    a.volume = 0.35
    a.preload = 'auto'
    const onReady = () => setAvailable(true)
    const onError = () => setAvailable(false)
    a.addEventListener('canplaythrough', onReady)
    a.addEventListener('error', onError)
    a.src = SRC
    audio.current = a

    const start = () => {
      if (mutedRef.current || !a.src) return
      a.play().then(() => setPlaying(true)).catch(() => {})
    }
    window.addEventListener('pointerdown', start, { once: true })
    return () => {
      window.removeEventListener('pointerdown', start)
      a.removeEventListener('canplaythrough', onReady)
      a.removeEventListener('error', onError)
      a.pause()
      a.src = ''
    }
  }, [])

  const toggle = useCallback(() => {
    const a = audio.current
    if (!a) return
    const next = !mutedRef.current
    setMuted(next)
    try { localStorage.setItem(MUTE_KEY, next ? '1' : '0') } catch { /* storage unavailable */ }
    if (next) {
      a.pause()
      setPlaying(false)
    } else {
      a.play().then(() => setPlaying(true)).catch(() => {})
    }
  }, [])

  return { available, muted, playing, toggle }
}
