import { useRef, useEffect } from 'react'

export default function MessageContextMenu({ onReply, onForward, onCopy, onDelete, onDeleteForMe, onClose, isMe, darkMode }) {
  const menuRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const itemClass = `flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left transition-colors rounded-xl whitespace-nowrap ${
    darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
  }`

  return (
    <div
      ref={menuRef}
      className={`absolute z-50 rounded-2xl shadow-xl py-1.5 px-1.5 ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
      } ${isMe ? 'right-0' : 'left-0'} top-0`}
      style={{ minWidth: '13rem' }}
    >
      <button className={itemClass} onClick={() => { onReply(); onClose() }}>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Reply
      </button>
      <button className={itemClass} onClick={() => { onForward(); onClose() }}>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Forward
      </button>
      <button className={itemClass} onClick={() => { onCopy(); onClose() }}>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copy
      </button>

      <div className={`my-1 -mx-1.5 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />

      <button
        className={`${itemClass} text-red-500 hover:text-red-600`}
        onClick={() => { onDeleteForMe(); onClose() }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Delete for Me
      </button>
      {isMe && (
        <button
          className={`${itemClass} text-red-500 hover:text-red-600`}
          onClick={() => { onDelete(); onClose() }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Delete for Everyone
        </button>
      )}
    </div>
  )
}
