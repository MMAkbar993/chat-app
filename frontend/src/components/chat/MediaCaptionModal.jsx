import { useState, useRef } from 'react'

function formatBytes(bytes) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let i = 0
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

export default function MediaCaptionModal({ file, localUrl, mediaType, darkMode, onCancel, onSend }) {
  const [caption, setCaption] = useState('')
  const textareaRef = useRef(null)

  function handleChange(e) {
    setCaption(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend(caption.trim() || null)
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const cardBg = darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
  const previewBg = darkMode ? 'bg-gray-800' : 'bg-gray-100'
  const inputBg = darkMode ? 'bg-gray-800' : 'bg-gray-100'

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4">
      <div className={`w-full max-w-xs rounded-2xl shadow-xl overflow-hidden ${cardBg}`}>
        <div className="flex items-center justify-between px-4 pt-4">
          <p className="font-semibold text-sm">Send {mediaType === 'image' ? 'Photo' : mediaType === 'video' ? 'Video' : 'File'}</p>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`mt-3 flex items-center justify-center ${previewBg}`}>
          {mediaType === 'image' && (
            <img src={localUrl} alt="" className="max-w-full max-h-56 object-contain" />
          )}
          {mediaType === 'video' && (
            <video src={localUrl} controls className="max-w-full max-h-56" />
          )}
          {(mediaType === 'file' || mediaType === 'audio') && (
            <div className="flex flex-col items-center gap-2 py-6 px-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-xs font-medium max-w-60 truncate">{file?.name}</p>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatBytes(file?.size)}</p>
            </div>
          )}
        </div>

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
              onClick={() => onSend(caption.trim() || null)}
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
