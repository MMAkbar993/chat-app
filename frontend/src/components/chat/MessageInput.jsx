import { useState, useRef } from 'react'
import { useSocket } from '../../context/SocketContext'
import { uploadFile } from '../../api/users'
import AttachmentMenu from './AttachmentMenu'
import EmojiPicker from './EmojiPicker'
import { playSentSound } from '../../utils/sounds'

function formatSecs(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

export default function MessageInput({ conversationId, onSend, darkMode, replyTo, onClearReply, onMediaPreview }) {
  const [text, setText] = useState('')
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordSecs, setRecordSecs] = useState(0)
  const { socket } = useSocket()
  const typingRef = useRef(false)
  const typingTimerRef = useRef(null)
  const textareaRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const recordTimerRef = useRef(null)

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
    onSend(fileUrl, messageType, null)
    setShowAttachMenu(false)
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        try {
          const { fileUrl, messageType } = await uploadFile(file)
          if (getNotifPrefs().sound !== false) playSentSound()
          onSend(fileUrl, messageType || 'audio', replyTo?.id || null)
          onClearReply?.()
        } catch {}
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
    setRecording(false)
    setRecordSecs(0)
  }

  return (
    <div className={`border-t ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      {/* Reply preview */}
      {replyTo && (
        <div className={`flex items-center justify-between px-4 py-2 border-l-4 border-violet-500 ${
          darkMode ? 'bg-gray-800 text-gray-300' : 'bg-violet-50 text-gray-600'
        }`}>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-violet-600">Replying to {replyTo.senderName}</p>
            <p className="text-xs truncate">{replyTo.content?.slice(0, 80)}</p>
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

        {/* Send / Mic / Stop */}
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="w-10 h-10 shrink-0 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1.5" />
            </svg>
          </button>
        ) : text.trim() ? (
          <button
            type="submit"
            className="w-10 h-10 shrink-0 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
      </form>
    </div>
  )
}
