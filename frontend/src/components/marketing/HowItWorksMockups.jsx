import { useEffect, useState } from 'react'
import SocialIcon from '../ui/SocialIcon'
import { P } from './mockupIcons'
import { I, Avatar, Tick, WindowFrame } from './MockupParts'

// Illustrations for the public How It Works page, drawn as miniature Pulse UI rather than
// stock art — the whole point is that a first-time visitor recognises "this is a messenger,
// like Telegram or Teams" at a glance. People, companies and figures are all fictional.
// Everything here is decorative, so each mockup is hidden from screen readers; the section
// copy next to it carries the actual meaning.


// ─── Verification ───────────────────────────────────────────────────────────

// ─── The app itself ─────────────────────────────────────────────────────────
// What a member sees after signing in: chat list, an open conversation, a call coming in. Used by
// the home page so visitors can tell at a glance that Pulse is a messenger like Telegram or Teams.

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
          <div className="hidden md:flex flex-col items-center gap-3 w-14 py-4 border-r border-gray-100 night:border-gray-800 bg-gray-50 night:bg-gray-950">
            <span className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center"><I d={P.chat} /></span>
            {[P.user, P.group, P.phone, P.gear].map((d) => (
              <span key={d} className="w-8 h-8 rounded-lg text-gray-400 night:text-gray-500 flex items-center justify-center"><I d={d} /></span>
            ))}
          </div>

          {/* Chat list */}
          <div className="hidden sm:flex flex-col w-[40%] lg:w-[36%] border-r border-gray-100 night:border-gray-800">
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <span className="text-sm font-bold text-gray-900 night:text-white">Chats</span>
              <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center"><I d={P.plus} className="w-3.5 h-3.5" /></span>
            </div>
            <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg bg-gray-100 night:bg-gray-800 px-2.5 py-1.5 text-[11px] text-gray-400 night:text-gray-500">
              <I d={P.search} className="w-3 h-3" /> Search chats
            </div>
            {CHAT_LIST.map((c) => (
              <div key={c.name} className={`flex items-center gap-2.5 px-4 py-2.5 ${c.active ? 'bg-violet-50 night:bg-violet-500/10' : ''}`}>
                <Avatar name={c.name} color={c.color} className="w-9 h-9 text-[11px]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 min-w-0">
                      <span className="text-xs font-semibold text-gray-900 night:text-white truncate">{c.name}</span>
                      {!c.group && <Tick className="w-3 h-3" />}
                    </span>
                    <span className="text-[9px] text-gray-400 night:text-gray-500 shrink-0">{c.time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-gray-500 night:text-gray-400 truncate">{c.preview}</span>
                    {c.unread && (
                      <span className="w-4 h-4 rounded-full bg-gray-500 text-white text-[9px] font-medium flex items-center justify-center shrink-0">{c.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Conversation */}
          <div className="flex-1 min-w-0 flex flex-col bg-gray-50 night:bg-gray-950">
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white night:bg-gray-900 border-b border-gray-100 night:border-gray-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name="Daniel Reyes" color="from-sky-400 to-blue-600" className="w-8 h-8 text-[11px]" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-xs font-semibold text-gray-900 night:text-white">Daniel Reyes <Tick className="w-3 h-3" /></p>
                  <p className="text-[10px] text-gray-500 night:text-gray-400 truncate">Affiliate Manager · northstarbet.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-violet-600 night:text-violet-300 shrink-0">
                <I d={P.phone} /><I d={P.video} />
              </div>
            </div>

            <div className="flex-1 px-4 py-4 flex flex-col gap-2.5 overflow-hidden">
              <div className="self-start max-w-[80%] rounded-2xl rounded-tl-sm bg-white night:bg-gray-900 shadow-sm px-3 py-2 text-[11px] text-gray-700 night:text-gray-200">
                Hi! Thanks for reaching out, happy to talk about a partnership.
              </div>
              <div className="self-end max-w-[80%] rounded-2xl rounded-tr-sm bg-violet-600 px-3 py-2 text-[11px] text-white">
                Great. I run two casino review sites, both verified on my profile.
              </div>
              <div className="self-start flex items-center gap-2.5 rounded-2xl rounded-tl-sm bg-white night:bg-gray-900 shadow-sm px-3 py-2">
                <span className="w-8 h-8 rounded-lg bg-violet-50 night:bg-violet-500/10 text-violet-600 night:text-violet-300 flex items-center justify-center"><I d={P.file} /></span>
                <span>
                  <span className="block text-[11px] font-medium text-gray-800 night:text-gray-100">Commission_Plan_2026.pdf</span>
                  <span className="block text-[9px] text-gray-400 night:text-gray-500">240 KB</span>
                </span>
              </div>
              <div className="self-end max-w-[80%] rounded-2xl rounded-tr-sm bg-violet-600 px-3 py-2 text-[11px] text-white">
                Perfect. Let's jump on a quick call?
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 bg-white night:bg-gray-900 border-t border-gray-100 night:border-gray-800">
              <I d={P.plus} className="w-4 h-4 text-gray-400 night:text-gray-500" />
              <span className="flex-1 rounded-full bg-gray-100 night:bg-gray-800 px-3 py-1.5 text-[11px] text-gray-400 night:text-gray-500">Type a message…</span>
              <I d={P.mic} className="w-4 h-4 text-gray-400 night:text-gray-500" />
            </div>
          </div>
        </div>
      </WindowFrame>

      {/* Floating callouts — the two things that make Pulse different from any other chat app */}
      <div className="hidden sm:flex absolute -top-5 -right-4 lg:-right-8 items-center gap-2.5 rounded-xl bg-white night:bg-gray-900 px-3.5 py-2.5 shadow-xl ring-1 ring-gray-100 night:ring-gray-800">
        <span className="w-8 h-8 rounded-lg bg-green-50 night:bg-green-500/10 text-green-600 night:text-green-400 flex items-center justify-center"><I d={P.shield} /></span>
        <span className="text-left">
          <span className="block text-xs font-bold text-gray-900 night:text-white">KYC Verified</span>
          <span className="block text-[10px] text-gray-500 night:text-gray-400">Identity confirmed</span>
        </span>
      </div>
      <div className="hidden sm:flex absolute -bottom-6 -left-4 lg:-left-8 items-center gap-3 rounded-xl bg-white night:bg-gray-900 px-3.5 py-2.5 shadow-xl ring-1 ring-gray-100 night:ring-gray-800">
        <Avatar name="Daniel Reyes" color="from-sky-400 to-blue-600" className="w-9 h-9 text-[11px]" />
        <span className="text-left">
          <span className="block text-xs font-bold text-gray-900 night:text-white">Daniel Reyes</span>
          <span className="block text-[10px] text-gray-500 night:text-gray-400">Incoming video call…</span>
        </span>
        <span className="flex gap-1.5 ml-1">
          <span className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center"><I d={P.x} className="w-3.5 h-3.5" /></span>
          <span className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center"><I d={P.video} className="w-3.5 h-3.5" /></span>
        </span>
      </div>
    </div>
  )
}

// The page someone lands on when they open a shared profile link (/u/username), drawn the way
// PublicProfilePage draws it — banner with Send Message, chips, websites, verified accounts —
// inside a browser window whose address bar shows the link itself. Keep the two in step.
const PUBLIC_SOCIALS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'twitter', label: 'X (Twitter)' },
]

export function PublicProfileMockup() {
  return (
    <div aria-hidden="true" className="relative max-w-lg mx-auto lg:mr-0 w-full">
      <div className="rounded-2xl border border-gray-200 night:border-gray-700 bg-gray-50 night:bg-gray-950 shadow-2xl shadow-violet-900/15 overflow-hidden text-left">
        {/* Browser chrome: the shared link is the point of this picture */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white night:bg-gray-900 border-b border-gray-100 night:border-gray-800">
          <span className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="flex-1 min-w-0 flex items-center gap-1.5 rounded-lg bg-gray-100 night:bg-gray-800 px-3 py-1.5 text-[11px] text-gray-600 night:text-gray-300">
            <I d={P.lock} className="w-3 h-3 shrink-0 text-gray-400 night:text-gray-500" />
            <span className="truncate">pulse.affiliateroulette.com/u/<span className="font-semibold text-gray-900 night:text-white">danielreyes</span></span>
          </span>
        </div>

        {/* The share page as members now see it (pages/PublicProfilePage.jsx): keep the two in step. */}
        <div className="p-4">
          <div className="rounded-2xl bg-white night:bg-gray-900 border border-gray-100 night:border-gray-800 overflow-hidden">
            <div className="px-5 pt-5 pb-5 text-center bg-linear-to-b from-violet-100/70 via-violet-50/40 to-white night:from-violet-500/15 night:via-violet-500/5 night:to-gray-900">
              <div className="relative mx-auto w-16 h-16">
                <img src="/marketing/people/daniel-video.jpg" alt="" className="w-16 h-16 rounded-full object-cover ring-[3px] ring-white night:ring-gray-900 shadow-md" style={{ objectPosition: '50% 10%' }} />
                <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-violet-600 text-white ring-2 ring-white night:ring-gray-900 flex items-center justify-center">
                  <I d={P.check} className="w-2.5 h-2.5" stroke={3.5} />
                </span>
              </div>
              <p className="mt-2 text-base font-bold text-gray-900 night:text-white">Daniel Reyes</p>
              <p className="text-[11px] text-gray-500 night:text-gray-400">@danielreyes</p>
              <p className="mt-1 text-xs font-medium text-violet-700 night:text-violet-300">Affiliate Manager · Malta</p>
              <span className="relative mt-3 inline-flex items-center justify-center rounded-lg bg-linear-to-r from-sky-400 to-violet-600 px-8 py-2 text-xs font-semibold text-white shadow-md">
                Send Message
                {/* A soft pulse so the eye lands on the action this section is about */}
                <span className="absolute -inset-1 rounded-xl ring-2 ring-violet-400/40 animate-pulse motion-reduce:animate-none" />
              </span>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 night:border-gray-800">
              <p className="text-xs text-gray-600 night:text-gray-300 leading-relaxed">
                Affiliate Manager at Northstar Bet. Always open to new partnerships with quality affiliates and publishers.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 night:border-gray-700 bg-white night:bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-gray-700 night:text-gray-200">
                  <I d={P.check} className="w-3 h-3 text-green-500" stroke={3} /> northstarbet.com
                </span>
                {PUBLIC_SOCIALS.map((s) => (
                  <span key={s.key} title={s.label} className="w-7 h-7 rounded-full border border-gray-200 night:border-gray-700 bg-white night:bg-gray-900 flex items-center justify-center">
                    <SocialIcon platform={s.key} size={14} />
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 night:border-gray-800 bg-gray-50 night:bg-gray-950/60 px-4 py-3 text-center">
              <p className="text-[11px] text-gray-500 night:text-gray-400 leading-relaxed">
                <span className="font-semibold text-gray-700 night:text-gray-200">Your connections deserve confidence.</span>{' '}
                This member's identity has been verified through Pulse using a government-issued ID.
              </p>
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
  { src: '/marketing/kyc-2-document.png', label: 'Prepare your document', alt: 'Prepare your document screen asking for the country and type of ID, and a photo of the front', country: 'Malta' },
  { src: '/marketing/kyc-3-camera.png', label: 'Prepare for the camera', alt: 'Prepare for the camera screen with tips: good lighting, nothing covering your face, no glasses' },
  { src: '/marketing/kyc-4-selfie.png', label: 'Selfie capture', alt: 'Selfie capture screen with a face positioned inside an oval frame' },
  { src: '/marketing/kyc-5-verified.png', label: "You've been verified", alt: "Confirmation screen reading You've been verified, no further action needed" },
]

const SLIDE_MS = 3500

// "tall" (default): real-phone proportions — a home-indicator strip under the screen, thin
// gradient bezel and side buttons, so it reads as a modern handset rather than a stubby one.
// "classic": the previous frame. Kept for comparison via ?phone=classic; delete the loser.
// TODO: retake kyc-2-document.png in Didit with Malta selected, then delete this and the
// `country` on that slide. Until then this covers the screenshot's country chip (which reads
// Abkhazia) with one that matches it exactly. Measured from the 686×1161 image: chip at
// x 37–334, y 303–365, fill #f4f4f6; flag 27px wide, 23px in; text #272d3b, 25px, 76px in.
// Sizes are in cqw — percent of the screenshot's width — so it lines up in either phone frame.
function CountryChip({ name }) {
  return (
    <span
      aria-hidden="true"
      className="absolute flex items-center bg-[#f4f4f6] text-[#272d3b] font-medium leading-none whitespace-nowrap"
      style={{
        left: '5.39%', top: '26.10%', width: '43.44%', height: '5.43%',
        borderRadius: '3.2cqw', paddingLeft: '3.35cqw', gap: '3.79cqw', fontSize: '3.64cqw',
      }}
    >
      {/* Malta: white hoist, red fly. Drawn rather than an emoji — Windows shows flag emoji as letters. */}
      <svg viewBox="0 0 20 20" className="shrink-0" style={{ width: '3.94cqw', height: '3.94cqw' }}>
        <defs>
          <clipPath id="malta-flag-clip"><circle cx="10" cy="10" r="10" /></clipPath>
        </defs>
        <g clipPath="url(#malta-flag-clip)">
          <rect width="10" height="20" fill="#ffffff" />
          <rect x="10" width="10" height="20" fill="#cf142b" />
        </g>
        <circle cx="10" cy="10" r="9.5" fill="none" stroke="rgba(0,0,0,0.12)" />
      </svg>
      {name}
    </span>
  )
}

function KycScreen({ index, tall }) {
  return (
    <>
      <div className={`relative flex items-center justify-between px-6 text-[11px] font-semibold text-gray-900 ${tall ? 'pt-3.5 pb-2' : 'pt-2.5 pb-1'}`}>
        <span>9:41</span>
        <span aria-hidden="true" className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-[#111018] ${tall ? 'top-2.5 w-24 h-6' : 'top-2 w-20 h-5'}`} />
        <span aria-hidden="true" className="flex items-center gap-1">
          <svg className="w-3.5 h-2.5" viewBox="0 0 14 10" fill="currentColor"><rect x="0" y="6" width="2.5" height="4" rx=".6"/><rect x="3.8" y="4" width="2.5" height="6" rx=".6"/><rect x="7.6" y="2" width="2.5" height="8" rx=".6"/><rect x="11.4" y="0" width="2.5" height="10" rx=".6"/></svg>
          <svg className="w-5 h-2.5" viewBox="0 0 20 10" fill="none"><rect x=".5" y=".5" width="16" height="9" rx="2.5" stroke="currentColor"/><rect x="2" y="2" width="11" height="6" rx="1.2" fill="currentColor"/><rect x="17.5" y="3.5" width="1.5" height="3" rx=".7" fill="currentColor"/></svg>
        </span>
      </div>
      {/* @container: CountryChip sizes itself as a share of this box's width */}
      <div className="relative aspect-680/1150 @container">
        {KYC_SLIDES.map((s, i) => (
          <div
            key={s.src}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-500 ${i === index ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={s.src} alt={s.alt} loading="lazy" className="w-full h-full object-cover" />
            {s.country && <CountryChip name={s.country} />}
          </div>
        ))}
      </div>
      {tall && (
        <div aria-hidden="true" className="h-10 flex items-end justify-center pb-2.5">
          <span className="w-28 h-1 rounded-full bg-gray-900" />
        </div>
      )}
    </>
  )
}

function PhoneFrame({ variant, index }) {
  if (variant === 'classic') {
    return (
      <div className="w-60 rounded-[2.75rem] bg-[#1B1533] p-2.5 shadow-2xl shadow-violet-900/25 ring-1 ring-black/10">
        <div className="relative rounded-[2.15rem] overflow-hidden bg-white">
          <KycScreen index={index} />
        </div>
      </div>
    )
  }
  return (
    <div className="relative w-64">
      {/* Side buttons */}
      <span aria-hidden="true" className="absolute -left-[3px] top-24 w-[3px] h-7 rounded-l bg-gray-700" />
      <span aria-hidden="true" className="absolute -left-[3px] top-36 w-[3px] h-12 rounded-l bg-gray-700" />
      <span aria-hidden="true" className="absolute -left-[3px] top-52 w-[3px] h-12 rounded-l bg-gray-700" />
      <span aria-hidden="true" className="absolute -right-[3px] top-40 w-[3px] h-20 rounded-r bg-gray-700" />
      <div className="rounded-[3rem] bg-linear-to-b from-gray-600 via-gray-800 to-gray-900 p-[7px] shadow-2xl shadow-violet-900/30 ring-1 ring-black/20">
        <div className="relative rounded-[2.6rem] overflow-hidden bg-white ring-1 ring-black/40">
          <KycScreen index={index} tall />
        </div>
      </div>
    </div>
  )
}

export function KycSlider({ phone = 'tall' }) {
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
      className="relative flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/3 top-1/2 w-80 h-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/20 blur-3xl"
      />

      {/* Phone. The screenshots are of the screen alone, so without a status bar and island
          they read as a card in a frame rather than a phone — which is what looked squashed. */}
      <div className="relative flex flex-col items-center gap-4 shrink-0">
        <PhoneFrame variant={phone} index={index} />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous step"
            className="w-9 h-9 rounded-full bg-white night:bg-gray-900 shadow-sm ring-1 ring-gray-200 night:ring-gray-700 text-gray-600 night:text-gray-300 hover:text-violet-600 night:hover:text-violet-300 flex items-center justify-center transition-colors"
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
            className="w-9 h-9 rounded-full bg-white night:bg-gray-900 shadow-sm ring-1 ring-gray-200 night:ring-gray-700 text-gray-600 night:text-gray-300 hover:text-violet-600 night:hover:text-violet-300 flex items-center justify-center transition-colors"
          >
            <I d="M9 5l7 7-7 7" />
          </button>
        </div>
      </div>

      {/* Step list in its own card — doubles as the caption and lets people jump to a screen —
          with who actually runs the check underneath. */}
      <div className="relative w-full sm:w-60 flex flex-col gap-4">
        <ol className="rounded-2xl bg-white night:bg-gray-900 p-2 ring-1 ring-gray-100 night:ring-gray-800 shadow-[0_16px_40px_-16px_rgba(76,29,149,0.28)] space-y-0.5">
          {KYC_SLIDES.map((s, i) => (
            <li key={s.src}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={i === index ? 'step' : undefined}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  i === index ? 'bg-violet-50 night:bg-violet-500/10' : 'hover:bg-gray-50 night:hover:bg-gray-800'
                }`}
              >
                <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                  i < index ? 'bg-green-500 text-white' : i === index ? 'bg-violet-600 text-white' : 'bg-violet-100 night:bg-violet-500/20 text-violet-600 night:text-violet-300'
                }`}>
                  {i < index ? <I d={P.check} className="w-3.5 h-3.5" stroke={3} /> : i + 1}
                </span>
                <span className={`text-sm ${i === index ? 'font-semibold text-gray-900 night:text-white' : 'text-gray-500 night:text-gray-400'}`}>{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="flex items-center gap-3 rounded-2xl bg-white night:bg-gray-900 px-4 py-3 ring-1 ring-gray-100 night:ring-gray-800 shadow-[0_16px_40px_-16px_rgba(76,29,149,0.28)]">
          <span className="w-10 h-10 rounded-full bg-violet-100 night:bg-violet-500/20 text-violet-600 night:text-violet-300 flex items-center justify-center shrink-0">
            <I d={P.shield} className="w-5 h-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-gray-900 night:text-white">Verified by Didit</span>
            <span className="block text-xs text-gray-500 night:text-gray-400">ID and liveness check</span>
          </span>
        </div>
      </div>
    </div>
  )
}

const SOCIAL_ACCOUNTS = [
  { key: 'twitter', label: 'X' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'kick', label: 'Kick' },
  { key: 'twitch', label: 'Twitch' },
]

const CARD_SHADOW = 'shadow-[0_16px_40px_-16px_rgba(76,29,149,0.28)]'

export function SocialProfileVisual() {
  return (
    <div aria-hidden="true" className="relative flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/3 top-1/2 w-80 h-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/20 blur-3xl"
      />

      {/* What a stranger sees on the profile */}
      <div className="relative rounded-3xl bg-violet-100/70 night:bg-violet-500/15 p-4 shrink-0">
        <div className={`w-60 rounded-2xl bg-white night:bg-gray-900 overflow-hidden ${CARD_SHADOW}`}>
          <div className="h-16 bg-linear-to-r from-violet-600 to-purple-400" />
          <div className="-mt-10 flex flex-col items-center px-5 pb-5">
            <span className="relative">
              <Avatar name="Daniel Reyes" color="from-sky-400 to-blue-600" className="w-20 h-20 text-xl ring-4 ring-white night:ring-gray-900" />
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-violet-600 ring-2 ring-white night:ring-gray-900 text-white flex items-center justify-center">
                <I d={P.check} className="w-3.5 h-3.5" stroke={3} />
              </span>
            </span>
            <p className="mt-3 text-base font-bold text-gray-900 night:text-white">Daniel Reyes</p>
            <p className="text-xs text-gray-500 night:text-gray-400">Affiliate Manager</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 night:bg-green-500/10 px-2.5 py-1 text-[11px] font-semibold text-green-700 night:text-green-300">
              <I d={P.check} className="w-3 h-3" stroke={3} /> Identity verified
            </span>
            <p className="mt-4 self-start text-xs font-medium text-gray-500 night:text-gray-400">Connected profiles</p>
            <div className="mt-2 self-start flex gap-1.5">
              {SOCIAL_ACCOUNTS.map((a) => <SocialIcon key={a.key} platform={a.key} size={34} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Bracket from the card out to each account */}
      <svg className="hidden sm:block w-8 h-[260px] text-violet-300 shrink-0" viewBox="0 0 32 260" fill="none">
        <path d="M0 130H14M32 32Q16 32 16 48V212Q16 228 32 228" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>

      <ul className={`relative w-52 rounded-2xl bg-white night:bg-gray-900 p-2 ring-1 ring-gray-100 night:ring-gray-800 divide-y divide-gray-100 night:divide-gray-800 ${CARD_SHADOW}`}>
        {SOCIAL_ACCOUNTS.map((a) => (
          <li key={a.key} className="h-12 flex items-center gap-3 px-2">
            <SocialIcon platform={a.key} size={30} />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-gray-900 night:text-white leading-tight">{a.label}</span>
              <span className="block text-[11px] text-gray-500 night:text-gray-400">Verified</span>
            </span>
            <span className="w-6 h-6 rounded-full bg-green-50 night:bg-green-500/10 ring-1 ring-green-100 night:ring-green-500/20 text-green-600 night:text-green-400 flex items-center justify-center">
              <I d={P.check} className="w-3 h-3" stroke={3} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Features ───────────────────────────────────────────────────────────────

export function GroupChatMockup() {
  return (
    <div aria-hidden="true">
      <WindowFrame>
        <div className="text-left bg-gray-50 night:bg-gray-950">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white night:bg-gray-900 border-b border-gray-100 night:border-gray-800">
            <Avatar name="EU Partners" color="from-violet-500 to-purple-600" className="w-8 h-8 text-[11px]" />
            <div>
              <p className="text-xs font-semibold text-gray-900 night:text-white">EU Partners</p>
              <p className="text-[10px] text-gray-500 night:text-gray-400">12 members</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-violet-50 night:bg-violet-500/10 border-b border-violet-100 night:border-violet-500/20 text-[10px] text-violet-700 night:text-violet-300">
            <I d={P.pin} className="w-3 h-3" /> <span className="font-semibold">Pinned:</span> Q3 targets are in the sheet below
          </div>
          <div className="px-4 py-4 flex flex-col gap-3">
            <div className="flex items-end gap-2">
              <Avatar name="Lena Fischer" color="from-pink-400 to-rose-500" className="w-6 h-6 text-[9px]" />
              <div>
                <div className="rounded-2xl rounded-bl-sm bg-white night:bg-gray-900 shadow-sm px-3 py-2">
                  <p className="text-[10px] font-semibold text-pink-500">Lena Fischer</p>
                  <p className="text-[11px] text-gray-700 night:text-gray-200">Signed the new deal with Spinwave 🎉</p>
                </div>
                <div className="flex gap-1 mt-1">
                  <span className="rounded-full bg-white night:bg-gray-900 shadow-sm px-1.5 py-0.5 text-[10px]">🎉 4</span>
                  <span className="rounded-full bg-white night:bg-gray-900 shadow-sm px-1.5 py-0.5 text-[10px]">👍 2</span>
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
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-white night:bg-gray-900 shadow-sm px-3 py-2">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-[8px]">▶</span>
                <span className="flex items-center gap-0.5 h-5">
                  {[6, 12, 8, 16, 10, 18, 7, 14, 9, 12, 6, 10].map((h, i) => (
                    <span key={i} className="w-0.5 rounded-full bg-violet-300" style={{ height: h }} />
                  ))}
                </span>
                <span className="text-[9px] text-gray-400 night:text-gray-500">0:14</span>
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
          <span className="text-[10px] text-gray-400 night:text-gray-500">12:47</span>
        </span>
      </div>

      {/* Shared screen: a dashboard being presented */}
      <div className="relative rounded-xl bg-white night:bg-gray-900 p-4">
        <p className="text-[11px] font-bold text-gray-900 night:text-white mb-3">Affiliate dashboard · Q3</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[['Clicks', '24.1k'], ['FTDs', '312'], ['Revenue', '€18.4k']].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-gray-50 night:bg-gray-950 px-2.5 py-2">
              <p className="text-[9px] text-gray-400 night:text-gray-500">{k}</p>
              <p className="text-sm font-bold text-gray-900 night:text-white">{v}</p>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2 h-24">
          {bars.map((h, i) => (
            <span key={i} className="flex-1 rounded-t bg-linear-to-t from-violet-600 to-violet-400" style={{ height: `${h}%` }} />
          ))}
        </div>
        {/* Picture-in-picture of the other participant */}
        <div className="absolute bottom-3 right-3 w-20 h-14 rounded-lg bg-linear-to-br from-sky-400 to-blue-600 ring-2 ring-white night:ring-gray-900 shadow-lg flex items-center justify-center">
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
      <div className="rounded-2xl bg-white night:bg-gray-900 shadow-2xl shadow-violet-900/10 ring-1 ring-gray-100 night:ring-gray-800 p-5 text-left">
        <p className="text-sm font-bold text-gray-900 night:text-white mb-3">Add Contact</p>
        <p className="text-[11px] font-semibold text-gray-700 night:text-gray-200 mb-1.5">Search by Business Name</p>
        <div className="flex items-center gap-2 rounded-xl border border-violet-300 night:border-violet-500 ring-2 ring-violet-100 night:ring-violet-500/30 bg-white night:bg-gray-900 px-3 py-2 mb-3">
          <I d={P.search} className="w-3.5 h-3.5 text-gray-400 night:text-gray-500" />
          <span className="text-xs text-gray-900 night:text-white">northstar</span>
          <span className="w-px h-3.5 bg-violet-600 animate-pulse" />
        </div>
        <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400 night:text-gray-500 mb-2">3 results found for "northstar"</p>
        <div className="space-y-1">
          {SEARCH_RESULTS.map((r) => (
            <div key={r.name} className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5">
              <Avatar name={r.name} color={r.color} className="w-8 h-8 text-[10px]" />
              <div className="flex-1 min-w-0">
                <p className="flex items-center gap-1 text-xs font-semibold text-gray-900 night:text-white">{r.name} <Tick className="w-3 h-3" /></p>
                <p className="text-[10px] text-gray-500 night:text-gray-400 truncate">{r.title}</p>
                <p className="text-[10px] text-gray-400 night:text-gray-500 truncate">northstarbet.com</p>
              </div>
              <span className="rounded-full border border-violet-300 night:border-violet-500 px-2.5 py-1 text-[10px] font-semibold text-violet-600 night:text-violet-300">Add</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled meeting, overlapping the search card */}
      <div className="absolute -bottom-2 right-2 sm:-right-6 w-60 rounded-xl bg-white night:bg-gray-900 shadow-xl ring-1 ring-gray-100 night:ring-gray-800 p-3.5 text-left">
        <div className="flex items-start gap-2.5">
          <span className="w-9 h-9 rounded-lg bg-violet-600 text-white flex flex-col items-center justify-center leading-none shrink-0">
            <span className="text-[8px] font-semibold uppercase">Thu</span>
            <span className="text-sm font-bold">18</span>
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 night:text-white">Partnership call</p>
            <p className="text-[10px] text-gray-500 night:text-gray-400">14:00 – 14:30 · with Daniel Reyes</p>
            <p className="mt-1 inline-flex items-center gap-1 text-[9px] font-semibold text-green-700 night:text-green-300">
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
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white night:bg-gray-900 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 night:text-violet-300 ring-2 ring-violet-400/60">
                <I d={P.chat} className="w-3.5 h-3.5" /> Contact Us on Pulse
              </span>
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-[10px] text-slate-500">
            <span>Terms</span><span>Privacy</span><span>Responsible gaming</span><span>Contact</span>
          </div>
        </div>
      </WindowFrame>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white night:bg-gray-900 p-4 shadow-lg ring-1 ring-gray-100 night:ring-gray-800">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 night:text-gray-500 mb-2">Your share link</p>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 night:bg-gray-950 px-2.5 py-2">
            <span className="flex-1 min-w-0 truncate text-[11px] text-gray-700 night:text-gray-200">pulse.affiliateroulette.com/u/danielreyes</span>
            <span className="shrink-0 rounded-md bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white">Copy</span>
          </div>
        </div>
        <div className="rounded-2xl bg-white night:bg-gray-900 p-4 shadow-lg ring-1 ring-gray-100 night:ring-gray-800">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 night:text-gray-500 mb-2">Group invite link</p>
          <div className="flex items-center gap-2.5">
            <Avatar name="EU Partners" color="from-violet-500 to-purple-600" className="w-8 h-8 text-[10px]" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 night:text-white">EU Partners</p>
              <p className="text-[10px] text-gray-500 night:text-gray-400 truncate">12 members · /join/k7Qm2x</p>
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
