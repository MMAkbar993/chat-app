import { useState, useRef, useEffect } from 'react'
import { useAd } from '../../context/AdContext'
import UpgradeModal from '../../features/payment/UpgradeModal'

// Dismissing hides this one ad for a week and rotates another in. A time-limited "mute all
// ads" was considered and dropped: people don't think in hours, and an ad-free state that
// silently expires reads as nagging. Upgrading is the permanent answer, so it lives here.
// What Pro buys here is control, not absence: everyone sees ads, but only a Pro account can
// hide one for a week. A Free account gets the upsell in the same place the option would be,
// so the benefit is discoverable at the exact moment someone wants it.
function DismissMenu({ darkMode, canHide, onDismiss, onUpgrade, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    function onDown(e) { if (!ref.current?.contains(e.target)) onClose() }
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const item = `w-full text-left px-3 py-2.5 text-xs transition-colors ${
    darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
  }`

  return (
    <div
      ref={ref}
      className={`absolute right-0 top-6 z-30 w-52 rounded-lg border shadow-lg overflow-hidden ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}
    >
      {canHide ? (
        <button type="button" className={item} onClick={() => { onDismiss(); onClose() }}>
          Hide this ad for 7 days
        </button>
      ) : (
        <button
          type="button"
          className={`${item} font-semibold flex items-center gap-1.5 ${darkMode ? 'text-amber-300' : 'text-amber-600'}`}
          onClick={() => { onUpgrade?.(); onClose() }}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" />
          </svg>
          Upgrade to Pro to hide ads
        </button>
      )}
    </div>
  )
}

function DismissButton({ darkMode, onUpgrade }) {
  const { dismiss, canHide } = useAd()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="Ad options"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v) }}
        className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
          darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {open && (
        <DismissMenu
          darkMode={darkMode}
          canHide={canHide}
          onDismiss={dismiss}
          onUpgrade={onUpgrade}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

function SponsoredChip({ darkMode }) {
  return (
    <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
      darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
    }`}>
      Sponsored
    </span>
  )
}

// Advertiser links leave the platform, so they get noopener/noreferrer like any other
// outbound link — the destination learns nothing about where the click came from.
const LINK_REL = 'noopener noreferrer sponsored'

/**
 * Desktop sidebar card. Sits above the Notifications / Dark Mode block, visually separate
 * from the navigation so it reads as sponsorship rather than another menu item.
 */
export function SponsoredSidebarCard({ darkMode, collapsed, onUpgrade }) {
  const { ad, click } = useAd()
  if (!ad) return null

  // Collapsed rail is 80px wide — a title and body won't fit, so fall back to the logo alone.
  if (collapsed) {
    return (
      <a
        href={ad.link_url}
        target="_blank"
        rel={LINK_REL}
        onClick={click}
        title={`${ad.title} (Sponsored)`}
        className={`block mx-auto w-11 h-11 rounded-xl overflow-hidden border transition-colors ${
          darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {ad.image_url
          ? <img src={ad.image_url} alt="" className="w-full h-full object-cover" />
          : <span className={`w-full h-full flex items-center justify-center text-sm font-bold ${
              darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
            }`}>{ad.title[0]?.toUpperCase()}</span>}
      </a>
    )
  }

  // A soft dot texture so the card reads as a placed unit rather than an empty panel —
  // the flat tint left the block looking like unused space.
  const texture = darkMode
    ? 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)'
    : 'radial-gradient(rgba(109,40,217,0.07) 1px, transparent 1px)'

  return (
    <div
      className={`relative rounded-lg border px-3 pt-4 pb-3.5 text-center overflow-hidden ${
        darkMode ? 'border-gray-700 bg-gray-800/70' : 'border-violet-100 bg-violet-50/60'
      }`}
      style={{ backgroundImage: texture, backgroundSize: '10px 10px' }}
    >
      <div className="absolute right-2 top-2">
        <DismissButton darkMode={darkMode} onUpgrade={onUpgrade} />
      </div>

      {ad.image_url && (
        <img
          src={ad.image_url}
          alt=""
          className={`w-14 h-14 rounded-xl object-cover mx-auto mb-2.5 border ${
            darkMode ? 'border-gray-700' : 'border-white'
          }`}
        />
      )}

      <p className={`text-sm font-bold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {ad.title}
      </p>

      {ad.body && (
        <p className={`text-xs leading-snug mt-1 line-clamp-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {ad.body}
        </p>
      )}

      <a
        href={ad.link_url}
        target="_blank"
        rel={LINK_REL}
        onClick={click}
        className={`inline-flex items-center justify-center gap-1 text-xs font-bold mt-2.5 ${
          darkMode ? 'text-violet-300 hover:text-violet-200' : 'text-violet-600 hover:text-violet-700'
        }`}
      >
        {ad.link_text}
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </div>
  )
}

/**
 * Mobile chat-list placement. Deliberately NOT styled as a conversation row: square logo
 * instead of a circular avatar, its own tinted background, a Sponsored chip, and no
 * timestamp. On a platform whose whole pitch is that you can trust who is in your chat
 * list, an advertiser dressed as a message would undercut the product — and accidental
 * taps would inflate the click numbers we invoice against.
 */
export function SponsoredChatRow({ darkMode }) {
  const { ad, click } = useAd()
  // The sidebar card borrows the upgrade modal already mounted next to it; the chat list
  // has none, so this placement carries its own — otherwise "Remove ads" would be offered
  // on desktop only, which is where the ad matters least.
  const [showUpgrade, setShowUpgrade] = useState(false)
  if (!ad) return null

  return (
    <div
      className={`relative md:hidden mx-4 mb-2 rounded-2xl border border-dashed ${
        darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-violet-200 bg-violet-50/60'
      }`}
    >
      <a
        href={ad.link_url}
        target="_blank"
        rel={LINK_REL}
        onClick={click}
        className="flex items-center gap-3 px-4 py-3.5"
      >
        {ad.image_url
          ? <img src={ad.image_url} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
          : <span className={`w-11 h-11 rounded-lg shrink-0 flex items-center justify-center font-bold ${
              darkMode ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-500'
            }`}>{ad.title[0]?.toUpperCase()}</span>}

        <div className="flex-1 min-w-0 pr-5">
          <div className="flex items-center gap-2">
            <span className={`font-semibold text-base truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {ad.title}
            </span>
            <SponsoredChip darkMode={darkMode} />
          </div>
          {ad.body && (
            <p className={`text-sm truncate mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{ad.body}</p>
          )}
          <span className={`inline-flex items-center gap-1 text-sm font-semibold mt-1 ${
            darkMode ? 'text-violet-300' : 'text-violet-600'
          }`}>
            {ad.link_text}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </div>
      </a>
      <div className="absolute right-3 top-3">
        <DismissButton darkMode={darkMode} onUpgrade={() => setShowUpgrade(true)} />
      </div>
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  )
}
