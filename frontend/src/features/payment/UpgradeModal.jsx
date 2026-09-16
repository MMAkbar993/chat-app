import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import PaymentModal from './PaymentModal'
import { useAuth } from '../../context/AuthContext'
import { isProUser } from '../../utils/plan'

const TIERS = [
  { key: 'free', label: 'Free' },
  { key: 'pro', label: 'Pro' },
]

const PRICE = {
  pro: { monthly: '€6.99', yearly: '€70.00' },
}

// A colourful icon per row — Telegram's own Premium screen never repeats one flat colour down
// the whole list, and that variety is most of what separates "premium" from "a plain settings
// page." Cycled by a running index across every section (not reset per section), so adding a
// feature later doesn't require picking a colour for it and colours don't repeat right next
// to each other at a section boundary.
const ICON_COLORS = [
  'from-sky-500 to-blue-600',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-violet-500 to-purple-600',
  'from-fuchsia-500 to-pink-600',
]

// Grouped into named sections rather than one long flat list — Telegram's own settings-style
// screens read as organised specifically because related things sit under a label together,
// not because of anything about the individual rows.
const FEATURES = {
  free: [
    { section: null, items: [
      { title: 'Chat', desc: 'Stay connected with verified industry professionals in real time.',
        path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
      { title: 'Contacts', desc: 'Build your professional network and manage your connections.',
        path: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-14a4 4 0 010 7.75M9 7a4 4 0 118 0 4 4 0 01-8 0z' },
      { title: 'Audio Calls', desc: 'Enjoy up to 30 minutes of secure voice calls every month.',
        path: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
      { title: 'Video Calls', desc: 'Enjoy up to 30 minutes of secure video calls every month.',
        path: 'M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
      { title: 'File Sharing', desc: 'Share documents and media with generous free storage limits.',
        path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ] },
  ],
  pro: [
    { section: 'Calls & Screen Sharing', items: [
      { title: 'Unlimited Audio Calls', desc: 'Talk without limits with unlimited high-quality voice calls.',
        path: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
      { title: 'Unlimited Video Calls', desc: 'Host meetings and collaborate with unlimited video calls.',
        path: 'M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
      { title: 'Screen Sharing', desc: 'Share your screen on a call to walk a partner through a deck, dashboard or demo live.',
        path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    ] },
    { section: 'Discovery & Networking', items: [
      { title: 'Search by Business Name', desc: 'Find people by the company or brand they work for, not just their username.',
        path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
      { title: 'Requests Marketplace', badge: 'Coming soon', desc: 'Post business requests and discover new partnership opportunities.',
        path: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z' },
    ] },
    { section: 'Groups & Files', items: [
      { title: 'Groups', desc: 'Create private groups for your team, partners, or projects.',
        path: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-14a4 4 0 010 7.75M9 7a4 4 0 118 0 4 4 0 01-8 0z' },
      { title: 'Google Calendar Integration', desc: 'Keep meetings and events synced directly with your calendar.',
        path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { title: 'Unlimited File Sharing', desc: 'Store and share files without worrying about storage limits.',
        path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ] },
  ],
}

// How much cheaper the annual price is per month, as a whole-percentage badge next to it —
// the kind of "you're saving X%" callout Telegram and most subscription screens lead with,
// computed from the actual prices rather than a hand-typed number that can drift out of sync.
function yearlySavingsPct(monthly, yearly) {
  const m = Number.parseFloat(monthly.replace(/[^0-9.]/g, ''))
  const y = Number.parseFloat(yearly.replace(/[^0-9.]/g, ''))
  if (!m || !y) return null
  const pct = Math.round((1 - y / (m * 12)) * 100)
  return pct > 0 ? pct : null
}

export default function UpgradeModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const [tab, setTab] = useState('pro')
  const [showPayment, setShowPayment] = useState(false)
  const alreadyOnThisTab = tab === 'free' ? !isProUser(user) : isProUser(user)
  const savingsPct = yearlySavingsPct(PRICE.pro.monthly, PRICE.pro.yearly)

  function handleClose() {
    setTab('pro')
    onClose()
  }

  if (showPayment) {
    return (
      <PaymentModal
        isOpen={isOpen}
        standalone
        onClose={() => { setShowPayment(false); handleClose() }}
      />
    )
  }

  // A running counter across every section's items, so colours keep cycling smoothly across
  // section boundaries instead of every section restarting at the same first colour.
  let colorIndex = -1

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
      {/* Everything above and below the feature list is fixed — only the list itself scrolls,
          the way Telegram's own Premium screen keeps its header and Subscribe button in place
          while you scroll through what you're getting. Capped to 85vh so it still fits a short
          screen instead of running off it; min-h-0 on the scrolling section is what actually
          lets a flex child shrink and scroll instead of just growing to fit its content. */}
      {/* rounded-2xl + overflow-hidden here (not just on the hero's own rounded-t-2xl):
          Modal's shell has no overflow-hidden of its own, so without this the footer's plain
          rectangular bottom edge would poke out past the shell's rounded bottom corners. */}
      <div className="flex flex-col max-h-[85vh] rounded-2xl overflow-hidden">
        {/* Hero — a true multi-stop diagonal gradient plus a soft glow behind the badge, rather
            than a flat two-colour gradient. This is most of what read as "cartoonish" before:
            one saturated colour band with a plain icon on it, versus something with actual
            depth to it. Swap for a video/animation later if wanted. */}
        <div className="shrink-0 relative flex flex-col items-center pt-10 pb-7 px-6 rounded-t-2xl overflow-hidden bg-linear-to-br from-sky-500 via-violet-500 to-fuchsia-500">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-16 -right-10 w-48 h-48 rounded-full bg-fuchsia-400/30 blur-3xl" />
          <div className="relative w-18 h-18 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-lg ring-1 ring-white/40">
            <svg className="w-10 h-10 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" />
            </svg>
          </div>
          <h2 className="relative text-white text-xl font-bold tracking-tight">Upgrade Your Plan</h2>
          <p className="relative text-white/85 text-sm mt-1 text-center">Unlock more of what Pulse can do for you.</p>
        </div>

        {/* Tier switcher — one pill track with a solid indicator behind whichever tab is active,
            instead of one button-styled tab next to one plain-text tab (the two read as
            different weight before, like only one of them was a real control). */}
        <div className="shrink-0 px-5 pt-4">
          <div className="relative flex p-1 rounded-xl bg-gray-100">
            <div
              className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-transform duration-200"
              style={{ transform: tab === 'pro' ? 'translateX(calc(100% + 8px))' : 'translateX(0)' }}
            />
            {TIERS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tab === t.key ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature list — the only scrolling region */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-5">
          {FEATURES[tab].map((group) => (
            <div key={group.section || 'ungrouped'}>
              {group.section && (
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">{group.section}</p>
              )}
              <div className="space-y-4">
                {group.items.map((f) => {
                  colorIndex++
                  return (
                    <div key={f.title} className="flex items-start gap-3">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-linear-to-br shadow-sm ${ICON_COLORS[colorIndex % ICON_COLORS.length]}`}>
                        <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.path} />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                          {f.badge && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                              {f.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA — fixed below the scroll area, with a top border so it reads as sitting
            over the list rather than floating disconnected from it. */}
        <div className="shrink-0 px-5 pt-3 pb-6 border-t border-gray-100">
          {tab === 'free' ? (
            <div className="text-center text-sm text-gray-400 py-2.5">
              {isProUser(user) ? 'To downgrade, manage your subscription from Billing.' : 'This is your current plan.'}
            </div>
          ) : alreadyOnThisTab ? (
            <div className="text-center text-sm text-gray-400 py-2.5">This is your current plan.</div>
          ) : (
            <>
              <div className="flex items-baseline justify-center gap-1.5 mb-1">
                <span className="text-3xl font-bold text-gray-900 tracking-tight">{PRICE.pro.monthly}</span>
                <span className="text-sm text-gray-500">/month</span>
              </div>
              <p className="text-center text-xs text-gray-400 mb-3">
                or {PRICE.pro.yearly}/year
                {savingsPct && (
                  <span className="ml-1.5 text-emerald-600 font-semibold">— save {savingsPct}%</span>
                )}
              </p>
              <button
                onClick={() => setShowPayment(true)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-md bg-linear-to-br from-sky-500 via-violet-500 to-fuchsia-500"
              >
                Upgrade to Pro
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">Auto-renewal. Cancel anytime.</p>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
