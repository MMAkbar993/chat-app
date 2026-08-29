import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import MessageContextMenu from './MessageContextMenu'
import ForwardModal from './ForwardModal'
import EmojiPicker from './EmojiPicker'
import LinkPreviewCard from './LinkPreviewCard'
import { forwardMessageApi } from '../../api/conversations'
import { getReplyPreviewText, getReplyImageUrl, hasReplyPreview } from '../../utils/replyPreview'


function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function Ticks({ status }) {
  if (status === 'read') {
    return <img src="/checkmark-read.png" alt="Read" className="inline-block ml-1 h-2.5 w-auto align-middle" />
  }
  // sent or delivered — unread
  return <img src="/checkmark-unread.png" alt="Unread" className="inline-block ml-1 h-2.5 w-auto align-middle" />
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

const URL_REGEX = /(https?:\/\/[^\s]+)/g

function firstUrl(text) {
  const match = (text || '').match(URL_REGEX)
  return match ? match[0] : null
}

// Turns plain-text URLs into real links — e.g. the Google Calendar invite link a scheduled
// meeting drops into the conversation. Only touches plain string segments, so it composes safely
// with highlightText's <mark> output instead of fighting it.
function linkifyNode(node, keyPrefix) {
  if (typeof node !== 'string') return [node]
  const parts = node.split(URL_REGEX)
  if (parts.length === 1) return [node]
  return parts.map((part, i) =>
    i % 2 === 1
      ? <a key={`${keyPrefix}-${i}`} href={part} target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()} className="underline break-all">{part}</a>
      : part
  )
}

function renderMessageText(text, query) {
  const highlighted = highlightText(text, query)
  const nodes = Array.isArray(highlighted) ? highlighted : [highlighted]
  return nodes.flatMap((node, i) => linkifyNode(node, `link-${i}`))
}

// \p{Extended_Pictographic} covers emoji glyphs without also matching plain digits/punctuation
// that Unicode's broader \p{Emoji} property includes (e.g. '#', '*', '0'-'9').
const EMOJI_ONLY_REGEX = /^[\p{Extended_Pictographic}\p{Emoji_Component}\s]+$/u
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : null

// Telegram-style jumbo rendering: a message that's just a handful of emoji (no other text)
// shows the emoji big with no bubble, instead of tiny inside a normal chat bubble.
function isEmojiOnly(text) {
  const trimmed = (text || '').trim()
  if (!trimmed || !EMOJI_ONLY_REGEX.test(trimmed)) return false
  const count = segmenter
    ? [...segmenter.segment(trimmed)].length
    : [...trimmed].length
  return count > 0 && count <= 6
}

export default function MessageBubble({ msg, darkMode, onReply, onEdit, onDelete, onDeleteForMe, searchQuery, isCurrentMatch }) {
  const { user } = useAuth()
  const { socket } = useSocket()
  const isMe = msg.sender_id === user?.id
  const canEdit = isMe && msg.message_type === 'text'
  const [hovered, setHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showForward, setShowForward] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [lightbox, setLightbox] = useState(null) // { url, type: 'image' | 'video' }
  const [pickerDir, setPickerDir] = useState('up')
  const [menuDir, setMenuDir] = useState('down')
  const reactionBtnRef = useRef(null)
  const menuBtnRef = useRef(null)

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

  function openMenuFromRect(rect) {
    setMenuDir(rect && window.innerHeight - rect.bottom < 300 ? 'up' : 'down')
    setShowMenu(true)
  }

  function handleContextMenu(e) {
    e.preventDefault()
    openMenuFromRect(e.currentTarget.getBoundingClientRect())
  }

  const hasReactions = reactions.length > 0
  const replyImageUrl = getReplyImageUrl({
    messageType: msg.reply_message_type,
    mediaUrl: msg.reply_media_url,
    content: msg.reply_content,
  })
  const showReply = hasReplyPreview(msg)
  const emojiOnly = msg.message_type === 'text' && !showReply && isEmojiOnly(msg.content)
  const previewUrl = msg.message_type === 'text' && !emojiOnly ? firstUrl(msg.content) : null

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

        <div className="relative" onContextMenu={handleContextMenu}>
          {/* Bubble */}
          <div className={emojiOnly ? 'text-sm' : `px-4 py-2 rounded-2xl text-sm ${
            isMe
              ? 'bg-violet-600 text-white rounded-br-sm'
              : darkMode
              ? 'bg-gray-700 text-white rounded-bl-sm'
              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
          }`}>
            {showReply && (
              <div className={`mb-2 px-2 py-1.5 rounded-lg border-l-4 flex items-center gap-2 ${
                isMe
                  ? 'border-violet-300 bg-white/15'
                  : darkMode
                  ? 'border-violet-400 bg-black/20'
                  : 'border-violet-400 bg-violet-50'
              }`}>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold truncate ${
                    isMe ? 'text-violet-200' : 'text-violet-600'
                  }`}>
                    {msg.reply_sender_name || 'Unknown'}
                  </p>
                  <p className={`text-xs truncate ${isMe ? 'text-white/80' : darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {getReplyPreviewText({
                      content: msg.reply_content,
                      messageType: msg.reply_message_type,
                      mediaUrl: msg.reply_media_url,
                    })}
                  </p>
                </div>
                {replyImageUrl && (
                  <img
                    src={replyImageUrl}
                    alt=""
                    className="w-10 h-10 rounded object-cover shrink-0"
                  />
                )}
              </div>
            )}
            {(() => {
              const src = msg.media_url || (msg.message_type !== 'text' ? msg.content : null)
              const caption = msg.media_url && msg.message_type !== 'text' ? msg.content : null
              const captionEl = caption && (
                <p className="whitespace-pre-wrap wrap-break-word mt-1.5">{renderMessageText(caption, searchQuery)}</p>
              )
              if (msg.message_type === 'image' && src)
                return (
                  <div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => !msg.uploading && setLightbox({ url: src, type: 'image' })}
                        disabled={msg.uploading}
                        className={`block w-full text-left ${msg.uploading ? 'cursor-default' : 'cursor-zoom-in'}`}
                      >
                        <img src={src} alt="media" className={`rounded-lg max-w-full max-h-80 ${msg.uploading ? 'opacity-60' : ''}`} />
                      </button>
                      {msg.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                          <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    {captionEl}
                  </div>
                )
              if (msg.message_type === 'audio' && src)
                return <audio controls src={src} className="max-w-xs" />
              if (msg.message_type === 'video' && src)
                return (
                  <div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => !msg.uploading && setLightbox({ url: src, type: 'video' })}
                        disabled={msg.uploading}
                        className={`relative block w-full text-left ${msg.uploading ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <video src={src} preload="metadata" className={`rounded-lg max-w-full max-h-80 ${msg.uploading ? 'opacity-60' : ''}`} />
                        {!msg.uploading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                      {msg.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                          <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    {captionEl}
                  </div>
                )
              if (msg.message_type === 'file' && src)
                return (
                  <div>
                    <a href={src} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {src.split('/').pop()}
                    </a>
                    {captionEl}
                  </div>
                )
              if (emojiOnly) return <p className="text-5xl leading-tight animate-emoji-pop">{msg.content}</p>
              return (
                <>
                  <p className="whitespace-pre-wrap wrap-break-word">{renderMessageText(msg.content || '', searchQuery)}</p>
                  {previewUrl && <LinkPreviewCard url={previewUrl} darkMode={darkMode} isMe={isMe} />}
                </>
              )
            })()}
          </div>

          {/* Three-dot context menu button */}
          {hovered && (
            <button
              ref={menuBtnRef}
              onClick={() => {
                if (showMenu) { setShowMenu(false); return }
                openMenuFromRect(menuBtnRef.current?.getBoundingClientRect())
              }}
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
              dir={menuDir}
              canEdit={canEdit}
              darkMode={darkMode}
              onClose={() => setShowMenu(false)}
              onReact={handleReaction}
              onMoreReactions={() => setShowReactionPicker(true)}
              onReply={() => onReply?.(msg)}
              onForward={() => setShowForward(true)}
              onCopy={handleCopy}
              onEdit={() => onEdit?.(msg)}
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
          {msg.edited_at && (
            <span className={`text-xs italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>edited</span>
          )}
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

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {lightbox.type === 'video' ? (
            <video
              src={lightbox.url}
              controls
              autoPlay
              className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightbox.url}
              alt=""
              className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  )
}
