import { useRef, useEffect } from 'react'

export default function ChatItemMenu({ darkMode, onClose, conv, onArchive, onFavourite, onMarkUnread, onPin, onDelete }) {
  const menuRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const base = `flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors ${
    darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
  }`

  const isArchived  = conv?.is_archived
  const isFavorite  = conv?.is_favorite
  const isPinned    = conv?.is_pinned

  const items = [
    {
      label: isArchived ? 'Unarchive Chat' : 'Archive Chat',
      icon: isArchived
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />,
      action: onArchive,
      active: isArchived,
    },
    {
      label: isFavorite ? 'Remove Favourite' : 'Mark as Favourite',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
      action: onFavourite,
      active: isFavorite,
    },
    {
      label: 'Mark as Unread',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
      action: onMarkUnread,
    },
    {
      label: isPinned ? 'Unpin Chat' : 'Pin Chat',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />,
      action: onPin,
      active: isPinned,
    },
    {
      label: 'Delete',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
      action: onDelete,
      red: true,
    },
  ]

  return (
    <div
      ref={menuRef}
      className={`absolute right-0 top-full mt-0.5 w-48 rounded-2xl shadow-xl py-1 z-50 ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
      }`}
    >
      {items.map(({ label, icon, action, red, active }) => (
        <button
          key={label}
          onClick={() => { action?.(); onClose() }}
          className={`${base} ${red ? 'text-red-500' : active ? 'text-violet-500' : ''}`}
        >
          <svg
            className={`w-4 h-4 ${red ? 'text-red-400' : active ? 'text-violet-500' : 'text-gray-400'}`}
            fill={active && !red ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {icon}
          </svg>
          {label}
        </button>
      ))}
    </div>
  )
}
