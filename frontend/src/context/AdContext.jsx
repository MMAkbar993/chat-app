import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getCurrentAd, trackAdClick, dismissAdApi } from '../api/ads'

const AdContext = createContext({ ad: null, canHide: false, dismiss: () => {}, click: () => {} })

// One fetch feeds both placements. The sidebar card and the chat-list row are never visible
// at the same time (one is desktop-only, the other mobile-only), but they mount together, so
// sharing the state here keeps a single ad from being requested — and counted — twice.
export function AdProvider({ children }) {
  const { user } = useAuth()
  const [ad, setAd] = useState(null)
  // Whether this account may dismiss an ad. Comes from the server, not from reading the
  // plan client-side, so the UI and the endpoint agree on who gets the option.
  const [canHide, setCanHide] = useState(false)
  // Bumped to pull a fresh ad into the slot after one is dismissed.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    getCurrentAd()
      .then((d) => { if (!cancelled) { setAd(d.ad || null); setCanHide(!!d.canHide) } })
      .catch(() => { if (!cancelled) setAd(null) })
    return () => { cancelled = true }
  }, [user, reloadKey])

  const dismiss = useCallback(() => {
    if (!ad) return
    const id = ad.id
    setAd(null)
    // Rotate a different ad into the slot rather than leaving it empty — the advertiser
    // keeps their inventory and the user still gets rid of the one they dismissed.
    dismissAdApi(id)
      .catch(() => {})
      .finally(() => setReloadKey((k) => k + 1))
  }, [ad])

  const click = useCallback(() => {
    if (ad) trackAdClick(ad.id).catch(() => {})
  }, [ad])

  return <AdContext.Provider value={{ ad, canHide, dismiss, click }}>{children}</AdContext.Provider>
}

export function useAd() {
  return useContext(AdContext)
}
