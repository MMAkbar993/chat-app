import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Same dotted/glow treatment as the public profile and group-invite pages, so the pages a
// stranger sees before they have an account all look like one product.
const HERO_BG = {
  backgroundImage: 'radial-gradient(rgba(109,40,217,0.08) 1px, transparent 1px), radial-gradient(circle at 15% 10%, rgba(139,92,246,0.10), transparent 45%), radial-gradient(circle at 85% 90%, rgba(139,92,246,0.08), transparent 45%)',
  backgroundSize: '18px 18px, auto, auto',
}

const NAV = [
  { href: '#steps', label: 'How it works' },
  { href: '#verification', label: 'Verification' },
  { href: '#features', label: 'Features' },
  { href: '#security', label: 'Security' },
  { href: '#pricing', label: 'Pricing' },
]

const STEPS = [
  {
    title: 'Create your account',
    desc: 'Sign up with your work email and confirm it. Then add your role in the industry, your job title and the company you work with.',
    path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    title: 'Verify your identity',
    desc: 'Every account passes identity verification with a government-issued ID before it can be used. This is what keeps anonymous and impersonated accounts out.',
    path: 'M9 12.75l1.5 1.5 3.75-3.75M12 3l7 3v5c0 4.5-3 8.25-7 9.5-4-1.25-7-5-7-9.5V6l7-3z',
  },
  {
    title: 'Prove what you represent',
    desc: 'Optionally verify the websites you own and connect your social profiles, so the people you speak to can see who you actually work for.',
    path: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Connect and do business',
    desc: 'Find the right people, message them, jump on a call, share files and build the partnerships your business actually runs on.',
    path: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
]

const VERIFICATION = [
  {
    badge: 'KYC Verified',
    title: 'Identity verification',
    lead: 'Required for everyone, before any access.',
    points: [
      'Identity is checked through Didit, our third-party verification provider, using a government-issued identity document.',
      'A liveness and biometric check confirms the document belongs to the person presenting it.',
      'Where an automated check cannot complete, the request goes to our team for manual review.',
      'Nobody reaches the platform without passing. This is the difference between Pulse and an ordinary messenger.',
    ],
    path: 'M9 12.75l1.5 1.5 3.75-3.75M12 3l7 3v5c0 4.5-3 8.25-7 9.5-4-1.25-7-5-7-9.5V6l7-3z',
  },
  {
    badge: 'Website Verified',
    title: 'Website verification',
    lead: 'Proves you control the domain you claim.',
    points: [
      'Pulse generates a unique verification meta tag for your website. You add it to the <head> section of the site and press Verify.',
      "Can't edit the page? Add the TXT record Pulse gives you at your DNS provider instead — that route is unaffected by firewalls or caching.",
      'Verified websites appear on your public profile, and the first person to verify a company domain becomes its Website Admin.',
      'Colleagues can then request to be approved as representatives of that same company, which the admin approves or rejects.',
    ],
    path: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  },
  {
    badge: 'Socials Verified',
    title: 'Social profile verification',
    lead: 'Connected by login, not by pasting a link.',
    points: [
      'Where a platform supports it, Pulse connects social accounts through OAuth — you log in to the platform itself and it confirms the account back to us.',
      'That means a connected profile is one you actually control, rather than any URL someone chose to type in.',
      'Supported through OAuth today: Facebook, X, Instagram, YouTube, Kick and Twitch.',
      'Connected profiles can be shown on your public Pulse profile as another signal that you are who you say you are.',
    ],
    path: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  },
]

const FEATURES = [
  {
    title: 'Direct and group messaging',
    desc: 'One-to-one conversations, replies, reactions, editing, pinned messages and search across your history. Groups are available on Pro.',
    path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  {
    title: 'Voice and video calls',
    desc: 'Call anyone on Pulse without swapping numbers or moving to another app. Free accounts get 30 minutes a month; Pro is unlimited.',
    path: 'M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  },
  {
    title: 'Screen sharing',
    desc: 'Share your screen mid-call to walk a partner through a deck, a dashboard or a live demo instead of describing it. Pro feature.',
    path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    title: 'Search by business name',
    desc: 'Look up people by the company or brand they work for rather than a username you would have to know already. Pro feature.',
    path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  },
  {
    title: 'File sharing',
    desc: 'Send documents, images, voice notes and media straight into the conversation, with larger upload limits on Pro.',
    path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    title: 'Calendar scheduling',
    desc: 'Book meetings with the person you are talking to and keep them synced with Google Calendar. Pro feature.',
    path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
]

const SECURITY = [
  {
    title: 'Two-factor authentication',
    desc: 'Protect your account with an authenticator app, so a stolen password alone is not enough to get in.',
  },
  {
    title: 'Hide from search',
    desc: 'Take yourself out of both username and business search entirely. Be on Pulse without being discoverable.',
  },
  {
    title: 'Control group invites',
    desc: 'Restrict group invitations to your own contacts, so strangers cannot pull you into a group unannounced.',
  },
  {
    title: 'Block and report',
    desc: 'Block anyone from messaging or calling you, and report accounts and groups to our team for review.',
  },
  {
    title: 'Private and encrypted in transit',
    desc: 'Conversations are private to their participants and encrypted in transit between you and Pulse.',
  },
  {
    title: 'Your data, your call',
    desc: 'Verification data is handled under our KYC and Privacy policies, and you can deactivate or delete your account at any time.',
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '€0',
    per: 'forever',
    lead: 'The core platform, fully verified.',
    items: [
      'Verified profile and badges',
      'Direct messaging and contacts',
      '30 minutes of calls a month',
      'File sharing',
      'Website and social verification',
    ],
  },
  {
    name: 'Pro',
    price: '€6.99',
    per: 'per month, or €70.00 a year',
    lead: 'For people doing business here every day.',
    featured: true,
    items: [
      'Everything in Free',
      'Unlimited voice and video calls',
      'Screen sharing',
      'Search by business name',
      'Groups',
      'Google Calendar scheduling',
      'Unlimited file sharing',
    ],
  },
]

function Eyebrow({ children }) {
  return (
    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-xs font-bold uppercase tracking-wider text-violet-600 shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
      {children}
    </span>
  )
}

function Icon({ path, className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  )
}

export default function HowItWorksPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Self-link, not "/" — that has no route and falls through to the login redirect,
              so clicking the logo on a marketing page would bounce you off it. */}
          <Link to="/how-it-works"><img src="/full-logo.png" alt="Pulse" className="h-7" /></Link>
          <nav className="hidden md:flex items-center gap-7">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <Link to="/chat" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
                Go to App
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block px-3 py-2 text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors">
                  Sign in
                </Link>
                <Link to="/signup" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 sm:py-24 text-center" style={HERO_BG}>
        <div className="max-w-3xl mx-auto">
          <Eyebrow>For iGaming professionals</Eyebrow>
          <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Know exactly who you're{' '}
            <span className="bg-linear-to-r from-sky-400 to-violet-600 bg-clip-text text-transparent">talking to</span>.
          </h1>
          <p className="mt-5 text-lg text-gray-600 leading-relaxed">
            Impersonation and fake accounts are a daily problem in iGaming. Pulse is a messaging
            platform where every single person has passed identity verification before they can
            send you a word — and where they can prove the company and websites they represent.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-colors shadow-md shadow-violet-600/20">
              Create your account
            </Link>
            <a href="#steps" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-gray-200 hover:border-violet-300 font-semibold transition-colors">
              See how it works
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-gray-700">
            {['No fake accounts', 'No anonymous users', 'Only verified professionals'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Icon path="M5 13l4 4L19 7" className="w-4 h-4 text-violet-600" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section id="steps" className="px-6 py-16 sm:py-20 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight">Getting started</h2>
            <p className="mt-3 text-gray-600">
              Four steps from signing up to doing business. The verification work happens once,
              up front, and everyone you meet here has done the same.
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-violet-600">
                    <Icon path={s.path} className="w-5 h-5" />
                  </span>
                  <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <p className="font-bold">{s.title}</p>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification — the differentiator, so it gets the most room on the page */}
      <section id="verification" className="px-6 py-16 sm:py-20 bg-lavender">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <Eyebrow>Verification</Eyebrow>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight">Three separate things you can prove</h2>
            <p className="mt-3 text-gray-600">
              Anyone can claim a name, a company and a website. On Pulse those are three
              different checks, and each one shows on your profile as its own badge, so the
              person on the other side can see precisely what has been confirmed.
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-3 gap-5">
            {VERIFICATION.map((v) => (
              <div key={v.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="w-11 h-11 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center mb-4">
                  <Icon path={v.path} className="w-5 h-5" />
                </span>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-bold">{v.title}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                    <Icon path="M5 13l4 4L19 7" className="w-2.5 h-2.5" />
                    {v.badge}
                  </span>
                </div>
                <p className="text-sm font-medium text-violet-600">{v.lead}</p>
                <ul className="mt-4 space-y-2.5">
                  {v.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm text-gray-600 leading-relaxed">
                      <Icon path="M5 13l4 4L19 7" className="w-3.5 h-3.5 mt-1 shrink-0 text-violet-500" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-gray-500 max-w-3xl">
            Identity verification is mandatory. Website and social verification are optional —
            but they are what turn "trust me, I work there" into something a stranger can check
            for themselves before replying.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight">Everything you'd expect, built for the work</h2>
            <p className="mt-3 text-gray-600">
              Pulse is a full messenger first. The verification is what makes the conversations
              on it worth having.
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-100 p-6 hover:border-violet-200 transition-colors">
                <span className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                  <Icon path={f.path} className="w-5 h-5" />
                </span>
                <p className="font-bold">{f.title}</p>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & privacy */}
      <section id="security" className="px-6 py-16 sm:py-20 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight">Security and privacy</h2>
            <p className="mt-3 text-gray-400">
              Being verified shouldn't mean being exposed. You decide how findable you are and
              who gets to reach you.
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-7">
            {SECURITY.map((s) => (
              <div key={s.title}>
                <p className="flex items-center gap-2 font-semibold">
                  <Icon path="M9 12.75l1.5 1.5 3.75-3.75M12 3l7 3v5c0 4.5-3 8.25-7 9.5-4-1.25-7-5-7-9.5V6l7-3z" className="w-4 h-4 text-violet-400 shrink-0" />
                  {s.title}
                </p>
                <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight">Pricing</h2>
            <p className="mt-3 text-gray-600">
              Verification and messaging are free. Pro adds the tools for people who are on here
              closing business every day.
            </p>
          </div>
          <div className="mt-10 grid md:grid-cols-2 gap-5">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-7 ${p.featured ? 'bg-lavender ring-2 ring-violet-600' : 'border border-gray-100'}`}
              >
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg">{p.name}</p>
                  {p.featured && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-violet-600 rounded-md px-1.5 py-0.5">
                      Most popular
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{p.lead}</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
                  <span className="text-sm text-gray-500">{p.per}</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {p.items.map((i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                      <Icon path="M5 13l4 4L19 7" className="w-4 h-4 mt-0.5 shrink-0 text-violet-600" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-gray-400">
            Pro renews automatically and can be cancelled at any time from Settings → Billing.
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto rounded-3xl px-8 py-12 text-center bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white">
          <h2 className="text-3xl font-extrabold tracking-tight">Ready to join Pulse?</h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto">
            Verify once, and connect with iGaming professionals who have done the same.
          </p>
          <Link
            to="/signup"
            className="inline-block mt-7 px-7 py-3 rounded-xl bg-white text-violet-700 font-bold hover:bg-violet-50 transition-colors shadow-lg"
          >
            Create your account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src="/full-logo.png" alt="Pulse" className="h-6 opacity-70" />
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <Link to="/terms" className="hover:text-violet-600 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-violet-600 transition-colors">Privacy</Link>
            <Link to="/cookies" className="hover:text-violet-600 transition-colors">Cookies</Link>
            <Link to="/kyc-policy" className="hover:text-violet-600 transition-colors">KYC Policy</Link>
          </div>
          <p className="text-xs text-gray-400">&copy;{new Date().getFullYear()} Pulse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
