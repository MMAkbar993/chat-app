export default function CallingCard({ call, onEnd, darkMode }) {
  const isVideo = call.callType === 'video' || call.call_type === 'video'
  const calleeName = call.calleeName || call.callerName || 'Unknown'
  const avatar = call.calleeAvatar || call.callerAvatar

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-72 flex flex-col items-center gap-4">
        {/* Call type icon */}
        <div className="w-16 h-16 rounded-full bg-violet-100 border-2 border-violet-300 flex items-center justify-center">
          {isVideo ? (
            <svg className="w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          )}
        </div>

        {/* Status text */}
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">Calling {calleeName}...</p>
          <p className="text-sm text-gray-400 mt-1">Ringing...</p>
        </div>

        {/* Callee avatar */}
        <div className="w-20 h-20 rounded-full overflow-hidden bg-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            (calleeName || '?')[0].toUpperCase()
          )}
        </div>

        {/* Hang up button */}
        <button
          onClick={onEnd}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-colors mt-2"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
