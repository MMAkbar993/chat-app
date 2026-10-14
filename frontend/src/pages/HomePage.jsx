import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HOME_META } from './howItWorksMeta'
import { HOME_CONTENT as C } from './homeContent'
import { Icon, Eyebrow, MarketingHeader, MarketingFooter } from '../components/marketing/MarketingChrome'
import { HERO_BG, FOCUS, usePageMeta, useScrollOnArrive, useMarketingTheme } from '../components/marketing/marketingHelpers'
import { AppMockup, PublicProfileMockup } from '../components/marketing/HowItWorksMockups'
import HomeHeroVisual from '../components/marketing/HomeHeroVisual'
import LiveChatWidget from '../components/marketing/LiveChatWidget'
import { QaRow } from '../components/settings/FaqSection'

// The short sales page at "/". How It Works stays the detailed explainer; this page makes the
// case in about a third of the length and links there for depth. All copy lives in
// homeContent.js — edit it there.

// ─── SOCIAL PROOF — fill these in ─────────────────────────────────────────────
// The section stays hidden on the live site until at least one logo has a file or one stat has
// a number, so a placeholder can never go out by accident. In development (npm run dev) an empty
// config shows grey placeholder boxes and "TODO" numbers instead, so the layout can be reviewed.
const SOCIAL_PROOF = {
  label: 'Trusted by affiliate teams across iGaming',
  // TODO: up to 5 partner logos. Put the files in frontend/public/marketing/logos/ and set
  // src to e.g. '/marketing/logos/brand.svg' and alt to the company name.
  // Get each company's permission before using their logo.
  logos: [
    { src: '', alt: 'Partner logo' }, // TODO
    { src: '', alt: 'Partner logo' }, // TODO
    { src: '', alt: 'Partner logo' }, // TODO
    { src: '', alt: 'Partner logo' }, // TODO
    { src: '', alt: 'Partner logo' }, // TODO
  ],
  // TODO: real numbers only. Leave a value empty ('') to leave that stat out.
  stats: [
    { value: '', suffix: '+', label: 'verified members' }, // TODO e.g. value: '1,200'
    { value: '', suffix: '', label: 'companies verified' }, // TODO e.g. value: '300'
    { value: '', suffix: '', label: 'countries' }, // TODO e.g. value: '40'
  ],
}
// ──────────────────────────────────────────────────────────────────────────────

const NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

// text-balance evens out line lengths, so a heading never leaves one word alone on its last line.
const H2 = 'mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight text-balance'
const LEAD = 'mt-4 text-gray-600 night:text-gray-300 leading-relaxed'
const CHECK = 'M5 13l4 4L19 7'
const ARROW = 'M13 7l5 5m0 0l-5 5m5-5H6'
const BTN_PRIMARY = `inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-colors shadow-md shadow-violet-600/20 ${FOCUS}`
// "€6.99", and "€70" rather than "€70.00".
const euro = (n) => `€${Number.isInteger(n) ? n : n.toFixed(2)}`
// Percentage saved by paying yearly, rounded down so it is never overstated.
const yearlySaving = (monthly, yearly) => Math.floor((1 - yearly / (monthly * 12)) * 100)

const BTN_SECONDARY = `inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl bg-white night:bg-gray-900 border border-gray-200 night:border-gray-700 hover:border-violet-300 night:hover:border-violet-500 font-semibold transition-colors ${FOCUS}`

// Where Pulse runs and when, from homeContent (availability). Today's option is green, the rest
// carry their release month. Side by side from 640px, joined by a line; stacked on phones.
// The Apple logo as published by Simple Icons (simpleicons.org, CC0).
const APPLE = 'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701'

const GLOBE = 'M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5 0 4.5-4 4.5-9S14.5 3 12 3 7.5 7 7.5 12s2 9 4.5 9zM3.5 9h17M3.5 15h17'
const MONITOR = 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'

function StepIcon({ icon }) {
  if (icon === 'apple') {
    return <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true"><path d={APPLE} /></svg>
  }
  return <Icon path={icon === 'web' ? GLOBE : MONITOR} className="w-4 h-4" />
}

function Availability({ label, steps }) {
  return (
    <div className="mt-8 max-w-lg mx-auto lg:mx-0 text-left">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-gray-400 night:text-gray-500">
        <span className="h-px flex-1 bg-gray-200 night:bg-gray-800" />
        {label}
        <span className="h-px flex-1 bg-gray-200 night:bg-gray-800" />
      </div>
      <ol className="relative mt-4 grid gap-3 sm:grid-cols-3 sm:gap-2">
        {/* the line through the steps: down the left on phones, across on wider screens */}
        <span aria-hidden="true" className="absolute left-[17px] top-4 bottom-4 w-px bg-violet-200 night:bg-violet-500/30 sm:left-[16.6%] sm:right-[16.6%] sm:top-[17px] sm:bottom-auto sm:w-auto sm:h-px" />
        {steps.map((s) => (
          <li key={s.name} className="relative flex items-center gap-3 sm:flex-col sm:text-center sm:gap-2">
            <span className={`relative z-10 w-9 h-9 shrink-0 rounded-full flex items-center justify-center ring-4 ring-white night:ring-gray-950 ${
              s.live
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                : 'bg-violet-50 text-violet-600 night:bg-violet-500/15 night:text-violet-300'
            }`}>
              <StepIcon icon={s.icon} />
            </span>
            <div className="min-w-0 flex-1 sm:flex-none">
              <p className="text-sm font-bold text-gray-900 night:text-white">{s.name}</p>
              <p className="text-xs text-gray-500 night:text-gray-400">{s.note}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
              s.live
                ? 'bg-green-50 text-green-700 night:bg-green-500/15 night:text-green-300'
                : 'bg-violet-100 text-violet-700 night:bg-violet-500/15 night:text-violet-300'
            }`}>
              {s.live && <span className="inline-block w-1.5 h-1.5 mr-1.5 mb-px rounded-full bg-green-500 animate-pulse" />}
              {s.status}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function SectionIntro({ eyebrow, heading, children }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className={H2}>{heading}</h2>
      {children && <p className={LEAD}>{children}</p>}
    </div>
  )
}

function SocialProof() {
  const logos = SOCIAL_PROOF.logos.filter((l) => l.src)
  const stats = SOCIAL_PROOF.stats.filter((s) => String(s.value).trim())
  const preview = import.meta.env.DEV && !logos.length && !stats.length
  if (!preview && !logos.length && !stats.length) return null

  const shownStats = preview
    ? SOCIAL_PROOF.stats.map((s) => ({ ...s, value: 'TODO' }))
    : stats

  return (
    <section aria-label="Social proof" className="px-6 py-10 border-y border-gray-100 night:border-gray-800">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm font-medium text-gray-500 night:text-gray-400">{SOCIAL_PROOF.label}</p>

        {/* Wraps three to a row on phones with the last row centred, one row from tablet up. */}
        {(preview || logos.length > 0) && (
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-5 sm:gap-x-12">
            {preview
              ? SOCIAL_PROOF.logos.map((l, i) => (
                  <li key={i}>
                    <span role="img" aria-label={l.alt} className="block h-8 w-24 rounded-md bg-gray-300/60 night:bg-gray-700/60" />
                  </li>
                ))
              : logos.map((l) => (
                  <li key={l.src}>
                    <img src={l.src} alt={l.alt} className="h-8 w-auto max-w-28 object-contain opacity-70 grayscale" />
                  </li>
                ))}
          </ul>
        )}

        {shownStats.length > 0 && (
          <dl className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 text-center">
            {shownStats.map((s) => (
              // Label first in the markup (as a definition list requires), number first on screen.
              <div key={s.label} className="flex flex-col-reverse">
                <dt className="text-sm text-gray-500 night:text-gray-400">{s.label}</dt>
                <dd className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 night:text-white">{s.value}{s.suffix}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
}

export default function HomePage() {
  const { hash } = useLocation()
  usePageMeta(HOME_META)
  useScrollOnArrive(hash)
  const [openFaq, setOpenFaq] = useState(null)
  const [dark, toggleTheme] = useMarketingTheme()

  // overflow-x-clip, not -hidden: hidden makes this div a scroll container, which stops the
  // sticky header sticking — it would scroll away with the page.
  return (
    <div
      data-theme={dark ? 'dark' : 'light'}
      style={{ colorScheme: dark ? 'dark' : 'light' }}
      className="min-h-screen bg-white night:bg-gray-950 text-gray-900 night:text-white overflow-x-clip"
    >
      <MarketingHeader nav={NAV} theme={{ dark, onToggle: toggleTheme }} />

      <main>
        {/* 1. Hero */}
        <section className="px-6 pt-14 sm:pt-20 pb-16 sm:pb-24" style={HERO_BG}>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Eyebrow>{C.hero.badge}</Eyebrow>
              <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-balance">
                {C.hero.headline}{' '}
                <span className="block text-violet-600 night:text-violet-400">{C.hero.headlineAccent}</span>
              </h1>
              <p className="mt-5 text-lg text-gray-600 night:text-gray-300 leading-relaxed">{C.hero.subtext}</p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link to={C.hero.primaryCta.to} className={BTN_PRIMARY}>{C.hero.primaryCta.label}</Link>
                <Link to={C.hero.secondaryCta.to} className={BTN_SECONDARY}>{C.hero.secondaryCta.label}</Link>
              </div>
              <p className="mt-4 text-sm text-gray-500 night:text-gray-400">{C.hero.footnote}</p>
              {C.hero.availability && <Availability {...C.hero.availability} />}
            </div>
            <HomeHeroVisual />
          </div>
        </section>

        {/* 2. Social proof — renders nothing until homeContent has real values */}
        <SocialProof />

        {/* 3. The problem */}
        <section className="px-6 py-16 sm:py-20 bg-lavender night:bg-violet-950/30">
          <div className="max-w-6xl mx-auto">
            <SectionIntro eyebrow={C.problem.eyebrow} heading={C.problem.heading}>{C.problem.lead}</SectionIntro>
            <ul className="mt-10 grid md:grid-cols-3 gap-5">
              {C.problem.cards.map((c) => (
                <li key={c.title} className="rounded-2xl bg-white night:bg-gray-900 p-6 shadow-sm">
                  <span className="w-12 h-12 rounded-2xl bg-linear-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 ring-4 ring-rose-50 night:ring-rose-500/10">
                    <Icon path={c.icon} className="w-6 h-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-600 night:text-gray-300 leading-relaxed">{c.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. How Pulse fixes it */}
        <section className="px-6 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto">
            <SectionIntro eyebrow={C.fixes.eyebrow} heading={C.fixes.heading}>{C.fixes.lead}</SectionIntro>
            <ul className="mt-10 grid md:grid-cols-3 gap-5">
              {C.fixes.cards.map((c) => (
                <li key={c.title} className="flex flex-col rounded-2xl border border-gray-100 night:border-gray-800 bg-white night:bg-gray-900 p-6 shadow-sm">
                  <span className="w-12 h-12 rounded-2xl bg-linear-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/25 ring-4 ring-violet-50 night:ring-violet-500/10">
                    <Icon path={c.icon} className="w-6 h-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-600 night:text-gray-300 leading-relaxed flex-1">{c.body}</p>
                  <Link
                    to={c.to}
                    aria-label={`${C.fixes.linkLabel} about ${c.title.toLowerCase()}`}
                    className={`mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-violet-700 night:text-violet-300 hover:text-violet-800 night:hover:text-violet-200 rounded ${FOCUS}`}
                  >
                    {C.fixes.linkLabel}
                    <Icon path={ARROW} className="w-4 h-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. What Pulse looks like once you're in */}
        <section className="px-6 py-16 sm:py-20 bg-lavender night:bg-violet-950/30">
          <div className="max-w-6xl mx-auto">
            <SectionIntro eyebrow={C.app.eyebrow} heading={C.app.heading}>{C.app.lead}</SectionIntro>
            <div className="mt-12 max-w-5xl mx-auto">
              <AppMockup />
            </div>
          </div>
        </section>

        {/* 6. Verified profile showcase */}
        <section className="px-6 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Eyebrow>{C.showcase.eyebrow}</Eyebrow>
              <h2 className={H2}>{C.showcase.heading}</h2>
              <p className={LEAD}>{C.showcase.body}</p>
              <ul className="mt-6 space-y-3">
                {C.showcase.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-gray-600 night:text-gray-300">
                    <span className="w-7 h-7 rounded-lg bg-violet-100 night:bg-violet-500/20 text-violet-600 night:text-violet-300 flex items-center justify-center shrink-0">
                      <Icon path={CHECK} className="w-4 h-4" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link to={C.showcase.cta.to} className={`mt-8 ${BTN_PRIMARY}`}>{C.showcase.cta.label}</Link>
            </div>
            <PublicProfileMockup />
          </div>
        </section>

        {/* 7. Built for the iGaming industry */}
        <section className="px-6 py-16 sm:py-20 bg-lavender night:bg-violet-950/30">
          <div className="max-w-6xl mx-auto">
            <SectionIntro eyebrow={C.industries.eyebrow} heading={C.industries.heading}>{C.industries.lead}</SectionIntro>
            <ul className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {C.industries.cards.map((c) => (
                <li key={c.title} className="flex gap-4 rounded-2xl border border-gray-100 night:border-gray-800 bg-white night:bg-gray-900 p-6 shadow-sm">
                  <span className="w-11 h-11 rounded-xl bg-violet-50 night:bg-violet-500/10 text-violet-600 night:text-violet-300 flex items-center justify-center shrink-0">
                    <Icon path={c.icon} />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{c.title}</h3>
                    <p className="mt-1 text-sm text-gray-600 night:text-gray-300 leading-relaxed">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-center">
              <span className="inline-flex items-center rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-600/20">
                {C.industries.more}
              </span>
            </p>
          </div>
        </section>

        {/* 8. Pricing */}
        <section id="pricing" className="px-6 py-16 sm:py-20 scroll-mt-16">
          <div className="max-w-6xl mx-auto">
            <SectionIntro eyebrow={C.pricing.eyebrow} heading={C.pricing.heading} />
            <ul className="mt-10 max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
              {C.pricing.plans.map((p) => (
                <li
                  key={p.name}
                  className={`flex flex-col rounded-3xl bg-white night:bg-gray-900 p-7 ${
                    p.highlighted ? 'ring-2 ring-violet-600 shadow-xl shadow-violet-900/10' : 'ring-1 ring-gray-200 night:ring-gray-700 shadow-sm'
                  }`}
                >
                  <h3 className={`text-lg font-bold ${p.highlighted ? 'text-violet-700 night:text-violet-300' : 'text-gray-900 night:text-white'}`}>{p.name}</h3>
                  <p className="mt-3 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight">{p.monthly != null ? euro(p.monthly) : p.price}</span>
                    <span className="text-gray-500 night:text-gray-400">{p.period}</span>
                  </p>
                  <p className="mt-1 min-h-6 flex flex-wrap items-center gap-2 text-sm text-gray-500 night:text-gray-400">
                    {p.yearly != null && (
                      <>
                        <span>or {euro(p.yearly)}/year</span>
                        {yearlySaving(p.monthly, p.yearly) > 0 && (
                          <span className="inline-flex items-center rounded-full bg-green-50 night:bg-green-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 night:text-green-300">
                            save {yearlySaving(p.monthly, p.yearly)}%
                          </span>
                        )}
                      </>
                    )}
                  </p>
                  <ul className="mt-6 space-y-3 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-3 text-sm text-gray-700 night:text-gray-200">
                        <Icon path={CHECK} className="w-5 h-5 shrink-0 text-violet-600 night:text-violet-300" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={p.cta.to}
                    className={`mt-8 inline-flex justify-center rounded-xl px-6 py-3 font-bold transition-colors ${FOCUS} ${
                      p.highlighted
                        ? 'bg-violet-600 hover:bg-violet-700 text-white'
                        : 'bg-white night:bg-gray-900 border border-gray-200 night:border-gray-700 hover:border-violet-300 night:hover:border-violet-500 text-gray-900 night:text-white'
                    }`}
                  >
                    {p.cta.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 9. Short FAQ */}
        <section id="faq" className="px-6 py-16 sm:py-20 bg-gray-50 night:bg-gray-950 scroll-mt-16">
          <div className="max-w-6xl mx-auto">
            <SectionIntro eyebrow={C.faq.eyebrow} heading={C.faq.heading} />
            <div className="mt-10 max-w-3xl mx-auto rounded-2xl border border-gray-100 night:border-gray-800 bg-white night:bg-gray-900 px-5 py-2">
              {C.faq.items.map((item) => (
                <QaRow
                  key={item.q}
                  item={item}
                  darkMode={dark}
                  open={openFaq === item.q}
                  onToggle={() => setOpenFaq(openFaq === item.q ? null : item.q)}
                />
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                to={C.faq.seeAll.to}
                className={`inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 night:text-violet-300 hover:text-violet-800 night:hover:text-violet-200 rounded ${FOCUS}`}
              >
                {C.faq.seeAll.label}
                <Icon path={ARROW} className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      <MarketingFooter />
      <LiveChatWidget dark={dark} />
    </div>
  )
}
