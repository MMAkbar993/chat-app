import { useEffect, useState } from 'react'
import { getLinkPreview } from '../../api/linkPreview'

// Module-level so every message bubble that links the same URL shares one fetch/result instead
// of each bubble hitting the network on its own (common case: a link forwarded/pasted repeatedly).
const previewCache = new Map() // url -> data | null
const inFlight = new Map() // url -> Promise

export default function LinkPreviewCard({ url, darkMode, isMe }) {
  const [preview, setPreview] = useState(() => previewCache.get(url) ?? undefined)

  // A message's content (and so its linked URL) can change via editing — re-sync the cached
  // result during render, the same prop-change pattern MessageInput uses for its own props.
  const [prevUrl, setPrevUrl] = useState(url)
  if (url !== prevUrl) {
    setPrevUrl(url)
    setPreview(previewCache.get(url) ?? undefined)
  }

  useEffect(() => {
    if (previewCache.has(url)) return
    let cancelled = false
    const promise = inFlight.get(url) || getLinkPreview(url).catch(() => null)
    inFlight.set(url, promise)
    promise.then((data) => {
      previewCache.set(url, data)
      inFlight.delete(url)
      if (!cancelled) setPreview(data)
    })
    return () => { cancelled = true }
  }, [url])

  if (!preview) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`block mt-2 rounded-xl overflow-hidden border transition-colors ${
        isMe
          ? 'border-white/20 bg-white/10 hover:bg-white/15'
          : darkMode
          ? 'border-gray-600 bg-gray-800/60 hover:bg-gray-800'
          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
      }`}
    >
      {preview.image && (
        <img src={preview.image} alt="" className="w-full max-h-40 object-cover" />
      )}
      <div className="px-3 py-2 min-w-0">
        {preview.siteName && (
          <p className={`text-[11px] font-semibold uppercase tracking-wide truncate ${
            isMe ? 'text-white/70' : darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {preview.siteName}
          </p>
        )}
        {preview.title && (
          <p className={`text-sm font-semibold truncate ${isMe ? 'text-white' : darkMode ? 'text-white' : 'text-gray-900'}`}>
            {preview.title}
          </p>
        )}
        {preview.description && (
          <p className={`text-xs line-clamp-2 ${isMe ? 'text-white/80' : darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {preview.description}
          </p>
        )}
      </div>
    </a>
  )
}
