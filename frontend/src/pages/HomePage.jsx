import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HOME_META } from './howItWorksMeta'
import { HOME_CONTENT as C } from './homeContent'
import { Icon, Eyebrow, MarketingHeader, MarketingFooter, CtaBanner } from '../components/marketing/MarketingChrome'
import { HERO_BG, FOCUS, usePageMeta, useScrollOnArrive } from '../components/marketing/marketingHelpers'
import { TrustedChatMockup, ProfileMockup } from '../components/marketing/HowItWorksMockups'
import { QaRow } from '../components/settings/FaqSection'

// The short sales page at "/". How It Works stays the detailed explainer; this page makes the
// case in about a third of the length and links there for depth. All copy lives in
// homeContent.js — edit it there.

const NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

// text-balance evens out line lengths, so a heading never leaves one word alone on its last line.
const H2 = 'mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight text-balance'
const LEAD = 'mt-4 text-gray-600 leading-relaxed'
const CHECK = 'M5 13l4 4L19 7'
const ARROW = 'M13 7l5 5m0 0l-5 5m5-5H6'
const BTN_PRIMARY = `inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-colors shadow-md shadow-violet-600/20 ${FOCUS}`
const BTN_SECONDARY = `inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-gray-200 hover:border-violet-300 font-semibold transition-colors ${FOCUS}`

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
  const { logos, stats, logosLabel } = C.socialProof
  if (!logos.length && !stats.length) return null
  return (
    <section aria-label="Social proof" className="px-4 sm:px-6 py-10 border-y border-gray-100">
      <div className="max-w-6xl mx-auto">
        {logos.length > 0 ? (
          <>
            <p className="text-center text-sm font-medium text-gray-500">{logosLabel}</p>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {logos.map((l) => (
                <li key={l.src}>
                  <img src={l.src} alt={l.alt} className="h-8 w-auto opacity-70 grayscale" />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {stats.map((s) => (
              // Label first in the markup (as a definition list requires), number first on screen.
              <div key={s.label} className="flex flex-col-reverse">
                <dt className="text-sm text-gray-500">{s.label}</dt>
                <dd className="text-3xl font-extrabold tracking-tight text-gray-900">{s.value}</dd>
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

  // overflow-x-clip, not -hidden: hidden makes this div a scroll container, which stops the
  // sticky header sticking — it would scroll away with the page.
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-clip">
      <MarketingHeader nav={NAV} />

      <main>
        {/* 1. Hero */}
        <section className="px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24" style={HERO_BG}>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Eyebrow>{C.hero.badge}</Eyebrow>
              <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-balance">
                {C.hero.headline}
              </h1>
              <p className="mt-5 text-lg text-gray-600 leading-relaxed">{C.hero.subtext}</p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link to={C.hero.primaryCta.to} className={BTN_PRIMARY}>{C.hero.primaryCta.label}</Link>
                <Link to={C.hero.secondaryCta.to} className={BTN_SECONDARY}>{C.hero.secondaryCta.label}</Link>
              </div>
              <p className="mt-4 text-sm text-gray-500">{C.hero.footnote}</p>
            </div>
            <TrustedChatMockup />
          </div>
        </section>

        {/* 2. Social proof — renders nothing until homeContent has real values */}
        <SocialProof />

        {/* 3. The problem */}
        <section className="px-4 sm:px-6 py-16 sm:py-20 bg-lavender">
          <div className="max-w-6xl mx-auto">
            <SectionIntro eyebrow={C.problem.eyebrow} heading={C.problem.heading} />
            <ul className="mt-10 grid md:grid-cols-3 gap-5">
              {C.problem.cards.map((c) => (
                <li key={c.title} className="rounded-2xl bg-white p-6 shadow-sm">
                  <span className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                    <Icon path={c.icon} />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{c.body}</p>
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
                <li key={c.title} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <span className="w-11 h-11 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center">
                    <Icon path={c.icon} />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-600 leading-relaxed flex-1">{c.body}</p>
                  <Link
                    to={c.to}
                    aria-label={`${C.fixes.linkLabel} about ${c.title.toLowerCase()}`}
                    className={`mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-violet-700 hover:text-violet-800 rounded ${FOCUS}`}
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
        <section className="px-4 sm:px-6 py-16 sm:py-20 bg-lavender">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Eyebrow>{C.showcase.eyebrow}</Eyebrow>
              <h2 className={H2}>{C.showcase.heading}</h2>
              <p className={LEAD}>{C.showcase.body}</p>
              <ul className="mt-6 space-y-3">
                {C.showcase.points.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-gray-600">
                    <span className="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
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
                  className={`flex flex-col rounded-3xl bg-white p-7 ${
                    p.highlighted ? 'ring-2 ring-violet-600 shadow-xl shadow-violet-900/10' : 'ring-1 ring-gray-200 shadow-sm'
                  }`}
                >
                  <h3 className={`text-lg font-bold ${p.highlighted ? 'text-violet-700' : 'text-gray-900'}`}>{p.name}</h3>
                  <p className="mt-3 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
                    <span className="text-gray-500">{p.period}</span>
                  </p>
                  <p className="mt-1 h-5 text-sm text-gray-500">{p.note}</p>
                  <ul className="mt-6 space-y-3 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-3 text-sm text-gray-700">
                        <Icon path={CHECK} className="w-5 h-5 shrink-0 text-violet-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={p.cta.to}
                    className={`mt-8 inline-flex justify-center rounded-xl px-6 py-3 font-bold transition-colors ${FOCUS} ${
                      p.highlighted
                        ? 'bg-violet-600 hover:bg-violet-700 text-white'
                        : 'bg-white border border-gray-200 hover:border-violet-300 text-gray-900'
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
        <section id="faq" className="px-4 sm:px-6 py-16 sm:py-20 bg-gray-50 scroll-mt-16">
          <div className="max-w-6xl mx-auto">
            <SectionIntro eyebrow={C.faq.eyebrow} heading={C.faq.heading} />
            <div className="mt-10 max-w-3xl mx-auto rounded-2xl border border-gray-100 bg-white px-5 py-2">
              {C.faq.items.map((item) => (
                <QaRow
                  key={item.q}
                  item={item}
                  darkMode={false}
                  open={openFaq === item.q}
                  onToggle={() => setOpenFaq(openFaq === item.q ? null : item.q)}
                />
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                to={C.faq.seeAll.to}
                className={`inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 hover:text-violet-800 rounded ${FOCUS}`}
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
