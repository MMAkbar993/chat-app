import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HOME_META } from './howItWorksMeta'
import { HOME_CONTENT as C } from './homeContent'
import { Icon, Eyebrow, MarketingHeader, MarketingFooter, CtaBanner } from '../components/marketing/MarketingChrome'
import { HERO_BG, FOCUS, usePageMeta, useScrollOnArrive, useMarketingTheme } from '../components/marketing/marketingHelpers'
import { TrustedChatMockup, ProfileMockup } from '../components/marketing/HowItWorksMockups'
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
    <section aria-label="Social proof" className="px-4 sm:px-6 py-10 border-y border-gray-100 night:border-gray-800">
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
        <section className="px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24" style={HERO_BG}>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Eyebrow>{C.hero.badge}</Eyebrow>
              <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-balance">
                {C.hero.headline}
              </h1>
              <p className="mt-5 text-lg text-gray-600 night:text-gray-300 leading-relaxed">{C.hero.subtext}</p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link to={C.hero.primaryCta.to} className={BTN_PRIMARY}>{C.hero.primaryCta.label}</Link>
                <Link to={C.hero.secondaryCta.to} className={BTN_SECONDARY}>{C.hero.secondaryCta.label}</Link>
              </div>
              <p className="mt-4 text-sm text-gray-500 night:text-gray-400">{C.hero.footnote}</p>
            </div>
            <TrustedChatMockup wide />
          </div>
        </section>

        {/* 2. Social proof — renders nothing until homeContent has real values */}
        <SocialProof />

        {/* 3. The problem */}
        <section className="px-4 sm:px-6 py-16 sm:py-20 bg-lavender night:bg-violet-950/30">
          <div className="max-w-6xl mx-auto">
            <SectionIntro eyebrow={C.problem.eyebrow} heading={C.problem.heading} />
            <ul className="mt-10 grid md:grid-cols-3 gap-5">
              {C.problem.cards.map((c) => (
                <li key={c.title} className="rounded-2xl bg-white night:bg-gray-900 p-6 shadow-sm">
                  <span className="w-11 h-11 rounded-xl bg-rose-50 night:bg-rose-500/10 text-rose-500 night:text-rose-400 flex items-center justify-center">
                    <Icon path={c.icon} />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-600 night:text-gray-300 leading-relaxed">{c.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. How Pulse fixes it */}
        <section className="px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto">
            <SectionIntro eyebrow={C.fixes.eyebrow} heading={C.fixes.heading} />
            <ul className="mt-10 grid md:grid-cols-3 gap-5">
              {C.fixes.cards.map((c) => (
                <li key={c.title} className="flex flex-col rounded-2xl border border-gray-100 night:border-gray-800 bg-white night:bg-gray-900 p-6 shadow-sm">
                  <span className="w-11 h-11 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center">
                    <Icon path={c.icon} />
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

        {/* 5. Verified profile showcase */}
        <section className="px-4 sm:px-6 py-16 sm:py-20 bg-lavender night:bg-violet-950/30">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Eyebrow>{C.showcase.eyebrow}</Eyebrow>
              <h2 className={H2}>{C.showcase.heading}</h2>
              <p className={LEAD}>{C.showcase.body}</p>
              <ul className="mt-6 space-y-3">
                {C.showcase.points.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-gray-600 night:text-gray-300">
                    <span className="w-7 h-7 rounded-lg bg-violet-100 night:bg-violet-500/20 text-violet-600 night:text-violet-300 flex items-center justify-center shrink-0">
                      <Icon path={CHECK} className="w-4 h-4" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link to={C.showcase.cta.to} className={`mt-8 ${BTN_PRIMARY}`}>{C.showcase.cta.label}</Link>
            </div>
            <ProfileMockup />
          </div>
        </section>

        {/* 6. Pricing */}
        <section id="pricing" className="px-4 sm:px-6 py-16 sm:py-20 scroll-mt-16">
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

        {/* 7. Short FAQ */}
        <section id="faq" className="px-4 sm:px-6 py-16 sm:py-20 bg-gray-50 night:bg-gray-950 scroll-mt-16">
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

        {/* 8. Final CTA */}
        <CtaBanner title={C.cta.title} body={C.cta.body} buttonLabel={C.cta.buttonLabel} />
      </main>

      <MarketingFooter />
    </div>
  )
}
