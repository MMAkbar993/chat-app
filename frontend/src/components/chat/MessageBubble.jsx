import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import MessageContextMenu from './MessageContextMenu'
import ForwardModal from './ForwardModal'
import EmojiPicker from './EmojiPicker'
import { forwardMessageApi } from '../../api/conversations'
import { getReplyPreviewText, getReplyImageUrl, hasReplyPreview } from '../../utils/replyPreview'


function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function Ticks({ status }) {
  if (status === 'read') {
    return (
      <svg className="inline-block ml-1 text-green-400" width="15" height="9" viewBox="0 0 15 9" fill="none">
        <path d="M1 4.5l2.5 3L8 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.5 4.5l2.5 3L13 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
  if (status === 'delivered') {
    return (
      <svg className="inline-block ml-1 text-gray-400" width="15" height="9" viewBox="0 0 15 9" fill="none">
        <path d="M1 4.5l2.5 3L8 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.5 4.5l2.5 3L13 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
  // sent — single tick
  return (
    <svg className="inline-block ml-1 text-gray-400" width="9" height="9" viewBox="0 0 9 9" fill="none">
      <path d="M1 4.5l2.5 3L8 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
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

export default function MessageBubble({ msg, darkMode, onReply, onDelete, onDeleteForMe, searchQuery, isCurrentMatch }) {
  const { user } = useAuth()
  const { socket } = useSocket()
  const isMe = msg.sender_id === user?.id
  const [hovered, setHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showForward, setShowForward] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [pickerDir, setPickerDir] = useState('up')
  const reactionBtnRef = useRef(null)

  const reactions = msg.reactions || []

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

  function handleReaction(emoji) {
    if (!socket || !msg.conversation_id) return
    socket.emit('toggle-reaction', {
      messageId: msg.id,
      conversationId: msg.conversation_id,
      emoji,
    })
    setShowReactionPicker(false)
  }

  const hasReactions = reactions.length > 0

  return (
    <div
      id={`msg-${msg.id}`}
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 items-end gap-2 ${isCurrentMatch ? 'rounded-xl ring-2 ring-violet-400 ring-offset-2' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowMenu(false) }}
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
        {hasReplyPreview(msg) && (
          <div className={`mb-1 px-3 py-1.5 rounded-xl border-l-4 border-violet-400 text-xs flex items-center gap-2 ${
            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-violet-50 text-gray-600'
          }`}>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-violet-600 text-xs">{msg.reply_sender_name || 'Unknown'}</p>
              <p className="truncate">
                {getReplyPreviewText({
                  content: msg.reply_content,
                  messageType: msg.reply_message_type,
                  mediaUrl: msg.reply_media_url,
                })}
              </p>
            </div>
            {getReplyImageUrl({ messageType: msg.reply_message_type, mediaUrl: msg.reply_media_url }) && (
              <img
                src={getReplyImageUrl({ messageType: msg.reply_message_type, mediaUrl: msg.reply_media_url })}
                alt=""
                className="w-10 h-10 rounded object-cover shrink-0"
              />
            )}
          </div>
        )}

        <div className="relative">
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
                return (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => !msg.uploading && setLightboxUrl(src)}
                      disabled={msg.uploading}
                      className={`block w-full text-left ${msg.uploading ? 'cursor-default' : 'cursor-zoom-in'}`}
                    >
                      <img src={src} alt="media" className={`rounded-lg max-w-full ${msg.uploading ? 'opacity-60' : ''}`} />
                    </button>
                    {msg.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                        <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                )
              if (msg.message_type === 'audio' && src)
                return <audio controls src={src} className="max-w-xs" />
              if (msg.message_type === 'video' && src)
                return (
                  <div className="relative">
                    <video controls={!msg.uploading} src={src} className={`rounded-lg max-w-full max-h-48 ${msg.uploading ? 'opacity-60' : ''}`} />
                    {msg.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                        <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                )
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
              onDeleteForMe={() => onDeleteForMe?.(msg.id)}
            />
          )}
        </div>

        {/* Reactions display */}
        {hasReactions && (
          <div className={`flex gap-1 mt-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
            {reactions.map(({ emoji, count, reactors }) => {
              const reactedByMe = reactors?.includes(user?.id)
              return (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                    reactedByMe
                      ? 'bg-violet-100 border-violet-400 text-violet-700'
                      : darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-200 hover:border-violet-400'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-violet-400'
                  }`}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="font-medium">{count}</span>}
                </button>
              )
            })}
          </div>
        )}

        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
          <div className="relative">
            <button
              ref={reactionBtnRef}
              onClick={() => {
                const rect = reactionBtnRef.current?.getBoundingClientRect()
                setPickerDir(rect && rect.top < 320 ? 'down' : 'up')
                setShowReactionPicker((v) => !v)
              }}
              className={`w-5 h-5 flex items-center justify-center rounded-full transition-colors ${
                darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showReactionPicker && (
              <div className={`absolute ${isMe ? 'right-0' : 'left-0'} z-50 ${pickerDir === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                <EmojiPicker
                  darkMode={darkMode}
                  onSelect={(emoji) => handleReaction(emoji)}
                  onClose={() => setShowReactionPicker(false)}
                />
              </div>
            )}
          </div>
          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatTime(msg.created_at)}</span>
          {isMe && <Ticks status={msg.status || 'sent'} />}
        </div>
      </div>

      {showForward && (
        <ForwardModal
          darkMode={darkMode}
          onClose={() => setShowForward(false)}
          onForward={handleForward}
        />
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightboxUrl(null)}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
