import { useState, useMemo } from 'react'
import { SUPPORT_MAILTO } from '../../config/site'
import { FAQ } from './faqContent'

// Flattened once so the search filter doesn't rebuild every answer's text on each keystroke.
const SEARCH_INDEX = new Map()
FAQ.forEach((group) => {
  group.items.forEach((item) => {
    const text = [item.q, ...item.a.flat()].join(' ').toLowerCase()
    SEARCH_INDEX.set(item, text)
  })
})

function Answer({ blocks, darkMode }) {
  const tone = darkMode ? 'text-gray-400' : 'text-gray-600'
  return (
    <div className="pb-4 pr-7 space-y-2">
      {blocks.map((block, i) =>
        Array.isArray(block) ? (
          <ul key={i} className={`text-sm leading-relaxed list-disc pl-5 space-y-1 ${tone}`}>
            {block.map((li, k) => <li key={k}>{li}</li>)}
          </ul>
        ) : (
          <p key={i} className={`text-sm leading-relaxed ${tone}`}>{block}</p>
        )
      )}
    </div>
  )
}

export function QaRow({ item, darkMode, open, onToggle, id }) {
  return (
    <div id={id} className={`border-b last:border-b-0 scroll-mt-32 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-start justify-between gap-3 text-left py-3.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      >
        <span className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{item.q}</span>
        <svg
          className={`w-4 h-4 mt-0.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <Answer blocks={item.a} darkMode={darkMode} />}
    </div>
  )
}

// "What is a liveness check?" → "faq-what-is-a-liveness-check". Stable as long as the question's
// wording is, so links to an answer keep working until someone rewrites the question.
function faqAnchor(q) {
  return 'faq-' + q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// `categories` limits which sections show (e.g. the public How It Works page only needs the
// ones a prospect asks about); omit it for the full Help Center.
// `featured` (optional) is a list of exact question texts. When given, only those show at first
// — in that order, as one "Common questions" card — with a button to reveal everything. Search
// still covers every question, so nothing is hidden from someone who goes looking.
// `linkable` (public page only) gives every question an id, writes it into the URL when the
// answer is opened, and opens the answer named in the URL on arrival — so
// /how-it-works#faq-what-is-a-liveness-check lands on that answer, open. Left off inside the app,
// where rewriting the address bar would be noise.
export default function FaqSection({ darkMode, categories, featured, linkable = false }) {
  const [search, setSearch] = useState('')
  // Read once, on arrival. Worked out before the first render rather than in an effect, so the
  // answer is already open — and its id already on the page — when the page scrolls to it.
  const [arrivedAt] = useState(() => {
    if (!linkable || typeof window === 'undefined') return null
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id.startsWith('faq-')) return null
    const scoped = categories ? FAQ.filter((g) => categories.includes(g.category)) : FAQ
    for (const g of scoped) {
      for (const item of g.items) {
        if (faqAnchor(item.q) === id) return { key: `${g.category}::${item.q}`, q: item.q }
      }
    }
    return null
  })
  // An answer outside the featured few needs the full list showing.
  const [showAll, setShowAll] = useState(Boolean(arrivedAt && featured && !featured.includes(arrivedAt.q)))
  // Keyed by "category::question" so two categories can't collide on a similar wording.
  const [openKey, setOpenKey] = useState(arrivedAt?.key ?? null)

  function toggle(key, q) {
    const next = openKey === key ? null : key
    setOpenKey(next)
    // replaceState rather than a router navigation: a navigation would re-run the page's
    // scroll-to-hash and jump the view on every click. Keeps the router's own history state.
    if (linkable) window.history.replaceState(window.history.state, '', next ? `#${faqAnchor(q)}` : '#faq')
  }

  const term = search.trim().toLowerCase()

  const groups = useMemo(() => {
    const scoped = categories ? FAQ.filter((g) => categories.includes(g.category)) : FAQ
    if (!term) return scoped
    // Search answers as well as questions — people describe the symptom they have, not the
    // question we happened to write ("cloudflare", "refund", "can't find the tag").
    return scoped
      .map((g) => ({ ...g, items: g.items.filter((i) => SEARCH_INDEX.get(i).includes(term)) }))
      .filter((g) => g.items.length > 0)
  }, [term, categories])

  const total = groups.reduce((n, g) => n + g.items.length, 0)

  const featuredItems = useMemo(() => {
    if (!featured) return null
    const all = FAQ.flatMap((g) => g.items.map((item) => ({ item, category: g.category })))
    const found = featured.map((q) => all.find((x) => x.item.q === q)).filter(Boolean)
    // A renamed question would otherwise just vanish from the list without a trace.
    if (import.meta.env.DEV && found.length !== featured.length) {
      console.warn('FaqSection: some featured questions were not found', featured.filter((q) => !all.some((x) => x.item.q === q)))
    }
    return found
  }, [featured])
  const scopedTotal = (categories ? FAQ.filter((g) => categories.includes(g.category)) : FAQ)
    .reduce((n, g) => n + g.items.length, 0)
  const collapsed = Boolean(featuredItems?.length) && !term && !showAll
  const card = `rounded-2xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className="space-y-4">
      <div className={`${card} p-5`}>
        <h4 className={`text-sm font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Pulse Help Center
        </h4>
        <p className={`text-xs mb-4 ${sub}`}>
          Answers about Pulse, identity verification, website and social verification, privacy,
          security, messaging, billing and managing your account.
        </p>

        <div className="relative">
          <svg
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the Help Center…"
            aria-label="Search the Help Center"
            className={`w-full rounded-xl pl-10 pr-9 py-2.5 text-sm outline-none border ${
              darkMode
                ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500'
                : 'bg-white border-gray-200 placeholder-gray-400'
            } focus:ring-2 focus:ring-violet-400`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {term && (
          <p role="status" className={`text-xs mt-2 ${sub}`}>
            {total === 0 ? (
              <>
                No answers match “{search.trim()}”. Try another word, or{' '}
                <a
                  href={SUPPORT_MAILTO}
                  className={`font-semibold underline underline-offset-2 ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}
                >
                  contact support
                </a>
                .
              </>
            ) : (
              `${total} ${total === 1 ? 'answer' : 'answers'} for “${search.trim()}”`
            )}
          </p>
        )}
      </div>

      {collapsed && (
        <>
          <div className={`${card} p-5`}>
            <h5 className={`text-xs font-bold uppercase tracking-wide mb-1 ${darkMode ? 'text-violet-300' : 'text-violet-600'}`}>
              Common questions
            </h5>
            <div>
              {featuredItems.map(({ item, category }) => {
                const key = `${category}::${item.q}`
                return (
                  <QaRow
                    key={key}
                    id={linkable ? faqAnchor(item.q) : undefined}
                    item={item}
                    darkMode={darkMode}
                    open={openKey === key}
                    onToggle={() => toggle(key, item.q)}
                  />
                )
              })}
            </div>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors ${
                darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              See all {scopedTotal} questions
            </button>
          </div>
        </>
      )}

      {!collapsed && groups.map((group) => (
        <div key={group.category} className={`${card} p-5`}>
          <h5 className={`text-xs font-bold uppercase tracking-wide mb-1 ${darkMode ? 'text-violet-300' : 'text-violet-600'}`}>
            {group.category}
          </h5>
          <div>
            {group.items.map((item) => {
              const key = `${group.category}::${item.q}`
              return (
                <QaRow
                  key={key}
                  id={linkable ? faqAnchor(item.q) : undefined}
                  item={item}
                  darkMode={darkMode}
                  // While searching, show every match expanded — collapsing a result set the
                  // user just filtered down to makes them click twice for what they asked for.
                  open={term ? true : openKey === key}
                  onToggle={() => toggle(key, item.q)}
                />
              )
            })}
          </div>
        </div>
      ))}

      <div className={`${card} p-5 flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Didn&apos;t find your answer?
          </p>
          <p className={`text-xs mt-0.5 ${sub}`}>Settings → Other → Feedback &amp; Support reaches our team.</p>
        </div>
        <a
          href={SUPPORT_MAILTO}
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors shrink-0"
        >
          Contact Support
        </a>
      </div>
    </div>
  )
}
