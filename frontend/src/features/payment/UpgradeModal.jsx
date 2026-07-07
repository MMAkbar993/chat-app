import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import PaymentModal from './PaymentModal'

const TIERS = [
  { key: 'free', label: 'Free', accent: 'slate' },
  { key: 'pro', label: 'Pro', accent: 'violet' },
  { key: 'business', label: 'Business', accent: 'amber' },
]

const ACCENT = {
  slate:  { bg: 'bg-slate-500',  tabActive: 'bg-slate-600 text-white',  hero: 'from-slate-500 to-slate-700' },
  violet: { bg: 'bg-violet-600', tabActive: 'bg-violet-600 text-white', hero: 'from-violet-500 to-indigo-600' },
  amber:  { bg: 'bg-amber-500',  tabActive: 'bg-amber-500 text-white',  hero: 'from-amber-400 to-orange-600' },
}

const PRICE = {
  pro:      { monthly: '€6.99', yearly: '€70.00' },
  business: { monthly: '€6.99', yearly: '€70.00' },
}

const FEATURES = {
  free: [
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
  ],
  pro: [
    { title: 'Unlimited Audio Calls', desc: 'Talk without limits with unlimited high-quality voice calls.',
      path: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    { title: 'Unlimited Video Calls', desc: 'Host meetings and collaborate with unlimited video calls.',
      path: 'M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { title: 'Groups', desc: 'Create private groups for your team, partners, or projects.',
      path: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-14a4 4 0 010 7.75M9 7a4 4 0 118 0 4 4 0 01-8 0z' },
    { title: 'Google Calendar Integration', desc: 'Keep meetings and events synced directly with your calendar.',
      path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { title: 'Unlimited File Sharing', desc: 'Store and share files without worrying about storage limits.',
      path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { title: 'Requests Marketplace', badge: 'Coming soon', desc: 'Post business requests and discover new partnership opportunities.',
      path: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z' },
  ],
  business: [
    { title: 'Everything in Pro', desc: 'Get every Pro feature, including unlimited voice and video calls, groups, Google Calendar integration, unlimited file sharing, and the Requests marketplace.',
      path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { title: 'Business Profile', desc: 'Create a verified company profile to showcase your business and build trust with industry professionals.',
      path: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { title: 'Company Information', desc: 'Show your company name, logo, website, industry role, headquarters, and company description.',
      path: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { title: 'Team Members', desc: 'Display approved team members directly on your company profile, making it easy for others to see who represents your business.',
      path: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-14a4 4 0 010 7.75M9 7a4 4 0 118 0 4 4 0 01-8 0z' },
    { title: 'Company Contact', desc: 'Allow professionals to contact your company directly from your Business Profile.',
      path: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { title: 'Services & Expertise', desc: 'Highlight the services your business offers so users immediately understand how you can help.',
      path: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 10l-5.714 2.143L13 19l-2.286-6.857L5 10l5.714-2.143z' },
  ],
}

export default function UpgradeModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('pro')
  const [showPayment, setShowPayment] = useState(false)
  const accent = ACCENT[TIERS.find((t) => t.key === tab).accent]

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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md" scroll>
      {/* Hero — swap this block for a video/animation later */}
      <div className={`flex flex-col items-center pt-9 pb-6 px-6 rounded-t-2xl bg-gradient-to-br ${accent.hero}`}>
        <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3 shadow-lg">
          <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" />
          </svg>
        </div>
        <h2 className="text-white text-xl font-bold">Upgrade Your Plan</h2>
        <p className="text-white/80 text-sm mt-1 text-center">Unlock more of what Pulse can do for you.</p>
      </div>

      {/* Tier tabs */}
      <div className="flex gap-1 px-5 pt-4">
        {TIERS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.key ? ACCENT[t.accent].tabActive : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Feature list */}
      <div className="px-5 py-5 space-y-4">
        {FEATURES[tab].map((f) => (
          <div key={f.title} className="flex items-start gap-3">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent.bg}`}>
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
        ))}
      </div>

      {/* Footer CTA */}
      <div className="px-5 pb-6">
        {tab === 'free' ? (
          <div className="text-center text-sm text-gray-400 py-2.5">This is your current plan.</div>
        ) : (
          <>
            <div className="flex items-baseline justify-center gap-1.5 mb-3">
              <span className="text-2xl font-bold text-gray-900">{PRICE[tab].monthly}</span>
              <span className="text-sm text-gray-500">/month</span>
              <span className="text-xs text-gray-400">· or {PRICE[tab].yearly}/year</span>
            </div>
            <button
              onClick={() => setShowPayment(true)}
              className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 bg-gradient-to-br ${accent.hero}`}
            >
              Upgrade to {TIERS.find((t) => t.key === tab).label}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">Auto-renewal. Cancel anytime.</p>
          </>
        )}
      </div>
    </Modal>
  )
}
