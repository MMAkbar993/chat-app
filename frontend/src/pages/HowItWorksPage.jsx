import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { HOW_IT_WORKS_META } from './howItWorksMeta'
import { Icon, Eyebrow, HeaderLogo, HeaderActions, MarketingFooter, CtaBanner } from '../components/marketing/MarketingChrome'
import { HERO_BG, FOCUS, usePageMeta, useScrollOnArrive, useMarketingTheme } from '../components/marketing/marketingHelpers'
import {
  KycSlider, SocialProfileVisual,
  GroupChatMockup, CallMockup, SearchMockup, PrivacyMockup, ShareLinksMockup,
} from '../components/marketing/HowItWorksMockups'
import FaqSection from '../components/settings/FaqSection'

// The detailed explainer. Selling — the hero pitch, pricing, the short FAQ — lives on the home
// page at "/"; this page walks through how each part works.

// The Help Center sections a prospect actually asks about before signing up. Same content as
// the in-app FAQ, so the two can't drift apart.
const FAQ_CATEGORIES = [
  'About Pulse',
  'Getting Started & Identity Verification',
  'Understanding Pulse Verification',
  'Voice & Video Calls',
  'Pulse Pro',
  'Privacy & Data Protection',
]

// Shown first on this page; the rest sit behind "See all questions". Exact question texts from
// FaqSection — a mismatch is warned about in development.
const FAQ_FEATURED = [
  'What is Pulse?',
  'Why does Pulse need my ID?',
  'Can other Pulse users see my ID?',
  'How long is my KYC information stored?',
  'Do I need Pulse Pro to use Pulse?',
  'Does Pulse sell my personal information?',
]

// The page's own sections, shown in its header in place of the site-wide links. Ids are stable —
// the home page and shared links point at them.
const SECTION_NAV = [
  { id: 'verification', label: 'Verification' },
  { id: 'company', label: 'Company' },
  { id: 'features', label: 'Features' },
  { id: 'share-links', label: 'Share links' },
  { id: 'security', label: 'Security' },
  { id: 'faq', label: 'FAQ' },
]

// Clears the header — 64px, or 108px on phones where the section links get their own row — so
// a section lands just below it instead of under it.
const SECTION_SCROLL_MARGIN = 'scroll-mt-32'

// ─── Getting verified ─────────────────────────────────────────────────────────

// TODO: confirm the timings. The ID check's own start screen says about 1 minute; the 1 minute
// for creating an account is an estimate. The intro's "About 2 minutes" is these two added up.
const TIMELINE = [
  {
    title: 'Create your account',
    time: 'About 1 min',
    required: true,
    desc: 'Sign up with your email address and add your role, job title and company information to your profile.',
  },
  {
    title: 'Verify your identity with Didit',
    time: 'About 1 min',
    required: true,
    desc: 'A government-issued ID and a liveness check confirm you are the person on the ID. No anonymous or unverified accounts can access Pulse.',
  },
  {
    title: 'Verify your website and socials',
    required: false,
    desc: 'Optionally verify the website and social profiles connected to your work, so others can see who you represent.',
    links: [{ href: '#company', label: 'Company verification' }, { href: '#social', label: 'Social verification' }],
  },
  {
    title: 'Start communicating',
    desc: 'Message individuals or groups, make calls, share files and schedule meetings with verified professionals, all from one place.',
  },
]

// Answers follow the Help Center: "What happens if my verification fails?", the KYC Policy's
// list of accepted documents, and "What happens if I change companies?".
const WHAT_IF = [
  {
    q: 'My verification failed',
    a: 'It usually comes down to image quality, lighting, an unsupported document or the liveness check. You can try again straight away from the verification screen. If it keeps failing, contact Pulse Support and we will review it with you.',
  },
  {
    q: "My ID type isn't accepted",
    a: 'Pulse accepts a passport, national identity card, driving licence or residence permit, though what is available depends on your country. If yours is not accepted, contact Pulse Support to find out what you can use.',
  },
  {
    q: 'I changed company',
    a: 'Step back from your old company under Settings → Website Verification, then verify your new one: with your new company email to join as a representative, or with a head tag or DNS record if you run its website.',
  },
]

const SOCIAL = {
  lead: 'Link your social profiles to show which accounts you own and build trust with the iGaming community. This confirms that you control the account, not just a link.',
  points: [
    'Connect supported social accounts by logging in securely.',
    'This confirms that you control the account.',
    'Supported platforms include X, Instagram, YouTube, Kick and Twitch.',
    'Connected profiles can appear on your public Pulse profile.',
  ],
}

// The same three routes, in the same words, as the cards in Settings → Website Verification —
// so someone reading this page recognises the screen when they reach it.
const WEBSITE_ROUTES = [
  {
    title: 'HTML Head Tag',
    grant: 'admin',
    blurb: 'Add a meta tag to your website\'s <head> section.',
    points: ['Verifies ownership of the website', 'Shows the website on your public profile', 'Lets you manage the Business Profile & Reps'],
    path: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  },
  {
    title: 'DNS Record',
    grant: 'admin',
    blurb: 'Add a TXT record to your domain\'s DNS settings.',
    points: ['Verifies ownership of the website', 'Shows the website on your public profile', 'Lets you manage the Business Profile & Reps'],
    path: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
  },
  {
    title: 'Business Email',
    grant: 'rep',
    blurb: 'Verify using a company email address (e.g. name@yourcompany.com).',
    points: ['Confirms you work for the business', 'Shows the business on your public profile', 'Adds you as a Verified Representative'],
    path: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
]

// ─── Features ─────────────────────────────────────────────────────────────────

// `pro: true` puts a Pro badge on the feature. Only for features that are Pro-only — calls and
// file sharing work on Free with limits, so they say so in words instead.
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
    pro: true,
    desc: 'Share your screen during a call to present a deck, explain a dashboard or walk someone through a live demonstration.',
    path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  search: {
    title: 'Search by business name',
    pro: true,
    desc: 'Find professionals by the company or brand they work for, even if you do not know their username.',
    path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  },
  files: {
    title: 'File sharing',
    desc: 'Send documents, images, voice notes and other media directly in your conversations, with higher upload limits available on Pro.',
    path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  calendar: {
    title: 'Calendar scheduling',
    pro: true,
    desc: 'Schedule meetings with your contacts and keep them synchronized with Google Calendar.',
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

// Share-link copy follows the Help Center's own answers on sharing a profile.
const SHARE_ITEMS = [
  {
    title: 'Your profile share link',
    desc: 'Every Pulse user has a unique link to their verified profile. Find yours under Settings → Profile Info and share it wherever you want people to find you.',
  },
  {
    title: 'Add it to your website and email signature',
    desc: 'Link to your Pulse profile from your website footer, contact page, email signature, LinkedIn or digital business card, so people can confirm they are contacting the right person.',
  },
  {
    title: 'Group invite links',
    desc: 'Group admins can create an invite link from Group Info and share it anywhere. Anyone who opens it can see the group before joining, and admins can reset or revoke the link at any time.',
  },
]

// ─── Comparison ───────────────────────────────────────────────────────────────

// TODO: re-verify competitor claims before launch. Telegram and Teams change their features
// often, and a wrong cell here is the kind of thing people screenshot.
//   true = yes · false = no · 'pro' = yes, on Pulse Pro · 'partial' = shown as "Limited"
// Pulse cells follow the product: creating groups is Pro (createGroup on the server); business
// profiles are open to any verified website admin, so that cell is a plain yes, not Pro.
const COMPARISON = {
  columns: ['Pulse', 'Telegram', 'Teams'],
  rows: [
    { label: 'KYC-verified member identities', values: [true, false, false] },
    { label: 'Verified websites on profiles', values: [true, false, false] },
    { label: 'Verified social accounts on profiles', values: [true, false, false] },
    { label: 'Verified company representatives', values: [true, false, false] },
    { label: 'Shareable professional profiles', values: [true, 'partial', false] },
    { label: 'Public business profiles', values: [true, 'partial', 'partial'] },
    { label: 'Built for the iGaming industry', values: [true, false, false] },
    { label: 'Direct messaging', values: [true, true, true] },
    { label: 'Group chats', values: ['pro', true, true] },
    { label: 'Voice & video calls', values: [true, true, true] },
    { label: 'Shareable contact links', values: [true, true, 'partial'] },
  ],
}

// ─── Security ─────────────────────────────────────────────────────────────────

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
    title: 'Private and in your control',
    desc: 'Conversations are encrypted in transit between your device and Pulse. Verification data is handled under our KYC and Privacy Policies, and you can deactivate or delete your account at any time.',
  },
]

// Plain statements of what Pulse holds. Each one is backed by the Help Center: "Are Pulse
// messages end-to-end encrypted?" (no — in transit only, access restricted by policy) and the
// retention answer (documents deleted within a month, only the verification record kept).
const WHAT_PULSE_SEES = [
  'Messages are encrypted in transit between your device and Pulse, not end-to-end. Access to them is restricted by policy.',
  'ID documents and selfies are deleted after 30 days.',
  'Pulse keeps only a record that you were verified.',
]

const H2 = 'mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight text-balance'
const LEAD = 'mt-4 text-gray-600 night:text-gray-300 leading-relaxed'
const CHECK = 'M5 13l4 4L19 7'
const CROSS = 'M6 18L18 6M6 6l12 12'
const LOCK = 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'

function CheckList({ items }) {
  return (
    <ul className="mt-6 space-y-3.5">
      {items.map((p) => (
        <li key={p} className="flex items-center gap-3 text-gray-600 night:text-gray-300">
          <span className="w-7 h-7 rounded-lg bg-violet-100 night:bg-violet-500/20 text-violet-600 night:text-violet-300 flex items-center justify-center shrink-0">
            <Icon path={CHECK} className="w-4 h-4" />
          </span>
          <span>{p}</span>
        </li>
      ))}
    </ul>
  )
}

function ProBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      Pro
    </span>
  )
}

function RouteCard({ route }) {
  const admin = route.grant === 'admin'
  return (
    <div className={`flex flex-col rounded-2xl border p-6 shadow-sm ${admin ? 'border-violet-100 night:border-violet-500/20 bg-violet-50/40 night:bg-violet-500/10' : 'border-green-100 night:border-green-500/20 bg-green-50/40 night:bg-green-500/10'}`}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${admin ? 'bg-violet-100 night:bg-violet-500/20 text-violet-600 night:text-violet-300' : 'bg-green-100 night:bg-green-500/20 text-green-600 night:text-green-400'}`}>
          <Icon path={route.path} />
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 text-white ${admin ? 'bg-violet-600' : 'bg-green-600'}`}>
          {admin ? 'Admin Access' : 'Representative'}
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 night:text-white">{route.title}</h3>
      <p className="mt-1 text-sm text-gray-500 night:text-gray-400">{route.blurb}</p>
      <ul className="mt-4 space-y-2">
        {route.points.map((p) => (
          <li key={p} className="flex gap-2.5 text-sm text-gray-700 night:text-gray-200">
            <Icon path={CHECK} className={`w-4 h-4 mt-0.5 shrink-0 ${admin ? 'text-violet-500' : 'text-green-500'}`} />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// This page's header: one bar with the logo, the page's own sections and the sign-in buttons,
// in place of the site-wide header. The current section is whichever one's top has most
// recently passed just under the bar. Phones get the section links as a second row inside the
// same sticky header, scrolling sideways and keeping the current one in view.
function PageHeader({ theme }) {
  const [active, setActive] = useState(null)
  const barRef = useRef(null)
  const linkRefs = useRef({})

  useEffect(() => {
    let frame = 0
    function update() {
      frame = 0
      const line = 150 // px from the top: the header plus a little
      let current = null
      for (const { id } of SECTION_NAV) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      setActive(current)
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  // Scroll the phone row itself, never the page: scrollIntoView could nudge the window too.
  useEffect(() => {
    const bar = barRef.current
    const link = active && linkRefs.current[active]
    if (bar && link) {
      bar.scrollTo({ left: link.offsetLeft - bar.clientWidth / 2 + link.clientWidth / 2, behavior: 'smooth' })
    }
  }, [active])

  const linkClass = (id) =>
    `shrink-0 whitespace-nowrap flex items-center px-3 text-sm font-medium border-b-2 transition-colors ${FOCUS} ${
      active === id ? 'border-violet-600 text-violet-700 night:text-violet-300' : 'border-transparent text-gray-600 night:text-gray-300 hover:text-violet-600 night:hover:text-violet-300'
    }`

  return (
    <header className="sticky top-0 z-40 bg-white/90 night:bg-gray-950/90 backdrop-blur border-b border-gray-100 night:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <HeaderLogo />
        <nav aria-label="On this page" className="hidden lg:flex self-stretch gap-1">
          {SECTION_NAV.map((s) => (
            <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? 'location' : undefined} className={linkClass(s.id)}>
              {s.label}
            </a>
          ))}
        </nav>
        <HeaderActions theme={theme} />
      </div>
      {/* Phones and tablets: the same links, one row down, scrolling sideways */}
      <nav aria-label="On this page" className="lg:hidden border-t border-gray-100 night:border-gray-800">
        <div ref={barRef} className="max-w-6xl mx-auto px-4 sm:px-6 h-11 flex gap-1 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
          {SECTION_NAV.map((s) => (
            <a
              key={s.id}
              ref={(el) => { linkRefs.current[s.id] = el }}
              href={`#${s.id}`}
              aria-current={active === s.id ? 'location' : undefined}
              className={linkClass(s.id)}
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  )
}

function CompareCell({ value }) {
  if (value === true || value === 'pro') {
    return (
      // On phones "Pro" sits under the tick, so the column stays narrow enough for all four to fit.
      <span className="inline-flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5">
        <span className="w-6 h-6 rounded-full bg-green-50 night:bg-green-500/10 text-green-600 night:text-green-400 flex items-center justify-center">
          <Icon path={CHECK} className="w-3.5 h-3.5" />
        </span>
        <span className="sr-only">Yes</span>
        {value === 'pro' && (
          <span className="text-[11px] font-semibold text-violet-700 night:text-violet-300">
            <span aria-hidden="true">Pro</span>
            <span className="sr-only">, on Pulse Pro</span>
          </span>
        )}
      </span>
    )
  }
  if (value === 'partial') {
    return <span className="text-xs font-medium text-gray-500 night:text-gray-400">Limited</span>
  }
  return (
    <span className="inline-flex">
      <span className="w-6 h-6 rounded-full bg-gray-100 night:bg-gray-800 text-gray-400 night:text-gray-500 flex items-center justify-center">
        <Icon path={CROSS} className="w-3.5 h-3.5" />
      </span>
      <span className="sr-only">No</span>
    </span>
  )
}

export default function HowItWorksPage() {
  const { hash } = useLocation()
  usePageMeta(HOW_IT_WORKS_META)
  useScrollOnArrive(hash)
  // Temporary: compare phone frames with ?phone=classic until one is chosen.
  const [searchParams] = useSearchParams()
  const phoneStyle = searchParams.get('phone') === 'classic' ? 'classic' : 'tall'
  const [dark, toggleTheme] = useMarketingTheme()

  // overflow-x-clip, not -hidden: hidden makes this div a scroll container, which stops the
  // sticky header sticking — it would scroll away with the page.
  return (
    <div
      data-theme={dark ? 'dark' : 'light'}
      style={{ colorScheme: dark ? 'dark' : 'light' }}
      className="min-h-screen bg-white night:bg-gray-950 text-gray-900 night:text-white overflow-x-clip"
    >
      <PageHeader theme={{ dark, onToggle: toggleTheme }} />

      <main>
        {/* Intro — short on purpose; the pitch lives on the home page */}
        <section className="px-4 sm:px-6 pt-14 sm:pt-16 pb-12 sm:pb-14" style={HERO_BG}>
          <div className="max-w-3xl mx-auto text-center">
            <Eyebrow>How it works</Eyebrow>
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-balance">
              From sign-up to your first verified conversation
            </h1>
            {/* TODO: confirm "About 2 minutes" — see the TIMELINE timings above. */}
            <p className="mt-5 text-lg text-gray-600 night:text-gray-300 leading-relaxed">
              About 2 minutes to create your account and verify your identity.
            </p>
            <Link
              to="/signup"
              className={`inline-block mt-7 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors shadow-md shadow-violet-600/20 ${FOCUS}`}
            >
              Create free account
            </Link>
          </div>
        </section>


        {/* Verification: one timeline, with the ID check shown screen by screen beside it */}
        <section id="verification" className={`px-4 sm:px-6 py-16 sm:py-20 bg-lavender night:bg-violet-950/30 ${SECTION_SCROLL_MARGIN}`}>
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <Eyebrow>Verification</Eyebrow>
              <h2 className={H2}>How getting verified works</h2>
              <p className={LEAD}>Two steps are required, and they are the only thing between you and your first conversation.</p>
            </div>

            <div className="mt-12 grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <ol className="relative">
                {TIMELINE.map((s, i) => (
                  <li key={s.title} className="relative pl-14 pb-10 last:pb-0">
                    {i < TIMELINE.length - 1 && (
                      <span aria-hidden="true" className="absolute left-5 top-11 bottom-1 w-0.5 -translate-x-1/2 bg-violet-200" />
                    )}
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-0 w-10 h-10 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center ring-4 ring-lavender night:ring-gray-950"
                    >
                      {i + 1}
                    </span>
                    <h3 className="pt-1.5 text-lg font-bold">
                      <span className="sr-only">Step {i + 1}: </span>{s.title}
                    </h3>
                    {(s.time || s.required !== undefined) && (
                      <p className="mt-1.5 flex flex-wrap gap-2 text-xs font-semibold">
                        {s.time && <span className="rounded-full bg-white night:bg-gray-900 px-2.5 py-1 text-gray-700 night:text-gray-200 shadow-sm">{s.time}</span>}
                        {s.required === true && <span className="rounded-full bg-violet-600 px-2.5 py-1 text-white">Required</span>}
                        {s.required === false && <span className="rounded-full bg-white night:bg-gray-900 px-2.5 py-1 text-gray-500 night:text-gray-400 shadow-sm">Optional</span>}
                      </p>
                    )}
                    <p className="mt-2 text-gray-600 night:text-gray-300 leading-relaxed">{s.desc}</p>
                    {s.links && (
                      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        {s.links.map((l) => (
                          <a key={l.href} href={l.href} className={`font-semibold text-violet-700 night:text-violet-300 hover:text-violet-800 night:hover:text-violet-200 rounded ${FOCUS}`}>
                            {l.label} →
                          </a>
                        ))}
                      </p>
                    )}
                  </li>
                ))}
              </ol>

              <div>
                <p className="mb-4 text-sm font-semibold text-gray-500 night:text-gray-400 text-center lg:text-left">What the identity check looks like</p>
                <KycSlider phone={phoneStyle} />
                {/* Backed by the Help Center's retention answer: the ID provider deletes
                    verification data after a maximum of one month, and Pulse keeps only
                    verification-status metadata. Keep in step with VerifyPage's IdDataNote. */}
                <div className="mt-8 flex gap-4 rounded-2xl bg-green-50 night:bg-green-500/10 px-5 py-4">
                  <Icon path={LOCK} className="w-6 h-6 mt-0.5 shrink-0 text-green-600 night:text-green-400" />
                  <p className="text-sm text-green-800 night:text-green-300 leading-relaxed">
                    <span className="font-semibold">Your ID data is not kept.</span> Your documents
                    and selfie are automatically deleted after 30 days. Pulse only keeps a record
                    that your identity was verified.
                  </p>
                </div>
              </div>
            </div>

            {/* What if… */}
            <div className="mt-16">
              <h3 className="text-xl font-bold">What if…</h3>
              <ul className="mt-5 grid md:grid-cols-3 gap-5">
                {WHAT_IF.map((w) => (
                  <li key={w.q} className="rounded-2xl bg-white night:bg-gray-900 p-6 shadow-sm">
                    <h4 className="font-bold">{w.q}</h4>
                    <p className="mt-2 text-sm text-gray-600 night:text-gray-300 leading-relaxed">{w.a}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-gray-600 night:text-gray-300">
                Still stuck?{' '}
                <a href="mailto:pulse@affiliateroulette.com" className={`font-semibold text-violet-700 night:text-violet-300 hover:text-violet-800 night:hover:text-violet-200 rounded ${FOCUS}`}>
                  Contact Pulse Support
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Company: websites & representation */}
        <section id="company" className={`px-4 sm:px-6 py-16 sm:py-20 ${SECTION_SCROLL_MARGIN}`}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <Eyebrow>Websites &amp; representation</Eyebrow>
              <h2 className={H2}>Show which company you work for</h2>
              <p className={LEAD}>Choose how to verify. Each route gives different access on Pulse.</p>
            </div>

            <div className="mt-10 grid md:grid-cols-3 gap-5">
              {WEBSITE_ROUTES.map((r) => <RouteCard key={r.title} route={r} />)}
            </div>

            <p className="mt-8 text-sm text-gray-500 night:text-gray-400 max-w-3xl mx-auto text-center">
              A business can only be claimed once. After an admin verifies by head tag or DNS, everyone
              else joins by company email as a Representative — no approval needed.
            </p>
          </div>
        </section>

        {/* Social verification — step 3, in detail */}
        <section id="social" className={`px-4 sm:px-6 py-16 sm:py-20 bg-lavender night:bg-violet-950/30 ${SECTION_SCROLL_MARGIN}`}>
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Eyebrow>Social verification</Eyebrow>
                <h2 className={H2}>Connect your professional social accounts securely</h2>
                <p className={LEAD}>{SOCIAL.lead}</p>
                <CheckList items={SOCIAL.points} />
              </div>
              <SocialProfileVisual />
            </div>

            <p className="mt-14 text-sm text-gray-500 night:text-gray-400 max-w-3xl mx-auto text-center">
              Identity verification is mandatory. Website and social profile verification are
              optional, but they provide additional context and help others understand who you are
              and who you represent.
            </p>
          </div>
        </section>

        {/* Mid-page CTA */}
        <section className="px-4 sm:px-6 py-10">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 rounded-2xl border border-violet-100 night:border-violet-500/20 bg-violet-50 night:bg-violet-500/10 px-6 sm:px-8 py-6 text-center sm:text-left">
            <div>
              <h2 className="text-xl font-bold">Ready to get verified?</h2>
              <p className="mt-1 text-sm text-gray-600 night:text-gray-300">Create your account and verify your identity in a couple of minutes.</p>
            </div>
            <Link
              to="/signup"
              className={`shrink-0 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors ${FOCUS}`}
            >
              Create free account
            </Link>
          </div>
        </section>

        {/* Features */}
        <section id="features" className={`px-4 sm:px-6 py-16 sm:py-20 border-t border-gray-100 night:border-gray-800 ${SECTION_SCROLL_MARGIN}`}>
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mx-auto text-center">
              <Eyebrow>Features</Eyebrow>
              <h2 className={H2}>Everything your business communication needs</h2>
              <p className={LEAD}>
                Pulse brings the tools you use every day into one professional workspace, so you can
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
                        <span className="w-11 h-11 rounded-xl bg-violet-50 night:bg-violet-500/10 text-violet-600 night:text-violet-300 flex items-center justify-center shrink-0">
                          <Icon path={f.path} className="w-5 h-5" />
                        </span>
                        <div>
                          <h3 className="flex flex-wrap items-center gap-2 text-lg font-bold">
                            {f.title}
                            {f.pro && <ProBadge />}
                          </h3>
                          <p className="mt-1.5 text-gray-600 night:text-gray-300 leading-relaxed">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-14 text-center">
              <Link to="/#pricing" className={`inline-flex items-center gap-1.5 font-semibold text-violet-700 night:text-violet-300 hover:text-violet-800 night:hover:text-violet-200 rounded ${FOCUS}`}>
                Compare Free and Pro
                <Icon path="M13 7l5 5m0 0l-5 5m5-5H6" className="w-4 h-4" />
              </Link>
            </p>
          </div>
        </section>

        {/* Share links */}
        <section id="share-links" className={`px-4 sm:px-6 py-16 sm:py-20 bg-lavender night:bg-violet-950/30 ${SECTION_SCROLL_MARGIN}`}>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <Eyebrow>Share links</Eyebrow>
              <h2 className={H2}>Share your verified profile anywhere</h2>
              <p className={LEAD}>
                Give people an easy way to find you on Pulse and confirm your identity before they
                get in touch. This is especially useful for affiliate managers and other
                professionals who are often impersonated.
              </p>
              <div className="mt-8 space-y-6">
                {SHARE_ITEMS.map((s) => (
                  <div key={s.title} className="flex gap-3">
                    <span aria-hidden="true" className="w-2 h-2 mt-2 rounded-full bg-violet-500 shrink-0" />
                    <div>
                      <h3 className="font-bold">{s.title}</h3>
                      <p className="mt-1 text-sm text-gray-600 night:text-gray-300 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <ShareLinksMockup />
          </div>
        </section>

        {/* Comparison */}
        <section id="compare" className={`px-4 sm:px-6 py-16 sm:py-20 ${SECTION_SCROLL_MARGIN}`}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <Eyebrow>Compare</Eyebrow>
              <h2 className={H2}>How Pulse compares</h2>
              <p className={LEAD}>General messengers show you a username. Pulse shows you who is behind it.</p>
            </div>

            {/* All four columns fit on a phone; sideways scrolling is only a fallback below 320px. */}
            <div className="mt-10 max-w-3xl mx-auto overflow-x-auto rounded-2xl ring-1 ring-gray-200 night:ring-gray-700">
              <table className="w-full min-w-80 text-left text-xs sm:text-sm">
                <caption className="sr-only">Pulse compared with Telegram and Microsoft Teams</caption>
                <thead>
                  <tr className="border-b border-gray-200 night:border-gray-700">
                    <th scope="col" className="px-3 sm:px-5 py-4 font-semibold text-gray-500 night:text-gray-400">Feature</th>
                    {COMPARISON.columns.map((c, i) => (
                      <th key={c} scope="col" className={`px-2 sm:px-5 py-4 text-center font-bold ${i === 0 ? 'bg-violet-50 night:bg-violet-500/10 text-violet-700 night:text-violet-300' : 'text-gray-900 night:text-white'}`}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.rows.map((r) => (
                    <tr key={r.label} className="border-b border-gray-100 night:border-gray-800 last:border-b-0">
                      <th scope="row" className="px-3 sm:px-5 py-3.5 font-medium text-gray-700 night:text-gray-200">{r.label}</th>
                      {r.values.map((v, i) => (
                        <td key={COMPARISON.columns[i]} className={`px-2 sm:px-5 py-3.5 text-center ${i === 0 ? 'bg-violet-50/60 night:bg-violet-500/10' : ''}`}>
                          <CompareCell value={v} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Security and privacy */}
        <section id="security" className={`px-4 sm:px-6 py-16 sm:py-20 bg-gray-900 text-white ${SECTION_SCROLL_MARGIN}`}>
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Eyebrow dark>Security</Eyebrow>
                <h2 className={H2}>Security and privacy</h2>
                <p className="mt-4 text-gray-400 night:text-gray-500 leading-relaxed">
                  Being verified should not mean being exposed. You control how discoverable you are
                  and who can contact you.
                </p>
              </div>
              <PrivacyMockup />
            </div>

            <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-7">
              {SECURITY.map((s) => (
                <div key={s.title}>
                  <h3 className="flex items-center gap-2.5 font-semibold">
                    <span aria-hidden="true" className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-gray-400 night:text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-14 rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 sm:p-8">
              <h3 className="text-lg font-bold">What Pulse can see</h3>
              <ul className="mt-4 space-y-3">
                {WHAT_PULSE_SEES.map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                    <Icon path={LOCK} className="w-4 h-4 mt-0.5 shrink-0 text-violet-300" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className={`px-4 sm:px-6 py-16 sm:py-20 bg-gray-50 night:bg-gray-950 ${SECTION_SCROLL_MARGIN}`}>
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mx-auto mb-10 text-center">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className={H2}>Frequently asked questions</h2>
              <p className={LEAD}>Everything you might want to know before joining Pulse.</p>
            </div>
            <div className="max-w-4xl mx-auto">
              <FaqSection darkMode={dark} categories={FAQ_CATEGORIES} featured={FAQ_FEATURED} linkable />
            </div>
          </div>
        </section>

        <CtaBanner
          title="Ready to join Pulse?"
          body="Create your account, verify your identity and connect with iGaming professionals in one trusted workspace."
          buttonLabel="Create free account"
        />
      </main>

      <MarketingFooter />
    </div>
  )
}
