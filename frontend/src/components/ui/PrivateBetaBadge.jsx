import { useLocation } from 'react-router-dom'

export default function PrivateBetaBadge() {
  const location = useLocation()
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/chat')) return null

  return (
    <div className="fixed bottom-3 right-3 z-100 pointer-events-none select-none">
      <span className="inline-flex items-center gap-1.5 bg-gray-900/90 text-white text-[11px] font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Private Beta
      </span>
    </div>
  )
}
