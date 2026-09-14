import { useState, useMemo } from 'react'

// Telegram-style shared-media browser: one tab strip (Media / Files / Links) instead of the
// old stack of "Photos", "Videos", "Links", "Documents" accordions that all lived open in the
// same column at once. A conversation with hundreds of photos turned that column into an
// endless scroll with no landmarks — this groups each tab's items by month, the way Telegram
// does, so scanning back through history has something to aim for instead of just more grid.

function monthLabel(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
}

// Buckets already-sorted-descending items into contiguous month groups, preserving order.
function groupByMonth(items, dateOf) {
  const groups = []
  for (const item of items) {
    const label = monthLabel(dateOf(item))
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
}

function byRecency(a, b) {
  return new Date(b.created_at) - new Date(a.created_at)
}

function TabButton({ label, count, active, onClick, darkMode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
        active
          ? 'border-violet-500 text-violet-500'
          : darkMode
          ? 'border-transparent text-gray-500 hover:text-gray-300'
          : 'border-transparent text-gray-400 hover:text-gray-600'
      }`}
    >
      {label}{count > 0 ? ` (${count})` : ''}
    </button>
  )
}

function MonthHeader({ label, darkMode }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-wide px-3 pt-3 pb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      {label}
    </p>
  )
}

function EmptyState({ text, darkMode }) {
  return <p className={`px-3 py-6 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{text}</p>
}

export default function MediaGallery({ photos, videos, docs, links, darkMode, onOpenImage, onOpenVideo }) {
  const media = useMemo(
    () => [...photos.map((m) => ({ ...m, kind: 'image' })), ...videos.map((m) => ({ ...m, kind: 'video' }))].sort(byRecency),
    [photos, videos]
  )
  const fileGroups = useMemo(() => groupByMonth([...docs].sort(byRecency), (m) => m.created_at), [docs])
  const linkGroups = useMemo(() => groupByMonth([...links].sort(byRecency), (m) => m.created_at), [links])
  const mediaGroups = useMemo(() => groupByMonth(media, (m) => m.created_at), [media])

  const tabs = [
    { key: 'media', label: 'Media', count: media.length },
    { key: 'files', label: 'Files', count: docs.length },
    { key: 'links', label: 'Links', count: links.length },
  ]
  const [tab, setTab] = useState(() => tabs.find((t) => t.count > 0)?.key || 'media')

  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'

  return (
    <div>
      <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        {tabs.map((t) => (
          <TabButton key={t.key} {...t} active={tab === t.key} onClick={() => setTab(t.key)} darkMode={darkMode} />
        ))}
      </div>

      {tab === 'media' && (
        media.length === 0 ? <EmptyState text="No photos or videos shared yet." darkMode={darkMode} /> : (
          <div className="pb-2">
            {mediaGroups.map((group) => (
              <div key={group.label}>
                <MonthHeader label={group.label} darkMode={darkMode} />
                <div className="grid grid-cols-3 gap-0.5 px-2">
                  {group.items.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => (m.kind === 'image' ? onOpenImage(m.media_url) : onOpenVideo(m.media_url))}
                      className="relative aspect-square overflow-hidden rounded-sm focus:outline-none group"
                    >
                      {m.kind === 'image'
                        ? <img src={m.media_url} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                        : <video src={m.media_url} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />}
                      {m.kind === 'video' && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white translate-x-px" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'files' && (
        docs.length === 0 ? <EmptyState text="No files shared yet." darkMode={darkMode} /> : (
          <div className="pb-2">
            {fileGroups.map((group) => (
              <div key={group.label}>
                <MonthHeader label={group.label} darkMode={darkMode} />
                <div className="px-3 space-y-2">
                  {group.items.map((m) => (
                    <a
                      key={m.id}
                      href={m.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
                    >
                      <svg className={`w-4 h-4 shrink-0 ${sub}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="truncate underline">{m.file_name || m.media_url.split('/').pop()}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'links' && (
        links.length === 0 ? <EmptyState text="No links shared yet." darkMode={darkMode} /> : (
          <div className="pb-2">
            {linkGroups.map((group) => (
              <div key={group.label}>
                <MonthHeader label={group.label} darkMode={darkMode} />
                <div className="px-3 space-y-2.5">
                  {group.items.map((m) => (
                    <a
                      key={m.id}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-violet-500 hover:underline truncate"
                    >
                      {m.url}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
