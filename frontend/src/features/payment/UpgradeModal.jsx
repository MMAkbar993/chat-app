import { Fragment, useState } from 'react'
import Modal from '../../components/ui/Modal'
import PaymentModal from './PaymentModal'
import { useAuth } from '../../context/AuthContext'
import { isProUser } from '../../utils/plan'

// A colour per row. The surrounding chrome — header, plan rows, button — is all one violet;
// the variety belongs on the perk icons, where it's what stops a long list reading as a plain
// settings page. Cycled by a running index across every section so adding a feature later
// doesn't mean choosing a colour for it.
const ICON_COLORS = [
  'from-sky-500 to-blue-600',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-violet-500 to-purple-600',
  'from-fuchsia-500 to-pink-600',
]

const PLANS = [
  { key: 'yearly', label: 'Annual', price: '€70.00', per: 'year', amount: 70 },
  { key: 'monthly', label: 'Monthly', price: '€6.99', per: 'month', amount: 6.99 },
]

// Grouped into labelled cards rather than one flat list — the same grouped-settings shape
// Telegram uses, which is what makes a long list of perks read as organised.
const FEATURES = [
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
]

const SPARKLES = [
  { top: '18%', left: '16%', size: 9, o: 0.4 },
  { top: '10%', left: '32%', size: 6, o: 0.3 },
  { top: '34%', left: '8%', size: 12, o: 0.3 },
  { top: '58%', left: '19%', size: 7, o: 0.35 },
  { top: '13%', left: '62%', size: 8, o: 0.35 },
  { top: '6%', left: '78%', size: 12, o: 0.3 },
  { top: '30%', left: '88%', size: 7, o: 0.4 },
  { top: '62%', left: '80%', size: 10, o: 0.3 },
  { top: '72%', left: '58%', size: 6, o: 0.35 },
  { top: '46%', left: '70%', size: 5, o: 0.45 },
]

const yearly = PLANS.find((p) => p.key === 'yearly')
const monthly = PLANS.find((p) => p.key === 'monthly')
const SAVINGS_PCT = Math.round((1 - yearly.amount / (monthly.amount * 12)) * 100)

export default function UpgradeModal({ isOpen, onClose, darkMode = false }) {
  const { user } = useAuth()
  const pro = isProUser(user)
  const [plan, setPlan] = useState('monthly')
  const [showPayment, setShowPayment] = useState(false)
  const selected = PLANS.find((p) => p.key === plan)

  function handleClose() {
    setPlan('monthly')
    onClose()
  }

  if (showPayment) {
    return (
      <PaymentModal
        isOpen={isOpen}
        standalone
        planType={plan}
        darkMode={darkMode}
        onClose={() => { setShowPayment(false); handleClose() }}
      />
    )
  }

  // Runs across every section's items rather than resetting per section, so two sections never
  // start on the same colour at their boundary.
  let colorIndex = -1

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md" darkMode={darkMode}>
      {/* Only the Subscribe button is pinned; the hero, plans and perks all scroll together
          under it. That's how Telegram's own sheet behaves, and it avoids the trap of fixing
          several tall regions at once and leaving the scrolling one no room at all. */}
      <div className={`flex flex-col h-[640px] max-h-[88vh] rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-lavender'}`}>
        <div className={`flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full ${
          darkMode ? '[&::-webkit-scrollbar-thumb]:bg-gray-700' : '[&::-webkit-scrollbar-thumb]:bg-violet-200'
        }`}>
          {/* Hero — the Pulse wordmark with a Pro chip. A big illustrated star was doing the
              job of a logo without being one; if an animated mark turns up later it drops
              straight in here. */}
          <div className="relative h-36 flex items-center justify-center">
            {SPARKLES.map((s) => (
              <svg
                key={`${s.top}-${s.left}`}
                className="absolute text-violet-500"
                style={{ top: s.top, left: s.left, width: s.size, height: s.size, opacity: s.o }}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0l2.2 9.8L24 12l-9.8 2.2L12 24l-2.2-9.8L0 12l9.8-2.2z" />
              </svg>
            ))}
            <img src="/pro.png" alt="Pulse Pro" className="relative h-12" />
          </div>

          <p className={`px-7 text-center text-[15px] leading-snug ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Go <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>beyond the limits</span> and unlock{' '}
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>exclusive features</span> with Pulse Pro.
          </p>

          {/* Plan picker — right here rather than on a second screen, so choosing a plan and
              subscribing is one step. */}
          {!pro && (
            <div className={`mx-4 mt-5 rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {PLANS.map((p, i) => (
                <Fragment key={p.key}>
                  {i > 0 && <div className={`h-px ml-12 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />}
                  <button
                    type="button"
                    onClick={() => setPlan(p.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${darkMode ? 'hover:bg-gray-700/60' : 'hover:bg-gray-50'}`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      plan === p.key ? 'bg-violet-600' : darkMode ? 'border-2 border-gray-600' : 'border-2 border-gray-300'
                    }`}>
                      {plan === p.key && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-[15px] font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{p.label}</span>
                    {p.key === 'yearly' && SAVINGS_PCT > 0 && (
                      <span className="text-[11px] font-bold text-white bg-violet-600 rounded-md px-1.5 py-0.5">
                        -{SAVINGS_PCT}%
                      </span>
                    )}
                    <span className={`ml-auto text-[15px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{p.price}/{p.per}</span>
                  </button>
                </Fragment>
              ))}
            </div>
          )}

          {/* Perks */}
          <div className="px-4 pt-5 pb-4 space-y-4">
            {FEATURES.map((group) => (
              <div key={group.section}>
                <p className={`text-[11px] font-bold uppercase tracking-wider px-3 mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {group.section}
                </p>
                <div className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  {group.items.map((f, i) => {
                    colorIndex++
                    return (
                    <Fragment key={f.title}>
                      {i > 0 && <div className={`h-px ml-15 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />}
                      <div className="flex items-start gap-3 px-4 py-3">
                        <span className={`w-8 h-8 rounded-[10px] shrink-0 flex items-center justify-center bg-linear-to-br ${ICON_COLORS[colorIndex % ICON_COLORS.length]}`}>
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.path} />
                          </svg>
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{f.title}</p>
                            {f.badge && (
                              <span className={`text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-px ${darkMode ? 'text-violet-300 bg-violet-500/20' : 'text-violet-600 bg-violet-50'}`}>
                                {f.badge}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs leading-[1.45] mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p>
                        </div>
                      </div>
                    </Fragment>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pinned CTA */}
        <div className={`shrink-0 px-4 pt-3 pb-4 border-t ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          {pro ? (
            <p className={`text-center text-sm py-2.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>You're already on Pro.</p>
          ) : (
            <>
              <button
                onClick={() => setShowPayment(true)}
                className="w-full py-3 rounded-xl text-[15px] font-bold text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-sm"
              >
                Subscribe for {selected.price} / {selected.per}
              </button>
              <p className={`text-center text-[11px] mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Auto-renewal. Cancel anytime.</p>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
