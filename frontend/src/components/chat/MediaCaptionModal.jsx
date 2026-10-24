import { useState, useRef } from 'react'
import { LARGE_FILE_BYTES, LARGE_FILE_DAYS } from '../../utils/uploadError'

function formatBytes(bytes) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let i = 0
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

const FILE_ICON = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'

function title(items) {
  if (items.length === 1) {
    const t = items[0].mediaType
    return `Send ${t === 'image' ? 'Photo' : t === 'video' ? 'Video' : 'File'}`
  }
  const allPhotos = items.every((i) => i.mediaType === 'image')
  return `Send ${items.length} ${allPhotos ? 'photos' : 'items'}`
}

// Preview before sending one or more attachments. `items` is [{ file, localUrl, mediaType }].
// With several, the selected one shows large and the rest sit in a strip underneath, each with
// a remove button. One caption goes with the set: it is sent on the first item, the way an album
// caption works. `skipped` counts files left out for being over the per-send limit.
export default function MediaCaptionModal({ items: initialItems, skipped = 0, darkMode, onCancel, onSend }) {
  const [items, setItems] = useState(initialItems)
  const [selected, setSelected] = useState(0)
  const [caption, setCaption] = useState('')
  const textareaRef = useRef(null)
  const current = items[Math.min(selected, items.length - 1)]

  function send() {
    if (items.length) onSend(caption.trim() || null, items)
  }

  function remove(index) {
    const next = items.filter((_, i) => i !== index)
    if (!next.length) { onCancel(); return }
    setItems(next)
    setSelected((s) => (index < s || s >= next.length ? Math.max(0, s - 1) : s))
  }

  function handleChange(e) {
    setCaption(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const cardBg = darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
  const previewBg = darkMode ? 'bg-gray-800' : 'bg-gray-100'
  const inputBg = darkMode ? 'bg-gray-800' : 'bg-gray-100'
  const muted = darkMode ? 'text-gray-500' : 'text-gray-400'

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`w-full ${items.length > 1 ? 'max-w-sm' : 'max-w-xs'} rounded-2xl shadow-xl overflow-hidden ${cardBg}`}>
        <div className="flex items-center justify-between px-4 pt-4">
          <p className="font-semibold text-sm">{title(items)}</p>
          <button onClick={onCancel} aria-label="Cancel" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`mt-3 flex items-center justify-center ${previewBg}`}>
          {current.mediaType === 'image' && (
            <img src={current.localUrl} alt="" className="max-w-full max-h-56 object-contain" />
          )}
          {current.mediaType === 'video' && (
            <video key={current.localUrl} src={current.localUrl} controls className="max-w-full max-h-56" />
          )}
          {(current.mediaType === 'file' || current.mediaType === 'audio') && (
            <div className="flex flex-col items-center gap-2 py-6 px-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={FILE_ICON} />
                </svg>
              </div>
              <p className="text-xs font-medium max-w-60 truncate">{current.file?.name}</p>
              <p className={`text-xs ${muted}`}>{formatBytes(current.file?.size)}</p>
            </div>
          )}
        </div>

        {items.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-3 pt-3 pb-1">
            {items.map((it, i) => (
              <div key={it.localUrl} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-label={`Show item ${i + 1}`}
                  className={`block w-14 h-14 rounded-lg overflow-hidden ring-2 transition-shadow ${
                    i === selected ? 'ring-violet-500' : darkMode ? 'ring-transparent hover:ring-gray-600' : 'ring-transparent hover:ring-gray-300'
                  } ${previewBg}`}
                >
                  {it.mediaType === 'image' ? (
                    <img src={it.localUrl} alt="" className="w-full h-full object-cover" />
                  ) : it.mediaType === 'video' ? (
                    <video src={it.localUrl} muted className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 m-auto text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={FILE_ICON} />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Remove"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900/80 text-white flex items-center justify-center hover:bg-gray-900"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {items.some((it) => it.file?.size > LARGE_FILE_BYTES) && (
          <p className={`px-4 pt-2 text-xs ${muted}`}>
            Files over 100 MB are available for {LARGE_FILE_DAYS} days.
          </p>
        )}

        {skipped > 0 && (
          <p className={`px-4 pt-2 text-xs ${muted}`}>
            Up to 10 at a time, so {skipped} {skipped === 1 ? 'was' : 'were'} left out.
          </p>
        )}

        <div className="p-3">
          <div className={`flex items-end gap-2 rounded-xl px-3 py-2 ${inputBg}`}>
            <textarea
              ref={textareaRef}
              autoFocus
              rows={1}
              value={caption}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Add a caption…"
              className={`flex-1 bg-transparent outline-none resize-none text-sm max-h-32 overflow-y-auto leading-5 py-0.5 ${darkMode ? 'text-white placeholder-gray-500' : 'placeholder-gray-400'}`}
            />
            <button
              onClick={send}
              aria-label="Send"
              className="w-8 h-8 shrink-0 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
