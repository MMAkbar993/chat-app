import { useRef, useEffect } from 'react'

const FILTERS = [
  { key: 'all',       label: 'All Chats' },
  { key: 'favourite', label: 'Favourite Chats' },
  { key: 'pinned',    label: 'Pinned Chats' },
  { key: 'archive',   label: 'Archive Chats' },
  { key: 'trash',     label: 'Trash' },
]

export default function ChatFilterMenu({ darkMode, currentFilter, onSelect, onClose }) {
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
