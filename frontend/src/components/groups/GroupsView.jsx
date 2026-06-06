import { useState, useRef, useEffect } from 'react'
import { useChat } from '../../context/ChatContext'
import { useToast } from '../../context/ToastContext'
import CreateGroupModal from './CreateGroupModal'
import ConfirmDialog from '../ui/ConfirmDialog'
import client from '../../api/client'

const FILTERS = [
  { key: 'all',      label: 'All Groups' },
  { key: 'pinned',   label: 'Pinned Groups' },
  { key: 'archived', label: 'Archived Groups' },
  { key: 'muted',    label: 'Muted Groups' },
]

function formatLastMessage(content, type) {
  if (!content && type !== 'call') return ' '
  if (type === 'call') {
    try {
      const d = JSON.parse(content || '{}')
      const kind = d.call_type === 'video' ? 'Video' : 'Audio'
      if (d.status === 'missed') return `📵 Missed ${kind.toLowerCase()} call`
      if (d.status === 'ended' && d.duration) {
        const m = Math.floor(d.duration / 60)
        const s = d.duration % 60
        const dur = m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `0:${String(s).padStart(2, '0')}`
        return `📞 ${kind} call · ${dur}`
      }
      return `📞 ${kind} call`
    } catch {
      return '📞 Call'
    }
  }
  if (type === 'image') return '📷 Photo'
  if (type === 'video') return '🎥 Video'
  if (type === 'audio') return '🎤 Voice message'
  if (type === 'file') return '📎 File'
  return content || ' '
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

function GroupMenu({ darkMode, onClose, onArchive, onMute, onPin, onMarkUnread, onLeave, onDelete, isArchived, isMuted, isPinned }) {
  const menuRef = useRef(null)
  const dm = darkMode
  const item = `w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${dm ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  function wrap(fn) { return () => { fn(); onClose() } }

  return (
    <div ref={menuRef} className={`absolute right-2 top-10 z-50 w-52 rounded-xl shadow-xl border py-1 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      <button onClick={wrap(onArchive)} className={item}>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8m-9 4v4m4-4v4" />
        </svg>
        {isArchived ? 'Unarchive Group' : 'Archive Group'}
      </button>
      <button onClick={wrap(onMute)} className={item}>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
      </button>
      <button onClick={wrap(onPin)} className={item}>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {isPinned ? 'Unpin Group' : 'Pin Group'}
      </button>
      <button onClick={wrap(onMarkUnread)} className={item}>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Mark as Unread
      </button>
      <button onClick={wrap(onLeave)} className={`${item} text-orange-500`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Exit Group
      </button>
      <button onClick={wrap(onDelete)} className={`${item} text-red-500`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete Group
      </button>
    </div>
  )
}

function FilterMenu({ darkMode, currentFilter, onSelect, onClose }) {
  const menuRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className={`absolute right-0 top-full mt-1 w-48 rounded-2xl shadow-xl py-1 z-50 ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
      }`}
    >
      {FILTERS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => { onSelect(key); onClose() }}
          className={`w-full text-left px-4 py-2.5 text-sm transition-colors rounded-lg ${
            currentFilter === key
              ? 'bg-violet-600 text-white'
              : darkMode
              ? 'text-gray-200 hover:bg-gray-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function GroupsView({ darkMode }) {
  const {
    conversations, openConversation, activeConversation, loadConversations,
    toggleConversationFlag, removeConversation, dropConversation, markConversationUnread,
  } = useChat()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [menuGroupId, setMenuGroupId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const currentFilterLabel = FILTERS.find((f) => f.key === filter)?.label || 'All Groups'

  const groups = conversations
    .filter((c) => c.type === 'group' && !c.is_deleted)
    .filter((g) => {
      if (filter === 'all')      return !g.is_archived
      if (filter === 'pinned')   return g.is_pinned && !g.is_archived
      if (filter === 'archived') return g.is_archived
      if (filter === 'muted')    return g.is_muted && !g.is_archived
      return true
    })
    .filter((g) => (g.name || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.is_pinned === b.is_pinned) return 0
      return a.is_pinned ? -1 : 1
    })

  async function handleLeave(g) {
    try {
      await client.delete(`/groups/${g.id}/leave`)
      dropConversation(g.id)
      showToast('Left the group', 'info')
    } catch {
      showToast('Could not leave group', 'error')
    }
  }

  const dm = darkMode

  return (
    <div className={`w-80 flex flex-col border-r ${dm ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h2 className={`text-lg font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Group</h2>
        <button onClick={() => setShowCreate(true)}
          className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white hover:bg-violet-700 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="px-4 pb-3">
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${dm ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className={`bg-transparent flex-1 outline-none text-sm ${dm ? 'text-white placeholder-gray-500' : 'placeholder-gray-400'}`}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Filter header */}
        <div className="px-4 mb-2 flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-wide ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
            {currentFilterLabel}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu((v) => !v)}
              className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                filter !== 'all'
                  ? 'text-violet-500'
                  : dm ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Filter groups"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
            </button>
            {showFilterMenu && (
              <FilterMenu
                darkMode={dm}
                currentFilter={filter}
                onSelect={setFilter}
                onClose={() => setShowFilterMenu(false)}
              />
            )}
          </div>
        </div>

        {groups.map((g) => {
          const isActive = activeConversation?.id === g.id
          return (
            <div
              key={g.id}
              className="relative"
              onMouseEnter={() => setHoveredId(g.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                onClick={() => openConversation(g)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  isActive
                    ? dm ? 'bg-gray-800' : 'bg-violet-50'
                    : dm ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                } ${g.is_muted ? 'opacity-60' : ''}`}
              >
                <div className="relative w-11 h-11 shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    {g.avatar_url
                      ? <img src={g.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm">{(g.name || '?')[0].toUpperCase()}</div>}
                  </div>
                  {g.is_pinned && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-sm truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{g.name}</span>
                    <span className={`text-xs shrink-0 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(g.last_message_at || g.updated_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{formatLastMessage(g.last_message, g.last_message_type)}</span>
                    {g.unread_count > 0 && (
                      <span className="ml-2 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                        {g.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {hoveredId === g.id && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuGroupId((id) => id === g.id ? null : g.id) }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-colors ${dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                </div>
              )}

              {menuGroupId === g.id && (
                <GroupMenu
                  darkMode={dm}
                  isArchived={g.is_archived}
                  isMuted={g.is_muted}
                  isPinned={g.is_pinned}
                  onClose={() => setMenuGroupId(null)}
                  onArchive={() => {
                    toggleConversationFlag(g.id, 'is_archived')
                    showToast(g.is_archived ? 'Group unarchived' : 'Group archived', 'success')
                  }}
                  onMute={() => {
                    toggleConversationFlag(g.id, 'is_muted')
                    showToast(g.is_muted ? 'Notifications unmuted' : 'Notifications muted', 'success')
                  }}
                  onPin={() => {
                    toggleConversationFlag(g.id, 'is_pinned')
                    showToast(g.is_pinned ? 'Group unpinned' : 'Group pinned', 'success')
                  }}
                  onMarkUnread={() => {
                    markConversationUnread(g.id)
                    showToast('Marked as unread', 'info')
                  }}
                  onLeave={() => setConfirm({
                    title: 'Exit Group',
                    message: 'Only group admins will be notified that you left the group.',
                    confirmLabel: 'Exit Group',
                    variant: 'danger',
                    onConfirm: () => handleLeave(g),
                  })}
                  onDelete={() => setConfirm({
                    title: 'Delete Group',
                    message: 'This will permanently delete this group and all its messages.',
                    confirmLabel: 'Delete',
                    variant: 'danger',
                    onConfirm: () => { removeConversation(g.id); showToast('Group deleted', 'info') },
                  })}
                />
              )}
            </div>
          )
        })}

        {groups.length === 0 && (
          <p className={`text-sm text-center py-8 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
            {search ? 'No matches found.' : filter === 'all' ? 'No groups yet' : `No ${currentFilterLabel.toLowerCase()}`}
          </p>
        )}
      </div>

      {showCreate && (
        <CreateGroupModal
          darkMode={dm}
          onClose={() => setShowCreate(false)}
          onCreated={() => { loadConversations(); setShowCreate(false) }}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant}
        onConfirm={() => { confirm?.onConfirm(); setConfirm(null) }}
        onCancel={() => setConfirm(null)}
        darkMode={dm}
      />
    </div>
  )
}
