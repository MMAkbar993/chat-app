import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  AppMockup, ProfileMockup, KycSlider, MetaTagVisual, SocialConnectVisual,
  GroupChatMockup, CallMockup, SearchMockup, PrivacyMockup,
} from '../components/marketing/HowItWorksMockups'

// Copy on this page is supplied by the product team — keep the wording as given.

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
]

const STEPS = [
  {
    title: 'Create your account',
    desc: 'Sign up with your email address and add your role, job title and company information to your profile.',
    path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    title: 'Verify your identity',
    desc: 'Complete identity verification using a government-issued ID. Every user must be verified before accessing Pulse.',
    path: 'M9 12.75l1.5 1.5 3.75-3.75M12 3l7 3v5c0 4.5-3 8.25-7 9.5-4-1.25-7-5-7-9.5V6l7-3z',
  },
  {
    title: 'Verify your professional presence',
    desc: 'Optionally verify the websites and social profiles connected to your work, so others can see who you represent.',
    path: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Communicate and do business',
    desc: 'Message individuals or groups, make calls, share files, schedule meetings and build professional relationships—all from one place.',
    path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
]

// Identity gets its own row with the screenshot slider — it's the mandatory check and the
// one people are most unsure about, so it earns the most room.
const IDENTITY = {
  title: 'Identity verification',
  lead: 'Every user is verified before accessing Pulse.',
  points: [
    'Identity is checked through Didit using a government-issued identity document.',
    'A liveness and biometric check confirms that the document belongs to the person presenting it.',
    'If the automated check cannot be completed, the request is sent for manual review.',
    'No anonymous users or unverified accounts can access the platform.',
  ],
}

const VERIFICATION = [
  {
    title: 'Website verification',
    lead: 'Show that you control the company or website you represent.',
    visual: <MetaTagVisual />,
    points: [
      'Verify your website using a unique meta tag or DNS record.',
      'Verified websites appear on your public Pulse profile.',
      'The first person to verify a company domain becomes its Website Administrator.',
      'Colleagues can request to be added as representatives of the same company.',
    ],
  },
  {
    title: 'Social profile verification',
    lead: 'Connect your professional social accounts securely.',
    visual: <SocialConnectVisual />,
    points: [
      'Connect supported social accounts by logging in through the platform itself.',
      'This confirms that you control the account, rather than simply adding a social media link.',
      'Supported platforms include Facebook, X, Instagram, YouTube, Kick and Twitch.',
      'Connected profiles can appear on your public Pulse profile.',
    ],
  },
]

const F = {
  messaging: {
    title: 'Direct and group messaging',
    desc: 'Have one-to-one conversations or create group chats with replies, reactions, message editing, pinned messages and searchable conversation history.',
    path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  calls: {
    title: 'Voice and video calls',
    desc: 'Call your contacts directly from Pulse without exchanging phone numbers or moving to another app. Free accounts receive 30 minutes of voice and video calls per month. Pro accounts receive unlimited access.',
    path: 'M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  },
  screen: {
    title: 'Screen sharing',
    desc: 'Share your screen during a call to present a deck, explain a dashboard or walk someone through a live demonstration. Available with Pro.',
    path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  search: {
    title: 'Search by business name',
    desc: 'Find professionals by the company or brand they work for, even if you do not know their username. Available with Pro.',
    path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  },
  files: {
    title: 'File sharing',
    desc: 'Send documents, images, voice notes and other media directly in your conversations, with higher upload limits available on Pro.',
    path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  calendar: {
    title: 'Calendar scheduling',
    desc: 'Schedule meetings with your contacts and keep them synchronized with Google Calendar. Available with Pro.',
    path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
}

// Each row pairs two related features with a picture of them in use, alternating sides so
// the section reads as a walk through the product rather than a wall of cards.
const FEATURE_ROWS = [
  { items: [F.messaging, F.files], visual: <GroupChatMockup /> },
  { items: [F.calls, F.screen], visual: <CallMockup />, flip: true },
  { items: [F.search, F.calendar], visual: <SearchMockup /> },
]

const SECURITY = [
  {
    title: 'Two-factor authentication',
    desc: 'Protect your account with an authenticator app, so a stolen password alone is not enough to access it.',
  },
  {
    title: 'Hide from search',
    desc: 'Remove yourself from username and business-name searches. Stay on Pulse without appearing in search results.',
  },
  {
    title: 'Choose your display name',
    desc: 'Decide how your name appears to others. Choose from options based on your verified name, such as your first name only or your first and last name.',
  },
  {
    title: 'Control group invitations',
    desc: 'Choose who can invite you to groups, so you are not added to unfamiliar conversations without your permission.',
  },
  {
    title: 'Block and report',
    desc: 'Block users from messaging or calling you, and report accounts or groups to our team for review.',
  },
  {
    title: 'Private and encrypted in transit',
    desc: 'Your conversations are protected with encryption while data is transferred between your device and Pulse.',
  },
  {
    title: 'Control your data',
    desc: 'Your verification data is handled according to our KYC and Privacy Policies. You can deactivate or delete your account at any time.',
  },
]

function Eyebrow({ children }) {
  return (
    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm bg-white text-violet-600">
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
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
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
      <section className="px-4 sm:px-6 pt-16 sm:pt-20 pb-20 sm:pb-24" style={HERO_BG}>
        <div className="max-w-3xl mx-auto text-center">
          <Eyebrow>Professional communication for iGaming</Eyebrow>
          <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            The verified communication platform for{' '}
            <span className="bg-linear-to-r from-sky-400 to-violet-600 bg-clip-text text-transparent">iGaming</span>.
          </h1>
          <p className="mt-5 text-lg text-gray-600 leading-relaxed">
            Pulse brings messaging, group chats, voice and video calls, file sharing, screen sharing
            and meeting scheduling together in one secure web app. Communicate and do business with
            confidence, knowing who you are speaking with and who they represent.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-colors shadow-md shadow-violet-600/20">
              Create your account
            </Link>
            <a href="#steps" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-gray-200 hover:border-violet-300 font-semibold transition-colors">
              See how Pulse works
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

        {/* The product itself, front and centre — without this, nothing above says "messenger" */}
        <div className="max-w-5xl mx-auto mt-14 sm:mt-16">
          <AppMockup />
        </div>
      </section>

      {/* Getting started */}
      <section id="steps" className="px-4 sm:px-6 py-16 sm:py-20 border-t border-gray-100 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight">Get connected and start communicating</h2>
            <p className="mt-3 text-gray-600">
              Create your account, verify your identity and start communicating with iGaming
              professionals in one trusted workspace.
            </p>
          </div>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-gray-100 bg-gray-50/70 px-6 pt-9 pb-6">
                {/* Step number sits on the card's top edge, so the order reads before anything else */}
                <span className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-bold flex items-center justify-center shadow-md ring-4 ring-white">
                  {i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="hidden lg:block absolute top-0 -right-5 w-5 border-t-2 border-dashed border-violet-200" />
                )}
                <span className="w-11 h-11 mb-4 rounded-xl bg-white shadow-sm flex items-center justify-center text-violet-600">
                  <Icon path={s.path} className="w-5 h-5" />
                </span>
                <p className="font-bold">{s.title}</p>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification */}
      <section id="verification" className="px-4 sm:px-6 py-16 sm:py-20 bg-lavender scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Eyebrow>Trusted communication</Eyebrow>
              <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight">Know who you're communicating with</h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Pulse combines professional communication with identity and business verification.
                Users can see what has been confirmed before they start a conversation, helping
                reduce impersonation, fake accounts and uncertainty.
              </p>
            </div>
            <ProfileMockup />
          </div>

          {/* Identity: the copy beside a walkthrough of the real verification screens */}
          <div className="mt-14 rounded-3xl bg-white/60 p-5 sm:p-8 grid lg:grid-cols-2 gap-10 items-center">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <span className="w-11 h-11 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center">
                <Icon path="M9 12.75l1.5 1.5 3.75-3.75M12 3l7 3v5c0 4.5-3 8.25-7 9.5-4-1.25-7-5-7-9.5V6l7-3z" className="w-5 h-5" />
              </span>
              <p className="mt-5 text-xl font-bold">{IDENTITY.title}</p>
              <p className="text-sm font-medium text-violet-600">{IDENTITY.lead}</p>
              <ul className="mt-4 space-y-2.5">
                {IDENTITY.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-sm text-gray-600 leading-relaxed">
                    <Icon path="M5 13l4 4L19 7" className="w-3.5 h-3.5 mt-1 shrink-0 text-violet-500" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <KycSlider />
          </div>

          <div className="mt-5 grid md:grid-cols-2 gap-5">
            {VERIFICATION.map((v) => (
              <div key={v.title} className="rounded-2xl bg-white p-5 shadow-sm flex flex-col">
                {v.visual}
                <p className="mt-5 font-bold">{v.title}</p>
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
            Identity verification is mandatory. Website and social profile verification are
            optional, but they provide additional context and help others understand who you are
            and who you represent.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 sm:px-6 py-16 sm:py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight">Everything your business communication needs</h2>
            <p className="mt-3 text-gray-600">
              Pulse brings the tools you use every day into one professional workspace—so you can
              communicate, collaborate and build partnerships without switching between multiple apps.
            </p>
          </div>

          <div className="mt-14 space-y-20">
            {FEATURE_ROWS.map((row) => (
              <div key={row.items[0].title} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <div className={row.flip ? 'lg:order-2' : ''}>{row.visual}</div>
                <div className="space-y-8">
                  {row.items.map((f) => (
                    <div key={f.title} className="flex gap-4">
                      <span className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                        <Icon path={f.path} className="w-5 h-5" />
                      </span>
                      <div>
                        <p className="text-lg font-bold">{f.title}</p>
                        <p className="mt-1.5 text-gray-600 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security and privacy */}
      <section id="security" className="px-4 sm:px-6 py-16 sm:py-20 bg-gray-900 text-white scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Security and privacy</h2>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Being verified should not mean being exposed. You control how discoverable you are
                and who can contact you.
              </p>
            </div>
            <PrivacyMockup />
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-7">
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

      {/* Closing CTA */}
      <section className="px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto rounded-3xl px-6 sm:px-8 py-12 text-center bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white">
          <h2 className="text-3xl font-extrabold tracking-tight">Ready to join Pulse?</h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto">
            Create your account, verify your identity and connect with iGaming professionals in
            one trusted workspace.
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
      <footer className="px-4 sm:px-6 py-10 border-t border-gray-100">
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
