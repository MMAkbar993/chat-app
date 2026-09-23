import { useState } from 'react'

// The business profile card itself. Shared by the public page at /b/:slug and by the in-app
// popup, so a share link and "View Business" inside Pulse always show the same thing.

function Icon({ d, className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  )
}

const I = {
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  briefcase: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  pin: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  external: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  share: 'M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
}

function Chip({ icon, children, dm }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${dm ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-200 bg-white text-gray-700'}`}>
      {icon}
      {children}
    </span>
  )
}

export default function BusinessProfileView({ business: b, team = [], viewerId, onMessage, shareUrl, darkMode, onBack }) {
  const [copied, setCopied] = useState(false)
  const dm = darkMode
  const cardCls = dm ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
  const headingCls = dm ? 'text-white' : 'text-gray-900'
  const bodyCls = dm ? 'text-gray-300' : 'text-gray-700'
  const boxCls = dm ? 'border-gray-700 text-gray-200 hover:border-violet-500' : 'border-gray-200 text-gray-800 hover:border-violet-300'
  const websiteHref = b.website_url
    ? (/^https?:\/\//i.test(b.website_url) ? b.website_url : `https://${b.website_url}`)
    : null
  const foundedYear = b.founded_on ? new Date(b.founded_on).getFullYear() : null

  async function share() {
    const url = shareUrl || window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: b.name, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Share sheet dismissed, or clipboard blocked — nothing to report.
    }
  }

  return (
    <div className={`rounded-2xl shadow-sm border overflow-hidden ${cardCls}`}>
      {/* Cover with the identity overlaid on it */}
      <div
        className={`relative bg-cover bg-center ${b.cover_url ? '' : 'bg-linear-to-br from-violet-700 via-purple-700 to-fuchsia-700'}`}
        style={b.cover_url ? { backgroundImage: `url(${b.cover_url})` } : undefined}
      >
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/35 to-black/10" />
        {/* Sits on the cover rather than floating outside the card. It's a back arrow because
            this opens on top of the profile popup or search it was opened from, and closing it
            returns you there rather than dismissing everything. */}
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur ring-1 ring-white/40 text-white flex items-center justify-center transition-colors"
          >
            <Icon d="M15 19l-7-7 7-7" className="w-5 h-5" />
          </button>
        )}
        {/* On a phone the logo sits beside the name rather than stacked above it, which pushed
            everything down the card. */}
        <div className="relative px-5 sm:px-7 pt-12 sm:pt-16 pb-4 flex flex-row flex-wrap items-end gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-lg overflow-hidden shrink-0 flex items-center justify-center text-xl font-extrabold text-gray-900">
            {b.logo_url ? <img src={b.logo_url} alt="" className="w-full h-full object-cover" /> : b.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-white">
              <span className="truncate">{b.name}</span>
              {/* Same outline check the personal profile's verified badges use, not a filled disc. */}
              <Icon d={I.check} className="w-5 h-5 text-green-400 shrink-0" />
            </h1>
            {b.industry && <p className="text-sm text-white/85 truncate">{b.industry}</p>}
          </div>
          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
            {websiteHref && (
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-sm font-semibold ring-1 ring-white/30 transition-colors"
              >
                <Icon d={I.external} /> Visit Website
              </a>
            )}
            <button
              onClick={share}
              aria-label="Share"
              title={copied ? 'Link copied' : 'Share'}
              className="w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white ring-1 ring-white/30 flex items-center justify-center transition-colors"
            >
              <Icon d={copied ? 'M5 13l4 4L19 7' : I.share} className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-7 py-6 space-y-6">
        <div className="flex flex-wrap gap-2">
          <Chip dm={dm} icon={<Icon d={I.check} className="w-3.5 h-3.5 text-green-500" />}>Verified Business</Chip>
          {b.industry && <Chip dm={dm} icon={<Icon d={I.briefcase} className="w-3.5 h-3.5 text-violet-500" />}>{b.industry}</Chip>}
          {b.headquarters && <Chip dm={dm} icon={<Icon d={I.pin} className="w-3.5 h-3.5 text-red-500" />}>{b.headquarters}</Chip>}
          {foundedYear && <Chip dm={dm} icon={<Icon d={I.calendar} className="w-3.5 h-3.5 text-blue-500" />}>Founded {foundedYear}</Chip>}
        </div>

        {b.about && <p className={`text-sm leading-relaxed whitespace-pre-line ${bodyCls}`}>{b.about}</p>}

        {(b.website_url || b.email) && (
          <section>
            <h2 className={`text-sm font-bold mb-2.5 ${headingCls}`}>Company Information</h2>
            <div className="flex flex-wrap gap-2.5">
              {websiteHref && (
                <a href={websiteHref} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${boxCls}`}>
                  <Icon d={I.check} className="w-4 h-4 text-green-500" /> {b.domain}
                </a>
              )}
              {b.email && (
                <a href={`mailto:${b.email}`} className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${boxCls}`}>
                  <Icon d={I.mail} className="w-4 h-4 text-violet-500" /> {b.email}
                </a>
              )}
            </div>
          </section>
        )}

        {b.services?.length > 0 && (
          <section>
            <h2 className={`text-sm font-bold mb-2.5 ${headingCls}`}>Services</h2>
            <div className="flex flex-wrap gap-2">
              {b.services.map((s) => <Chip key={s} dm={dm}>{s}</Chip>)}
            </div>
          </section>
        )}

        {team.length > 0 && (
          <section>
            <h2 className={`text-sm font-bold mb-2.5 ${headingCls}`}>Team Members</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {team.map((m) => {
                const name = m.display_name || m.full_name || m.username
                const isMe = viewerId === m.id
                return (
                  <div key={m.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                    <span className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-white font-bold ${m.avatar_url ? '' : 'bg-violet-500'}`}>
                      {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" /> : (name || '?')[0].toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${headingCls}`}>{name}</p>
                      <p className={`text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{m.job_title || (m.is_owner ? 'Owner' : 'Team member')}</p>
                    </div>
                    {!isMe && (
                      <button
                        onClick={() => onMessage?.(m)}
                        className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${dm ? 'border-violet-500/60 text-violet-300 hover:bg-violet-500/15' : 'border-violet-300 text-violet-700 hover:bg-violet-50'}`}
                      >
                        Message
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
