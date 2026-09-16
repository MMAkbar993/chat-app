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
      { title: 'Audio Calls', desc: 'Up to 30 minutes of secure voice calls every month.',
        path: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
      { title: 'Video Calls', desc: 'Up to 30 minutes of secure video calls every month.',
        path: 'M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
      { title: 'File Sharing', desc: 'Share documents and media with generous free storage limits.',
        path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ] },
  ],
  pro: [
    { section: 'Calls & Screen Sharing', items: [
      { title: 'Unlimited Audio Calls', desc: 'Talk without limits on high-quality voice calls.',
        path: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
      { title: 'Unlimited Video Calls', desc: 'Host meetings and collaborate with no time limits.',
        path: 'M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
      { title: 'Screen Sharing', desc: 'Walk a partner through a deck, dashboard or demo live.',
        path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    ] },
    { section: 'Discovery & Networking', items: [
      { title: 'Search by Business Name', desc: 'Find people by the company they work for, not just a username.',
        path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
      { title: 'Requests Marketplace', badge: 'Soon', desc: 'Post business requests and discover new partnerships.',
        path: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z' },
    ] },
    { section: 'Groups & Files', items: [
      { title: 'Groups', desc: 'Create private groups for your team, partners or projects.',
        path: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-14a4 4 0 010 7.75M9 7a4 4 0 118 0 4 4 0 01-8 0z' },
      { title: 'Google Calendar', desc: 'Keep meetings and events synced with your calendar.',
        path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { title: 'Unlimited File Sharing', desc: 'Store and share files without worrying about limits.',
        path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ] },
  ],
}

// How much cheaper the annual price is per month — computed from the actual prices rather than
// a hand-typed number that can drift out of sync with them.
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
      {/* A definite height, not just a max-height. Modal's own shell has no height, so with
          only a cap here the fixed hero/switcher/footer claimed their full size and the one
          shrinkable child — the feature list — collapsed to whatever few pixels were left.
          Fixed height first, capped to the viewport second, keeps the list a real panel.
          rounded-2xl + overflow-hidden because Modal's shell has no overflow-hidden of its
          own, so otherwise the footer's square corners poke past its rounded bottom. */}
      <div className="flex flex-col h-[640px] max-h-[88vh] rounded-2xl overflow-hidden">
        {/* Hero */}
        <div className="shrink-0 relative overflow-hidden px-6 pt-8 pb-6 text-center bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-600">
          <div className="absolute -top-16 -left-12 w-44 h-44 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-20 -right-10 w-52 h-52 rounded-full bg-fuchsia-300/25 blur-3xl" />
          {/* Gold star rather than another white-on-violet mark — it matches the Pro badge in
              the sidebar and the amber PRO chip on gated inputs, so the same visual stands for
              "Pro" everywhere in the product. */}
          <div className="relative mx-auto mb-3 w-14 h-14 rounded-2xl flex items-center justify-center bg-linear-to-br from-amber-300 to-amber-500 ring-1 ring-white/40 shadow-lg">
            <svg className="w-7 h-7 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" />
            </svg>
          </div>
          <h2 className="relative text-white text-lg font-bold tracking-tight">Upgrade Your Plan</h2>
          <p className="relative text-white/80 text-[13px] mt-0.5">Unlock more of what Pulse can do for you.</p>
        </div>

        {/* Tier switcher */}
        <div className="shrink-0 px-5 pt-3.5 pb-1">
          <div className="relative flex p-0.5 rounded-xl bg-gray-100 ring-1 ring-gray-200/70">
            {/* left-0.5 explicitly, not just inset-y — an absolutely positioned element with
                no left falls back to its unreliable "static position". And the travel is a
                plain translateX(100%): the indicator is exactly one button wide, and the two
                buttons sit flush, so one full width lands it precisely on the second one.
                (Adding the container padding on top of that overshot past the track's edge.) */}
            <div
              className="absolute left-0.5 inset-y-0.5 w-[calc(50%-2px)] rounded-[10px] bg-white shadow-sm transition-transform duration-200"
              style={{ transform: tab === 'pro' ? 'translateX(100%)' : 'translateX(0)' }}
            />
            {TIERS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex-1 py-1.5 rounded-[10px] text-[13px] font-semibold transition-colors ${
                  tab === t.key ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature list — the only scrolling region, with a fade at its bottom edge so it's
            obvious there's more below rather than the list just ending mid-row. */}
        <div className="relative flex-1 min-h-0">
          <div className="h-full overflow-y-auto px-5 py-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
            {FEATURES[tab].map((group) => (
              <div key={group.section || 'ungrouped'}>
                {group.section && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">{group.section}</p>
                )}
                <div className="space-y-3.5">
                  {group.items.map((f) => {
                    colorIndex++
                    return (
                      <div key={f.title} className="flex items-start gap-3">
                        <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 bg-linear-to-br shadow-sm ${ICON_COLORS[colorIndex % ICON_COLORS.length]}`}>
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.path} />
                          </svg>
                        </span>
                        <div className="min-w-0 pt-px">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13px] font-semibold text-gray-900">{f.title}</p>
                            {f.badge && (
                              <span className="text-[9px] font-bold uppercase tracking-wide text-gray-500 bg-gray-100 rounded-full px-1.5 py-px">
                                {f.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-[1.5]">{f.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-white to-transparent" />
        </div>

        {/* Footer CTA */}
        <div className="shrink-0 px-5 pt-3 pb-5 border-t border-gray-100">
          {tab === 'free' ? (
            <div className="text-center text-[13px] text-gray-400 py-2.5">
              {isProUser(user) ? 'To downgrade, manage your subscription from Billing.' : 'This is your current plan.'}
            </div>
          ) : alreadyOnThisTab ? (
            <div className="text-center text-[13px] text-gray-400 py-2.5">This is your current plan.</div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-2.5">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">{PRICE.pro.monthly}</span>
                <span className="text-xs text-gray-500">/month</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500">{PRICE.pro.yearly}/year</span>
                {savingsPct && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                    SAVE {savingsPct}%
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowPayment(true)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-md shadow-violet-600/20 bg-linear-to-r from-violet-600 to-fuchsia-600"
              >
                Upgrade to Pro
              </button>
              <p className="text-center text-[11px] text-gray-400 mt-2">Auto-renewal. Cancel anytime.</p>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
