import { useRef, useEffect } from 'react'
import { useChat } from '../../context/ChatContext'

export default function ChatHeaderMenu({
  darkMode, onClose, conversationId, onMute, onClear, onDelete, onReport, onBlock, isBlocked,
  isGroup, onSearch, onVideoCall, onAudioCall, onScheduleMeeting, onContactInfo,
}) {
  const menuRef = useRef(null)
  const { closeConversation } = useChat()

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

  // These duplicate the header's own icon row — only surfaced here on mobile, where that row is
  // hidden to keep the header from being crowded with icons.
  const mobileItems = [
    onSearch && {
      label: 'Search',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
      action: () => { onSearch(); onClose() },
    },
    onVideoCall && {
      label: 'Video Call',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />,
      action: () => { onVideoCall(); onClose() },
    },
    onAudioCall && {
      label: 'Audio Call',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
      action: () => { onAudioCall(); onClose() },
    },
    !isGroup && onScheduleMeeting && {
      label: 'Schedule Meeting',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
      action: () => { onScheduleMeeting(); onClose() },
    },
    onContactInfo && {
      label: isGroup ? 'Group Info' : 'Contact Info',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      action: () => { onContactInfo(); onClose() },
    },
  ].filter(Boolean)

  const items = [
    {
      label: 'Close Chat',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
      action: () => { closeConversation(); onClose() },
    },
    {
      label: 'Mute Notification',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
      action: () => { onMute?.(); onClose() },
    },
    {
      label: 'Clear Message',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
      action: () => { onClear?.(); onClose() },
    },
    {
      label: 'Delete Chat',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
      action: () => { onDelete?.(); onClose() },
      red: true,
    },
    {
      label: 'Report',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />,
      action: () => { onReport?.(); onClose() },
    },
    {
      label: isBlocked ? 'Unblock' : 'Block',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />,
      action: () => { onBlock?.(); onClose() },
      orange: isBlocked,
    },
  ]

  return (
    <div
      ref={menuRef}
      className={`absolute right-0 top-full mt-1 w-52 rounded-2xl shadow-xl py-1 z-50 ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
      }`}
    >
      {mobileItems.map(({ label, icon, action }) => (
        <button key={label} onClick={action} className={`${base} md:hidden`}>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
          {label}
        </button>
      ))}
      {mobileItems.length > 0 && (
        <div className={`md:hidden my-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />
      )}
      {items.map(({ label, icon, action, red, orange }) => (
        <button
          key={label}
          onClick={action}
          className={`${base} ${red ? 'text-red-500 hover:text-red-600' : orange ? 'text-orange-500' : ''}`}
        >
          <svg className={`w-4 h-4 ${red ? 'text-red-400' : orange ? 'text-orange-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
          {label}
        </button>
      ))}
    </div>
  )
}
