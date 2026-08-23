import { useRef, useState } from 'react'

function formatBytes(bytes) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let i = 0
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

export default function MediaCaptionModal({ file, localUrl, mediaType, onCancel, onSend }) {
  const [caption, setCaption] = useState('')
  const inputRef = useRef(null)

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend(caption.trim() || null)
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex flex-col bg-black/90">
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex-1 flex items-center justify-center p-6 min-h-0">
        {mediaType === 'image' && (
          <img src={localUrl} alt="" className="max-w-full max-h-full rounded-lg object-contain" />
        )}
        {mediaType === 'video' && (
          <video src={localUrl} controls className="max-w-full max-h-full rounded-lg" />
        )}
        {(mediaType === 'file' || mediaType === 'audio') && (
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
              <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium max-w-xs truncate">{file?.name}</p>
            <p className="text-xs text-white/50">{formatBytes(file?.size)}</p>
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pb-6 pt-2">
        <div className="max-w-xl mx-auto flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-2.5">
          <input
            ref={inputRef}
            autoFocus
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a caption…"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/50"
          />
          <button
            onClick={() => onSend(caption.trim() || null)}
            className="w-9 h-9 shrink-0 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
