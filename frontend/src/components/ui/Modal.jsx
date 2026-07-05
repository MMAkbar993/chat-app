import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ isOpen, onClose, children, maxWidth = 'max-w-lg', darkMode = false, scroll = false }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative z-10 w-full ${maxWidth} ${scroll ? 'max-h-[85vh] overflow-y-auto' : ''} rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body
  )
}
