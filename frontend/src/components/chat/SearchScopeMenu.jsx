import { useRef, useEffect } from 'react'

const SCOPES = [
  {
    key: 'all',
    label: 'Everything',
    hint: 'Names & messages',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    ),
  },
  {
    key: 'name',
    label: 'Names',
    hint: 'Search by people',
    icon: (
      <>
        <circle cx="12" cy="8" r="4" strokeWidth={1.75} fill="none" stroke="currentColor" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 21a8 8 0 00-16 0" />
      </>
    ),
  },
  {
    key: 'messages',
    label: 'Messages',
    hint: 'Search in conversations',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    ),
  },
]

export default function SearchScopeMenu({ darkMode, currentScope, onSelect, onClose }) {
  const menuRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className={`absolute right-0 top-full mt-2 w-60 rounded-2xl shadow-xl py-2 z-50 ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
      }`}
    >
      <p className={`px-4 pb-1.5 text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Search in
      </p>
      {SCOPES.map(({ key, label, hint, icon }) => {
        const active = currentScope === key
        return (
          <button
            key={key}
            onClick={() => { onSelect(key); onClose() }}
            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
              active
                ? darkMode ? 'bg-violet-500/10' : 'bg-violet-50'
                : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}
          >
            <svg
              className={`w-4 h-4 shrink-0 ${active ? 'text-violet-600' : darkMode ? 'text-gray-400' : 'text-gray-400'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              {icon}
            </svg>
            <span className="flex-1 min-w-0">
              <span className={`block text-sm font-semibold ${
                active ? 'text-violet-600' : darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {label}
              </span>
              <span className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{hint}</span>
            </span>
            {active && (
              <svg className="w-4 h-4 shrink-0 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}
