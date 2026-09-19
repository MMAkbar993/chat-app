import { useEffect, useState } from 'react'
import SocialIcon from '../ui/SocialIcon'

// Illustrations for the public How It Works page, drawn as miniature Pulse UI rather than
// stock art — the whole point is that a first-time visitor recognises "this is a messenger,
// like Telegram or Teams" at a glance. People, companies and figures are all fictional.
// Everything here is decorative, so each mockup is hidden from screen readers; the section
// copy next to it carries the actual meaning.

const P = {
  chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  group: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-14a4 4 0 010 7.75M9 7a4 4 0 118 0 4 4 0 01-8 0z',
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  video: 'M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  gear: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  file: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  mic: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
  screen: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  plus: 'M12 4v16m8-8H4',
  check: 'M5 13l4 4L19 7',
  pin: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
  x: 'M6 18L18 6M6 6l12 12',
  shield: 'M9 12.75l1.5 1.5 3.75-3.75M12 3l7 3v5c0 4.5-3 8.25-7 9.5-4-1.25-7-5-7-9.5V6l7-3z',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
}

function I({ d, className = 'w-4 h-4', stroke = 2 }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} d={d} />
    </svg>
  )
}

function Avatar({ name, color, className = 'w-8 h-8 text-[11px]' }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('')
  return (
    <span className={`rounded-full shrink-0 flex items-center justify-center font-bold text-white bg-linear-to-br ${color} ${className}`}>
      {initials}
    </span>
  )
}

function Tick({ className = 'w-3.5 h-3.5' }) {
  return (
    <span className={`rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 ${className}`}>
      <I d={P.check} className="w-2/3 h-2/3" stroke={3.5} />
    </span>
  )
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-700">
      <I d={P.check} className="w-2.5 h-2.5 text-green-500" stroke={3} />
      {children}
    </span>
  )
}

function WindowFrame({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-violet-900/10 overflow-hidden ${className}`}>
      <div className="h-8 flex items-center gap-1.5 px-4 bg-[#1B1533]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
      </div>
      {children}
    </div>
  )
}

// ─── Hero: the whole app ────────────────────────────────────────────────────

const CHAT_LIST = [
  { name: 'Daniel Reyes', color: 'from-sky-400 to-blue-600', preview: "Let's jump on a quick call?", time: '10:42', active: true },
  { name: 'EU Partners', color: 'from-violet-500 to-purple-600', preview: 'Lena: Deal signed 🎉', time: '10:18', unread: 3, group: true },
  { name: 'Marta Kowalski', color: 'from-pink-400 to-rose-500', preview: 'Voice message', time: '09:55', unread: 1 },
  { name: 'Tom Becker', color: 'from-amber-400 to-orange-500', preview: 'Commission_Plan.pdf', time: 'Yesterday' },
  { name: 'Priya Nair', color: 'from-emerald-400 to-teal-500', preview: 'Thanks, talk Thursday', time: 'Yesterday' },
]

export function AppMockup() {
  return (
    <div aria-hidden="true" className="relative">
      <WindowFrame>
        <div className="flex h-105 text-left">
          {/* Nav rail */}
          <div className="hidden md:flex flex-col items-center gap-3 w-14 py-4 border-r border-gray-100 bg-gray-50">
            <span className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center"><I d={P.chat} /></span>
            {[P.user, P.group, P.phone, P.gear].map((d) => (
              <span key={d} className="w-8 h-8 rounded-lg text-gray-400 flex items-center justify-center"><I d={d} /></span>
            ))}
          </div>

          {/* Chat list */}
          <div className="hidden sm:flex flex-col w-[40%] lg:w-[36%] border-r border-gray-100">
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <span className="text-sm font-bold text-gray-900">Chats</span>
              <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center"><I d={P.plus} className="w-3.5 h-3.5" /></span>
            </div>
            <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] text-gray-400">
              <I d={P.search} className="w-3 h-3" /> Search chats
            </div>
            {CHAT_LIST.map((c) => (
              <div key={c.name} className={`flex items-center gap-2.5 px-4 py-2.5 ${c.active ? 'bg-violet-50' : ''}`}>
                <Avatar name={c.name} color={c.color} className="w-9 h-9 text-[11px]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 min-w-0">
                      <span className="text-xs font-semibold text-gray-900 truncate">{c.name}</span>
                      {!c.group && <Tick className="w-3 h-3" />}
                    </span>
                    <span className="text-[9px] text-gray-400 shrink-0">{c.time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-gray-500 truncate">{c.preview}</span>
                    {c.unread && (
                      <span className="w-4 h-4 rounded-full bg-gray-500 text-white text-[9px] font-medium flex items-center justify-center shrink-0">{c.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Conversation */}
          <div className="flex-1 min-w-0 flex flex-col bg-gray-50">
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white border-b border-gray-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name="Daniel Reyes" color="from-sky-400 to-blue-600" className="w-8 h-8 text-[11px]" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-xs font-semibold text-gray-900">Daniel Reyes <Tick className="w-3 h-3" /></p>
                  <p className="text-[10px] text-gray-500 truncate">Affiliate Manager · northstarbet.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-violet-600 shrink-0">
                <I d={P.phone} /><I d={P.video} />
              </div>
            </div>

            <div className="flex-1 px-4 py-4 flex flex-col gap-2.5 overflow-hidden">
              <div className="self-start max-w-[80%] rounded-2xl rounded-tl-sm bg-white shadow-sm px-3 py-2 text-[11px] text-gray-700">
                Hi! Thanks for reaching out — happy to talk about a partnership.
              </div>
              <div className="self-end max-w-[80%] rounded-2xl rounded-tr-sm bg-violet-600 px-3 py-2 text-[11px] text-white">
                Great. I run two casino review sites, both verified on my profile.
              </div>
              <div className="self-start flex items-center gap-2.5 rounded-2xl rounded-tl-sm bg-white shadow-sm px-3 py-2">
                <span className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><I d={P.file} /></span>
                <span>
                  <span className="block text-[11px] font-medium text-gray-800">Commission_Plan_2026.pdf</span>
                  <span className="block text-[9px] text-gray-400">240 KB</span>
                </span>
              </div>
              <div className="self-end max-w-[80%] rounded-2xl rounded-tr-sm bg-violet-600 px-3 py-2 text-[11px] text-white">
                Perfect. Let's jump on a quick call?
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-t border-gray-100">
              <I d={P.plus} className="w-4 h-4 text-gray-400" />
              <span className="flex-1 rounded-full bg-gray-100 px-3 py-1.5 text-[11px] text-gray-400">Type a message…</span>
              <I d={P.mic} className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </WindowFrame>

      {/* Floating callouts — the two things that make Pulse different from any other chat app */}
      <div className="hidden sm:flex absolute -top-5 -right-4 lg:-right-8 items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 shadow-xl ring-1 ring-gray-100">
        <span className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><I d={P.shield} /></span>
        <span className="text-left">
          <span className="block text-xs font-bold text-gray-900">KYC Verified</span>
          <span className="block text-[10px] text-gray-500">Identity confirmed</span>
        </span>
      </div>
      <div className="hidden sm:flex absolute -bottom-6 -left-4 lg:-left-8 items-center gap-3 rounded-xl bg-white px-3.5 py-2.5 shadow-xl ring-1 ring-gray-100">
        <Avatar name="Daniel Reyes" color="from-sky-400 to-blue-600" className="w-9 h-9 text-[11px]" />
        <span className="text-left">
          <span className="block text-xs font-bold text-gray-900">Daniel Reyes</span>
          <span className="block text-[10px] text-gray-500">Incoming video call…</span>
        </span>
        <span className="flex gap-1.5 ml-1">
          <span className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center"><I d={P.x} className="w-3.5 h-3.5" /></span>
          <span className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center"><I d={P.video} className="w-3.5 h-3.5" /></span>
        </span>
      </div>
    </div>
  )
}

// ─── Verification ───────────────────────────────────────────────────────────

export function ProfileMockup() {
  return (
    <div aria-hidden="true" className="relative max-w-sm mx-auto w-full">
      <div className="rounded-2xl bg-white shadow-2xl shadow-violet-900/10 ring-1 ring-gray-100 overflow-hidden text-left">
        <div className="h-16 bg-linear-to-r from-violet-500 to-violet-400" />
        <div className="px-5 pb-5">
          <div className="-mt-8 mb-2 relative w-fit">
            <Avatar name="Daniel Reyes" color="from-sky-400 to-blue-600" className="w-16 h-16 text-lg ring-4 ring-white" />
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
          </div>
          <p className="font-bold text-gray-900">Daniel Reyes</p>
          <p className="text-[11px] text-gray-400">@danielreyes</p>
          <p className="text-[11px] text-green-500 mb-3">Online</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <Badge>KYC Verified</Badge>
            <Badge>Website Verified</Badge>
            <Badge>Socials Verified</Badge>
          </div>
          <div className="rounded-xl bg-gray-50 p-3.5 grid grid-cols-2 gap-3 mb-2.5">
            {[['Company', 'northstarbet.com'], ['Job title', 'Affiliate Manager'], ['Location', 'Malta'], ['Joined', 'March 2026']].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">{k}</p>
                <p className="text-xs text-gray-800 truncate">{v}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-gray-50 p-3.5 mb-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Websites</p>
            <p className="flex items-center gap-1.5 text-xs font-medium text-violet-600">
              <I d={P.check} className="w-3 h-3 text-green-500" stroke={3} /> northstarbet.com
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Social profiles</p>
            <div className="flex gap-2">
              {['twitter', 'instagram', 'youtube'].map((k) => <SocialIcon key={k} platform={k} size={30} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Real screenshots of the identity check, in order. Labels are the screens' own headings.
// They live in /marketing/, not /how-it-works/: a real folder at a page's path makes Nginx's
// try_files match the directory instead of falling through to the SPA, and it 403s.
const KYC_SLIDES = [
  { src: '/marketing/kyc-1-start.png', label: 'Start verification', alt: 'Verification for Pulse start screen listing ID verification and face verification, approximately one minute' },
  { src: '/marketing/kyc-2-document.png', label: 'Prepare your document', alt: 'Prepare your document screen asking for the country and type of ID, and a photo of the front' },
  { src: '/marketing/kyc-3-camera.png', label: 'Prepare for the camera', alt: 'Prepare for the camera screen with tips: good lighting, nothing covering your face, no glasses' },
  { src: '/marketing/kyc-4-selfie.png', label: 'Selfie capture', alt: 'Selfie capture screen with a face positioned inside an oval frame' },
  { src: '/marketing/kyc-5-verified.png', label: "You've been verified", alt: "Confirmation screen reading You've been verified, no further action needed" },
]

const SLIDE_MS = 3500

export function KycSlider() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  // Auto-advancing is decoration, so it's off for anyone who has asked their OS for less
  // motion — they still get the arrows and the step list.
  const [reduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    if (paused || reduceMotion) return undefined
    const t = setTimeout(() => setIndex((i) => (i + 1) % KYC_SLIDES.length), SLIDE_MS)
    return () => clearTimeout(t)
  }, [index, paused, reduceMotion])

  const go = (i) => setIndex((i + KYC_SLIDES.length) % KYC_SLIDES.length)

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Identity verification steps"
      className="flex flex-col sm:flex-row items-center justify-center gap-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Phone */}
      <div className="flex flex-col items-center gap-4 shrink-0">
        <div className="w-60 sm:w-64 rounded-[2.5rem] bg-gray-900 p-2.5 shadow-2xl shadow-violet-900/20">
          <div className="relative rounded-4xl overflow-hidden bg-white aspect-680/1150">
            {KYC_SLIDES.map((s, i) => (
              <img
                key={s.src}
                src={s.src}
                alt={s.alt}
                aria-hidden={i !== index}
                loading="lazy"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === index ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous step"
            className="w-9 h-9 rounded-full bg-white shadow-sm ring-1 ring-gray-200 text-gray-600 hover:text-violet-600 flex items-center justify-center transition-colors"
          >
            <I d="M15 19l-7-7 7-7" />
          </button>
          <div className="flex gap-1.5">
            {KYC_SLIDES.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => go(i)}
                aria-label={`Step ${i + 1}: ${s.label}`}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-violet-600' : 'w-2 bg-violet-200 hover:bg-violet-300'}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next step"
            className="w-9 h-9 rounded-full bg-white shadow-sm ring-1 ring-gray-200 text-gray-600 hover:text-violet-600 flex items-center justify-center transition-colors"
          >
            <I d="M9 5l7 7-7 7" />
          </button>
        </div>
      </div>

      {/* Step list — doubles as the caption, and lets people jump to any screen */}
      <ol className="w-full sm:w-56 space-y-1.5">
        {KYC_SLIDES.map((s, i) => (
          <li key={s.src}>
            <button
              type="button"
              onClick={() => go(i)}
              aria-current={i === index ? 'step' : undefined}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                i === index ? 'bg-white shadow-sm' : 'hover:bg-white/60'
              }`}
            >
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                i < index ? 'bg-green-500 text-white' : i === index ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-600'
              }`}>
                {i < index ? <I d={P.check} className="w-3.5 h-3.5" stroke={3} /> : i + 1}
              </span>
              <span className={`text-sm ${i === index ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

// Small header graphics for the website and social verification cards.

export function MetaTagVisual() {
  return (
    <div aria-hidden="true" className="h-28 rounded-xl bg-[#1B1533] px-4 flex flex-col justify-center font-mono text-[10px] sm:text-[11px] leading-relaxed overflow-hidden">
      <span className="text-gray-500">&lt;<span className="text-pink-400">head</span>&gt;</span>
      <span className="pl-3 truncate">
        <span className="text-gray-500">&lt;</span><span className="text-pink-400">meta</span>{' '}
        <span className="text-sky-300">name</span><span className="text-gray-500">=</span><span className="text-amber-300">"site-verification"</span>
      </span>
      <span className="pl-7 truncate">
        <span className="text-sky-300">content</span><span className="text-gray-500">=</span><span className="text-amber-300">"8f3k2…"</span><span className="text-gray-500">&gt;</span>
      </span>
      <span className="text-gray-500">&lt;/<span className="text-pink-400">head</span>&gt;</span>
    </div>
  )
}

export function SocialConnectVisual() {
  return (
    <div aria-hidden="true" className="h-28 rounded-xl bg-lavender flex flex-col items-center justify-center gap-3">
      <div className="flex gap-2">
        {['affiliate_roulette', 'twitter', 'instagram', 'youtube', 'kick', 'twitch'].map((k) => (
          <SocialIcon key={k} platform={k} size={26} />
        ))}
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-green-700 shadow-sm">
        <I d={P.lock} className="w-3 h-3" /> Connected by secure login
      </span>
    </div>
  )
}

// ─── Features ───────────────────────────────────────────────────────────────

export function GroupChatMockup() {
  return (
    <div aria-hidden="true">
      <WindowFrame>
        <div className="text-left bg-gray-50">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white border-b border-gray-100">
            <Avatar name="EU Partners" color="from-violet-500 to-purple-600" className="w-8 h-8 text-[11px]" />
            <div>
              <p className="text-xs font-semibold text-gray-900">EU Partners</p>
              <p className="text-[10px] text-gray-500">12 members</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-violet-50 border-b border-violet-100 text-[10px] text-violet-700">
            <I d={P.pin} className="w-3 h-3" /> <span className="font-semibold">Pinned:</span> Q3 targets are in the sheet below
          </div>
          <div className="px-4 py-4 flex flex-col gap-3">
            <div className="flex items-end gap-2">
              <Avatar name="Lena Fischer" color="from-pink-400 to-rose-500" className="w-6 h-6 text-[9px]" />
              <div>
                <div className="rounded-2xl rounded-bl-sm bg-white shadow-sm px-3 py-2">
                  <p className="text-[10px] font-semibold text-pink-500">Lena Fischer</p>
                  <p className="text-[11px] text-gray-700">Signed the new deal with Spinwave 🎉</p>
                </div>
                <div className="flex gap-1 mt-1">
                  <span className="rounded-full bg-white shadow-sm px-1.5 py-0.5 text-[10px]">🎉 4</span>
                  <span className="rounded-full bg-white shadow-sm px-1.5 py-0.5 text-[10px]">👍 2</span>
                </div>
              </div>
            </div>
            <div className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-violet-600 px-3 py-2 text-white">
              <div className="border-l-2 border-white/60 pl-2 mb-1.5">
                <p className="text-[9px] font-semibold text-white/80">Lena Fischer</p>
                <p className="text-[10px] text-white/70 truncate">Signed the new deal with Spinwave 🎉</p>
              </div>
              <p className="text-[11px]">Huge — congrats! Sharing the targets now.</p>
            </div>
            <div className="self-end flex items-center gap-2.5 rounded-2xl rounded-br-sm bg-violet-600 px-3 py-2 text-white">
              <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center"><I d={P.file} className="w-3.5 h-3.5" /></span>
              <span>
                <span className="block text-[11px] font-medium">Q3_Targets.xlsx</span>
                <span className="block text-[9px] text-white/70">86 KB</span>
              </span>
            </div>
            <div className="flex items-end gap-2">
              <Avatar name="Tom Becker" color="from-amber-400 to-orange-500" className="w-6 h-6 text-[9px]" />
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-white shadow-sm px-3 py-2">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-[8px]">▶</span>
                <span className="flex items-center gap-0.5 h-5">
                  {[6, 12, 8, 16, 10, 18, 7, 14, 9, 12, 6, 10].map((h, i) => (
                    <span key={i} className="w-0.5 rounded-full bg-violet-300" style={{ height: h }} />
                  ))}
                </span>
                <span className="text-[9px] text-gray-400">0:14</span>
              </div>
            </div>
          </div>
        </div>
      </WindowFrame>
    </div>
  )
}

export function CallMockup() {
  const bars = [40, 62, 48, 75, 58, 88, 70]
  return (
    <div aria-hidden="true" className="rounded-2xl bg-gray-900 p-3 shadow-2xl shadow-violet-900/20 text-left">
      <div className="flex items-center justify-between px-1 pb-2.5">
        <span className="text-xs font-semibold text-white">Daniel Reyes</span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[9px] font-semibold text-white">
            <I d={P.screen} className="w-2.5 h-2.5" /> Sharing screen
          </span>
          <span className="text-[10px] text-gray-400">12:47</span>
        </span>
      </div>

      {/* Shared screen: a dashboard being presented */}
      <div className="relative rounded-xl bg-white p-4">
        <p className="text-[11px] font-bold text-gray-900 mb-3">Affiliate dashboard · Q3</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[['Clicks', '24.1k'], ['FTDs', '312'], ['Revenue', '€18.4k']].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-gray-50 px-2.5 py-2">
              <p className="text-[9px] text-gray-400">{k}</p>
              <p className="text-sm font-bold text-gray-900">{v}</p>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2 h-24">
          {bars.map((h, i) => (
            <span key={i} className="flex-1 rounded-t bg-linear-to-t from-violet-600 to-violet-400" style={{ height: `${h}%` }} />
          ))}
        </div>
        {/* Picture-in-picture of the other participant */}
        <div className="absolute bottom-3 right-3 w-20 h-14 rounded-lg bg-linear-to-br from-sky-400 to-blue-600 ring-2 ring-white shadow-lg flex items-center justify-center">
          <span className="text-sm font-bold text-white">DR</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 pt-3">
        {[P.mic, P.video].map((d) => (
          <span key={d} className="w-9 h-9 rounded-full bg-gray-700 text-white flex items-center justify-center"><I d={d} /></span>
        ))}
        <span className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center"><I d={P.screen} /></span>
        <span className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center">
          <I d={P.phone} className="w-4 h-4 rotate-135" />
        </span>
      </div>
    </div>
  )
}

const SEARCH_RESULTS = [
  { name: 'Daniel Reyes', title: 'Affiliate Manager', color: 'from-sky-400 to-blue-600' },
  { name: 'Sofia Laine', title: 'Head of Partnerships', color: 'from-emerald-400 to-teal-500' },
  { name: 'Marco Bianchi', title: 'CRM Lead', color: 'from-pink-400 to-rose-500' },
]

export function SearchMockup() {
  return (
    <div aria-hidden="true" className="relative pb-10 sm:pb-8">
      <div className="rounded-2xl bg-white shadow-2xl shadow-violet-900/10 ring-1 ring-gray-100 p-5 text-left">
        <p className="text-sm font-bold text-gray-900 mb-3">Add Contact</p>
        <p className="text-[11px] font-semibold text-gray-700 mb-1.5">Search by Business Name</p>
        <div className="flex items-center gap-2 rounded-xl border border-violet-300 ring-2 ring-violet-100 bg-white px-3 py-2 mb-3">
          <I d={P.search} className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-900">northstar</span>
          <span className="w-px h-3.5 bg-violet-600 animate-pulse" />
        </div>
        <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400 mb-2">3 results found for "northstar"</p>
        <div className="space-y-1">
          {SEARCH_RESULTS.map((r) => (
            <div key={r.name} className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5">
              <Avatar name={r.name} color={r.color} className="w-8 h-8 text-[10px]" />
              <div className="flex-1 min-w-0">
                <p className="flex items-center gap-1 text-xs font-semibold text-gray-900">{r.name} <Tick className="w-3 h-3" /></p>
                <p className="text-[10px] text-gray-500 truncate">{r.title}</p>
                <p className="text-[10px] text-gray-400 truncate">northstarbet.com</p>
              </div>
              <span className="rounded-full border border-violet-300 px-2.5 py-1 text-[10px] font-semibold text-violet-600">Add</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled meeting, overlapping the search card */}
      <div className="absolute -bottom-2 right-2 sm:-right-6 w-60 rounded-xl bg-white shadow-xl ring-1 ring-gray-100 p-3.5 text-left">
        <div className="flex items-start gap-2.5">
          <span className="w-9 h-9 rounded-lg bg-violet-600 text-white flex flex-col items-center justify-center leading-none shrink-0">
            <span className="text-[8px] font-semibold uppercase">Thu</span>
            <span className="text-sm font-bold">18</span>
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900">Partnership call</p>
            <p className="text-[10px] text-gray-500">14:00 – 14:30 · with Daniel Reyes</p>
            <p className="mt-1 inline-flex items-center gap-1 text-[9px] font-semibold text-green-700">
              <I d={P.calendar} className="w-2.5 h-2.5" /> Synced to Google Calendar
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Share links ────────────────────────────────────────────────────────────

// A company site's footer carrying a "Verified on Pulse" link, with the profile and group
// links it points at stacked alongside — the three places a share link actually ends up.
export function ShareLinksMockup() {
  return (
    <div aria-hidden="true" className="space-y-4 text-left">
      <WindowFrame>
        <div className="bg-[#0F1B2D] px-5 py-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-white">northstarbet.com</p>
              <p className="mt-1 text-[10px] text-slate-400">© 2026 Northstar Bet. All rights reserved.</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Affiliate team</p>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 ring-2 ring-violet-400/60">
                <I d={P.shield} className="w-3.5 h-3.5" /> Verified on Pulse
              </span>
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-[10px] text-slate-500">
            <span>Terms</span><span>Privacy</span><span>Responsible gaming</span><span>Contact</span>
          </div>
        </div>
      </WindowFrame>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-gray-100">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Your share link</p>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-2">
            <span className="flex-1 min-w-0 truncate text-[11px] text-gray-700">pulse.affiliateroulette.com/u/danielreyes</span>
            <span className="shrink-0 rounded-md bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white">Copy</span>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-gray-100">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Group invite link</p>
          <div className="flex items-center gap-2.5">
            <Avatar name="EU Partners" color="from-violet-500 to-purple-600" className="w-8 h-8 text-[10px]" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900">EU Partners</p>
              <p className="text-[10px] text-gray-500 truncate">12 members · /join/k7Qm2x</p>
            </div>
            <span className="shrink-0 rounded-md bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white">Join</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Security ───────────────────────────────────────────────────────────────

function Switch({ on }) {
  return (
    <span className={`relative w-9 h-5 rounded-full shrink-0 ${on ? 'bg-violet-500' : 'bg-gray-600'}`}>
      <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white ${on ? 'translate-x-4' : 'translate-x-0'}`} />
    </span>
  )
}

export function PrivacyMockup() {
  const rows = [
    { t: 'Hide my profile from search results', on: true },
    { t: 'Only my contacts can add me to groups', on: true },
  ]
  return (
    <div aria-hidden="true" className="rounded-2xl bg-gray-800 ring-1 ring-white/10 p-5 text-left shadow-2xl">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center"><I d={P.lock} /></span>
        <p className="text-sm font-bold text-white">Privacy</p>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.t} className="flex items-center justify-between gap-4 rounded-xl bg-gray-900/60 px-3.5 py-3">
            <span className="text-xs text-gray-200">{r.t}</span>
            <Switch on={r.on} />
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-900/60 px-3.5 py-3">
          <span className="text-xs text-gray-200">Two-factor authentication</span>
          <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">Enabled</span>
        </div>
      </div>
    </div>
  )
}
