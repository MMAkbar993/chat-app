import { formatCallDuration } from '../../utils/chatTime'

// A call shown inside the message list: who called, audio or video, missed or how long.
export default function CallEventPill({ msg, userId, darkMode, meAvatar, meName }) {
  let callData = {}
  try { callData = JSON.parse(msg.content || '{}') } catch { /* an old or malformed call record: show it without details */ }
  const isCaller = msg.sender_id === userId
  const isVideo = callData.call_type === 'video'
  const callType = isVideo ? 'Video' : 'Audio'
  const isMissed = callData.status === 'missed'
  const dur = formatCallDuration(callData.duration)
  const label = isMissed
    ? isCaller ? 'No answer' : `Missed ${callType.toLowerCase()} call`
    : `${callType} call`
  const sub = isMissed ? `${callType} call` : (dur || new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

  const callIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {isVideo
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      }
    </svg>
  )

  return (
    <div className={`flex ${isCaller ? 'justify-end' : 'justify-start'} mb-1 items-end gap-2`}>
      {!isCaller && (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden ${msg.sender_avatar ? '' : 'bg-violet-500'}`}>
          {msg.sender_avatar
            ? <img src={msg.sender_avatar} alt="" className="w-full h-full object-cover" />
            : (msg.sender_display_name || msg.sender_name || '?')[0].toUpperCase()}
        </div>
      )}

      <div className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'}`}>
        <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isMissed
            ? darkMode ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-500'
            : darkMode ? 'bg-violet-900/40 text-violet-400' : 'bg-violet-100 text-violet-600'
        }`}>
          {callIcon}
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${isMissed ? 'text-red-500' : darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{label}</p>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{sub}</p>
        </div>
      </div>

      {isCaller && (
        <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden order-last">
          {meAvatar
            ? <img src={meAvatar} alt="" className="w-full h-full object-cover" />
            : (meName || '?')[0].toUpperCase()}
        </div>
      )}
    </div>
  )
}
