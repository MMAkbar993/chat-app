import { useCallback, useEffect, useState } from 'react'

// Non-component pieces shared by the public marketing pages. Kept apart from
// MarketingChrome.jsx so that file exports only components (fast refresh needs that).

// Same dotted/glow treatment as the public profile and group-invite pages.
export const HERO_BG = {
  backgroundImage: 'radial-gradient(rgba(109,40,217,0.08) 1px, transparent 1px), radial-gradient(circle at 15% 10%, rgba(139,92,246,0.10), transparent 45%), radial-gradient(circle at 85% 90%, rgba(139,92,246,0.08), transparent 45%)',
  backgroundSize: '18px 18px, auto, auto',
}

// Keyboard focus that shows on every background these pages use.
export const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500'

// Sets the tab title and meta description while the page is mounted, and puts the previous
// ones back when leaving. A direct visit already gets these from the pre-built HTML; this
// covers arriving by navigating inside the app.
export function usePageMeta(meta) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = meta.title
    let tag = document.querySelector('meta[name="description"]')
    const created = !tag
    if (created) {
      tag = document.createElement('meta')
      tag.name = 'description'
      document.head.appendChild(tag)
    }
    const prevDescription = tag.content
    tag.content = meta.description
    return () => {
      document.title = prevTitle
      if (created) tag.remove()
      else tag.content = prevDescription
    }
  }, [meta])
}

// Client-side navigation keeps the previous page's scroll position and ignores the #hash, so a
// link to "/how-it-works#company" would land wherever the last page was scrolled to. This
// jumps to the hash target if there is one, and to the top otherwise.
export function useScrollOnArrive(hash) {
  useEffect(() => {
    const target = hash ? document.getElementById(hash.slice(1)) : null
    if (target) target.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [hash])
}

// The same key the app uses (ChatPage), so the choice is one setting across Pulse: pick dark in
// the app and these pages open dark, and the other way round. '1' = dark, '0' = light.
const THEME_KEY = 'pulse:darkMode'

function storedTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === '1') return true
    if (v === '0') return false
  } catch { /* storage blocked: fall back to the system setting */ }
  return null
}

// [dark, toggle]. With nothing saved, follows the device's light/dark setting — and keeps
// following it if that changes — until the visitor picks one themselves.
export function useMarketingTheme() {
  const [chosen, setChosen] = useState(storedTheme)
  const [system, setSystem] = useState(
    () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  )

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return undefined
    const onChange = (e) => setSystem(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const dark = chosen ?? system
  const toggle = useCallback(() => {
    const next = !dark
    setChosen(next)
    try { localStorage.setItem(THEME_KEY, next ? '1' : '0') } catch { /* not remembered, still applied */ }
  }, [dark])

  return [dark, toggle]
}
