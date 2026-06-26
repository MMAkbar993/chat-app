import { useState, useRef, useEffect } from 'react'
import { useSocket } from '../../context/SocketContext'
import { uploadFile } from '../../api/users'
import AttachmentMenu from './AttachmentMenu'
import EmojiPicker from './EmojiPicker'
import { playSentSound } from '../../utils/sounds'
import { getReplyPreviewText, getReplyImageUrl } from '../../utils/replyPreview'

function formatSecs(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

export default function MessageInput({ conversationId, onSend, darkMode, replyTo, onClearReply, onMediaPreview }) {
  const [text, setText] = useState('')
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordSecs, setRecordSecs] = useState(false)

  // Preview state
  const [preview, setPreview] = useState(null) // { url, file, duration }
  const [playing, setPlaying] = useState(false)
  const [playProgress, setPlayProgress] = useState(0)
  const [sending, setSending] = useState(false)
  const audioRef = useRef(null)

  const { socket } = useSocket()
  const typingRef = useRef(false)
  const typingTimerRef = useRef(null)
  const textareaRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const recordTimerRef = useRef(null)

  // Sync audio element events
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    function onTimeUpdate() {
      setPlayProgress(el.duration ? el.currentTime / el.duration : 0)
    }
    function onEnded() { setPlaying(false); setPlayProgress(0) }
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('ended', onEnded)
    }
  }, [preview])

  function handleChange(e) {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
    if (!typingRef.current) {
      typingRef.current = true
      socket?.emit('typing', { conversationId })
    }
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      typingRef.current = false
      socket?.emit('stop-typing', { conversationId })
    }, 1500)
  }

  function getNotifPrefs() {
    try { return JSON.parse(localStorage.getItem('notif_prefs')) || {} } catch { return {} }
  }

  function handleSubmit(e) {
    e?.preventDefault()
    const content = text.trim()
    if (!content) return
    if (getNotifPrefs().sound !== false) playSentSound()
    onSend(content, 'text', replyTo?.id || null)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    onClearReply?.()
    socket?.emit('stop-typing', { conversationId })
    typingRef.current = false
    clearTimeout(typingTimerRef.current)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function insertEmoji(emoji) {
    const el = textareaRef.current
    if (!el) { setText((t) => t + emoji); return }
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = text.slice(0, start) + emoji + text.slice(end)
    setText(next)
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + emoji.length
      el.focus()
    }, 0)
  }

  function handleAttach(fileUrl, messageType) {
    onSend(fileUrl, messageType, replyTo?.id || null)
    onClearReply?.()
    setShowAttachMenu(false)
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setPreview({ url, file, duration: recordSecs })
        setRecording(false)
        setRecordSecs(0)
      }
      mr.start()
      setRecording(true)
      setRecordSecs(0)
      recordTimerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000)
    } catch {}
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    clearInterval(recordTimerRef.current)
  }

  function discardPreview() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
    setPlaying(false)
    setPlayProgress(0)
  }

  function togglePlay() {
    const el = audioRef.current
    if (!el) return
    if (playing) { el.pause(); setPlaying(false) }
    else { el.play(); setPlaying(true) }
  }

  async function sendPreview() {
    if (!preview) return
    setSending(true)
    try {
      const { fileUrl, messageType } = await uploadFile(preview.file)
      if (getNotifPrefs().sound !== false) playSentSound()
      onSend(fileUrl, messageType || 'audio', replyTo?.id || null)
      onClearReply?.()
      discardPreview()
    } catch {}
    setSending(false)
  }

  return (
    <div className={`border-t ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      {/* Reply preview */}
      {replyTo && (
        <div className={`flex items-center justify-between px-4 py-2 border-l-4 border-violet-500 ${
          darkMode ? 'bg-gray-800 text-gray-300' : 'bg-violet-50 text-gray-600'
        }`}>
          <div className="min-w-0 flex items-center gap-2 flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-violet-600">Replying to {replyTo.senderName}</p>
              <p className="text-xs truncate">
                {getReplyPreviewText({
                  content: replyTo.content,
                  messageType: replyTo.messageType,
                  mediaUrl: replyTo.mediaUrl,
                })}
              </p>
            </div>
            {getReplyImageUrl({ messageType: replyTo.messageType, mediaUrl: replyTo.mediaUrl, content: replyTo.content }) && (
              <img
                src={getReplyImageUrl({ messageType: replyTo.messageType, mediaUrl: replyTo.mediaUrl, content: replyTo.content })}
                alt=""
                className="w-10 h-10 rounded object-cover shrink-0"
              />
            )}
          </div>
          <button onClick={onClearReply} className="ml-2 shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 relative">
        {/* Attachment */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowAttachMenu((v) => !v)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              showAttachMenu
                ? 'bg-violet-100 text-violet-600'
                : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          {showAttachMenu && (
            <AttachmentMenu darkMode={darkMode} onClose={() => setShowAttachMenu(false)} onAttach={handleAttach} onPreview={onMediaPreview} />
          )}
        </div>

        {/* Input area */}
        {recording ? (
          <div className={`flex-1 flex items-center gap-3 rounded-2xl px-4 py-2.5 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className={`text-sm font-mono tabular-nums ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatSecs(recordSecs)}</span>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Recording voice message...</span>
          </div>
        ) : preview ? (
          /* ── Voice preview bar ── */
          <div className={`flex-1 flex items-center gap-2 rounded-2xl px-3 py-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {/* hidden audio element */}
            <audio ref={audioRef} src={preview.url} preload="auto" />

            {/* Play / Pause */}
            <button type="button" onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-violet-500 hover:bg-violet-600 flex items-center justify-center text-white shrink-0 transition-colors">
              {playing
                ? <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>

            {/* Progress bar */}
            <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}>
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${playProgress * 100}%` }}
              />
            </div>

            {/* Duration */}
            <span className={`text-xs tabular-nums shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatSecs(preview.duration)}
            </span>

            {/* Discard */}
            <button type="button" onClick={discardPreview}
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
              title="Discard & re-record">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ) : (
          <div className={`flex-1 flex items-end gap-2 rounded-2xl px-4 py-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKey}
              placeholder="Type Your Message"
              className={`flex-1 bg-transparent resize-none outline-none text-sm max-h-32 overflow-y-auto leading-5 py-0.5 ${
                darkMode ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
              }`}
            />
            {/* Emoji button */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                className={`transition-colors ${
                  showEmoji
                    ? 'text-violet-500'
                    : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {showEmoji && (
                <div className="absolute bottom-8 right-0 z-50">
                  <EmojiPicker
                    darkMode={darkMode}
                    onSelect={insertEmoji}
                    onClose={() => setShowEmoji(false)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right action button */}
        {recording ? (
          <button type="button" onClick={stopRecording}
            className="w-10 h-10 shrink-0 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1.5" />
            </svg>
          </button>
        ) : preview ? (
          <button type="button" onClick={sendPreview} disabled={sending}
            className="w-10 h-10 shrink-0 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white transition-colors disabled:opacity-60">
            {sending
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            }
          </button>
        ) : text.trim() ? (
          <button type="submit"
            className="w-10 h-10 shrink-0 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        ) : (
          <button type="button" onClick={startRecording}
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
            }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
      </form>
    </div>
  )
}
