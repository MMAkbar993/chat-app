import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const ToastContext = createContext(null)

const ICONS = {
  success: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  error: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  info: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  warning: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  ),
}

const COLORS = {
  success: 'bg-green-500',
  error:   'bg-red-500',
  info:    'bg-violet-600',
  warning: 'bg-amber-500',
}

function ToastItem({ id, message, type, onRemove }) {
  const timerRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true))
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(id), 300)
    }, 3000)
    return () => clearTimeout(timerRef.current)
  }, [id, onRemove])

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-white text-sm font-medium transition-all duration-300 ${COLORS[type] || COLORS.info} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
      }`}
    >
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {ICONS[type] || ICONS.info}
      </svg>
      <span>{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 300) }}
        className="ml-auto shrink-0 opacity-70 hover:opacity-100"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — fixed top-center */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 min-w-72 max-w-sm pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-2">
          {toasts.map((t) => (
            <ToastItem key={t.id} {...t} onRemove={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
