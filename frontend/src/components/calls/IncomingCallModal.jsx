import { useEffect } from 'react'

export default function IncomingCallModal({ call, darkMode, onAccept, onReject }) {
  useEffect(() => {
    const timer = setTimeout(() => onReject?.(), 30000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className={`rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-4 w-72 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden animate-pulse">
          {call.callerAvatar
            ? <img src={call.callerAvatar} alt="" className="w-full h-full object-cover" />
            : (call.callerName || '?')[0].toUpperCase()
          }
        </div>
        <div className="text-center">
          <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{call.callerName || 'Unknown'}</p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Incoming {call.callType === 'video' ? 'video' : 'voice'} call...
          </p>
        </div>
        <div className="flex gap-6 mt-2">
          <button onClick={() => onReject()}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button onClick={() => onAccept()}
            className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors shadow-lg">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
