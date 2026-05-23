import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import MessageContextMenu from './MessageContextMenu'
import ForwardModal from './ForwardModal'
import EmojiPicker from './EmojiPicker'
import { forwardMessageApi } from '../../api/conversations'

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function highlightText(text, query) {
  if (!query?.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-300 text-gray-900 rounded px-0.5">{part}</mark>
      : part
  )
}

export default function MessageBubble({ msg, darkMode, onReply, onDelete, searchQuery, isCurrentMatch }) {
  const { user } = useAuth()
  const isMe = msg.sender_id === user?.id
  const [hovered, setHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showForward, setShowForward] = useState(false)
  const [reactions, setReactions] = useState({})
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  if (msg.is_deleted) {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
        <span className={`text-xs italic px-3 py-1 rounded-xl ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Message deleted
        </span>
      </div>
    )
  }

  function handleCopy() {
    navigator.clipboard.writeText(msg.content || '').catch(() => {})
  }

  async function handleForward(targetConversationId) {
    try {
      await forwardMessageApi(msg.id, targetConversationId)
    } catch {}
  }

  function toggleReaction(emoji) {
    setReactions((prev) => {
      const count = prev[emoji] || 0
      if (count === 0) return { ...prev, [emoji]: 1 }
      const next = { ...prev }
      if (count === 1) delete next[emoji]
      else next[emoji] = count - 1
      return next
    })
  }

  const hasReactions = Object.keys(reactions).length > 0

  return (
    <div
      id={`msg-${msg.id}`}
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 items-end gap-2 ${isCurrentMatch ? 'rounded-xl ring-2 ring-violet-400 ring-offset-2' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        if (!showReactionPicker) { setHovered(false); setShowMenu(false) }
      }}
    >
      {!isMe && (
        <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mb-5 overflow-hidden">
          {msg.sender_avatar
            ? <img src={msg.sender_avatar} alt="" className="w-full h-full object-cover" />
            : (msg.sender_display_name || msg.sender_name || '?')[0].toUpperCase()
          }
        </div>
      )}
      {isMe && (
        <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mb-5 overflow-hidden order-last">
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            : (user?.display_name || user?.full_name || '?')[0].toUpperCase()
          }
        </div>
      )}

      <div className="max-w-xs lg:max-w-md xl:max-w-lg">
        {!isMe && (
          <p className={`text-xs mb-1 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {msg.sender_display_name || msg.sender_name}
          </p>
        )}

        {/* Reply preview */}
        {msg.reply_to_message_id && msg.reply_content && (
          <div className={`mb-1 px-3 py-1.5 rounded-xl border-l-4 border-violet-400 text-xs ${
            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-violet-50 text-gray-600'
          }`}>
            <p className="font-semibold text-violet-600 text-xs">{msg.reply_sender_name || 'Unknown'}</p>
            <p className="truncate">{msg.reply_content?.slice(0, 80)}</p>
          </div>
        )}

        <div className="relative">
          {/* Reaction bar — floats above bubble on hover */}
          {hovered && (
            <div className={`absolute bottom-full ${isMe ? 'right-0' : 'left-0'} mb-1.5 flex items-center gap-0.5 z-20 px-2 py-1 rounded-full shadow-lg ${
              darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-100'
            }`}>
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  className="w-7 h-7 flex items-center justify-center text-lg hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
              <button
                onClick={() => setShowReactionPicker((v) => !v)}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                  darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Full emoji picker for reactions */}
              {showReactionPicker && (
                <div className={`absolute ${isMe ? 'right-0' : 'left-0'} bottom-full mb-1 z-30`}>
                  <EmojiPicker
                    darkMode={darkMode}
                    onSelect={(emoji) => { toggleReaction(emoji) }}
                    onClose={() => { setShowReactionPicker(false); setHovered(false) }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Bubble */}
          <div className={`px-4 py-2 rounded-2xl text-sm ${
            isMe
              ? 'bg-violet-600 text-white rounded-br-sm'
              : darkMode
              ? 'bg-gray-700 text-white rounded-bl-sm'
              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
          }`}>
            {(() => {
              const src = msg.media_url || (msg.message_type !== 'text' ? msg.content : null)
              if (msg.message_type === 'image' && src)
                return <img src={src} alt="media" className="rounded-lg max-w-full" />
              if (msg.message_type === 'audio' && src)
                return <audio controls src={src} className="max-w-xs" />
              if (msg.message_type === 'video' && src)
                return <video controls src={src} className="rounded-lg max-w-full max-h-48" />
              if (msg.message_type === 'file' && src)
                return (
                  <a href={src} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {src.split('/').pop()}
                  </a>
                )
              return <p className="whitespace-pre-wrap wrap-break-word">{highlightText(msg.content || '', searchQuery)}</p>
            })()}
          </div>

          {/* Three-dot context menu button */}
          {hovered && (
            <button
              onClick={() => setShowMenu((v) => !v)}
              className={`absolute ${isMe ? '-left-7' : '-right-7'} top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          )}

          {showMenu && (
            <MessageContextMenu
              isMe={isMe}
              darkMode={darkMode}
              onClose={() => setShowMenu(false)}
              onReply={() => onReply?.(msg)}
              onForward={() => setShowForward(true)}
              onCopy={handleCopy}
              onDelete={() => onDelete?.(msg.id)}
            />
          )}
        </div>

        {/* Reactions display */}
        {hasReactions && (
          <div className={`flex gap-1 mt-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(reactions).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-200 hover:border-violet-400'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-violet-400'
                }`}
              >
                <span>{emoji}</span>
                {count > 1 && <span className="font-medium">{count}</span>}
              </button>
            ))}
          </div>
        )}

        <p className={`text-xs mt-1 ${isMe ? 'text-right' : 'text-left'} ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {formatTime(msg.created_at)}
          {isMe && <span className="ml-1 text-violet-400">✓✓</span>}
        </p>
      </div>

      {showForward && (
        <ForwardModal
          darkMode={darkMode}
          onClose={() => setShowForward(false)}
          onForward={handleForward}
        />
      )}
    </div>
  )
}
