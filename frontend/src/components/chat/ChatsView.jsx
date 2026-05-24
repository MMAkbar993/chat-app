import { useState } from 'react'
import { useChat } from '../../context/ChatContext'
import { useToast } from '../../context/ToastContext'
import ConfirmDialog from '../ui/ConfirmDialog'
import ChatItemMenu from './ChatItemMenu'
import ChatFilterMenu from './ChatFilterMenu'

const FILTER_LABELS = {
  all: 'All Chats',
  favourite: 'Favourite Chats',
  pinned: 'Pinned Chats',
  archive: 'Archive Chats',
  trash: 'Trash',
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const today = new Date()
  const diff = Math.floor((today - d) / 86400000)
  if (diff === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return d.toLocaleDateString()
}

export default function ChatsView({ darkMode }) {
  const {
    filteredConversations, conversations, activeConversation, openConversation,
    conversationFilter, setConversationFilter,
    toggleConversationFlag, removeConversation, setConversations,
  } = useChat()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [menuConvId, setMenuConvId] = useState(null)
  const [hoveredConvId, setHoveredConvId] = useState(null)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const all = filteredConversations.filter((c) => {
    const name = c.type === 'group' ? c.name : (c.other_user_display_name || c.other_user_name || '')
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const recent = conversations.filter((c) => !c.is_archived).slice(0, 3)

  return (
    <div className={`w-80 flex flex-col border-r ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Chats</h2>
        <button className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white hover:bg-violet-700 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className={`bg-transparent flex-1 outline-none text-sm ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Recent */}
        {!search && conversationFilter === 'all' && recent.length > 0 && (
          <div className="mb-3">
            <div className="px-4 flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Recent Chats</span>
            </div>
            <div className="flex gap-3 px-4 overflow-x-auto pb-2">
              {recent.map((c) => {
                const name = c.type === 'group' ? c.name : (c.other_user_display_name || c.other_user_name || 'Unknown')
                const avatar = c.other_user_avatar || c.avatar_url
                return (
                  <button key={c.id} onClick={() => openConversation(c)}
                    className="flex flex-col items-center gap-1 min-w-13">
                    <div className="relative shrink-0 w-12 h-12">
                      <div className="w-full h-full rounded-full overflow-hidden">
                        {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-violet-500 flex items-center justify-center text-white font-bold">{(name || '?')[0].toUpperCase()}</div>}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* All chats */}
        <div>
          <div className="px-4 flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {FILTER_LABELS[conversationFilter] || 'All Chats'}
            </span>
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu((v) => !v)}
                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                  conversationFilter !== 'all'
                    ? 'text-violet-500'
                    : darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
              </button>
              {showFilterMenu && (
                <ChatFilterMenu
                  darkMode={darkMode}
                  currentFilter={conversationFilter}
                  onSelect={setConversationFilter}
                  onClose={() => setShowFilterMenu(false)}
                />
              )}
            </div>
          </div>

          {all.length === 0 && (
            <p className={`text-sm text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {conversationFilter === 'all' ? 'No chats yet' : `No ${FILTER_LABELS[conversationFilter]?.toLowerCase()}`}
            </p>
          )}

          {all.map((c) => {
            const name = c.type === 'group' ? c.name : (c.other_user_display_name || c.other_user_name || 'Unknown')
            const avatar = c.other_user_avatar || c.avatar_url
            const isActive = activeConversation?.id === c.id
            return (
              <div
                key={c.id}
                className="relative"
                onMouseEnter={() => setHoveredConvId(c.id)}
                onMouseLeave={() => { setHoveredConvId(null); if (menuConvId === c.id) setMenuConvId(null) }}
              >
                <button
                  onClick={() => openConversation(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isActive
                      ? darkMode ? 'bg-gray-800' : 'bg-violet-50'
                      : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative shrink-0 w-11 h-11">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">{(name || '?')[0].toUpperCase()}</div>}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                    {c.is_pinned && (
                      <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-violet-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{name}</span>
                      <span className={`text-xs shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(c.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{c.last_message || ' '}</span>
                      {c.unread_count > 0 && (
                        <span className="ml-2 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                          {c.unread_count}
                        </span>
                      )}
                      {c.unread_count == 0 && c.last_message && (
                        <svg className="ml-1 shrink-0 text-violet-500" width="16" height="10" viewBox="0 0 16 10" fill="none">
                          <path d="M1 5l3 3.5L8.5 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 5l3 3.5L14.5 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                </button>

                {/* Three-dot button on hover */}
                {hoveredConvId === c.id && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuConvId((id) => id === c.id ? null : c.id) }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-500 hover:bg-gray-100'
                      } shadow-sm`}
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>
                    {menuConvId === c.id && (
                      <ChatItemMenu
                        darkMode={darkMode}
                        conv={c}
                        onClose={() => setMenuConvId(null)}
                        onArchive={() => {
                          const wasArchived = c.is_archived
                          toggleConversationFlag(c.id, 'is_archived')
                          showToast(wasArchived ? 'Chat unarchived' : 'Chat archived', 'success')
                        }}
                        onFavourite={() => {
                          const wasFav = c.is_favorite
                          toggleConversationFlag(c.id, 'is_favorite')
                          showToast(wasFav ? 'Removed from favourites' : 'Added to favourites', 'success')
                        }}
                        onMarkUnread={() => {
                          setConversations((prev) =>
                            prev.map((cv) => cv.id === c.id ? { ...cv, unread_count: 1 } : cv)
                          )
                          showToast('Marked as unread', 'info')
                        }}
                        onPin={() => {
                          const wasPinned = c.is_pinned
                          toggleConversationFlag(c.id, 'is_pinned')
                          showToast(wasPinned ? 'Chat unpinned' : 'Chat pinned', 'success')
                        }}
                        onDelete={() => setConfirm({
                          title: 'Delete Chat',
                          message: 'This will permanently delete this chat and all its messages.',
                          confirmLabel: 'Delete',
                          onConfirm: () => { removeConversation(c.id); showToast('Chat deleted', 'info') },
                        })}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={() => { confirm?.onConfirm(); setConfirm(null) }}
        onCancel={() => setConfirm(null)}
        darkMode={darkMode}
      />
    </div>
  )
}
