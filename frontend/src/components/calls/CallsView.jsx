import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getCalls } from '../../api/calls'
import NewCallModal from './NewCallModal'

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff} min ago`
  const h = Math.floor(diff / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d > 1 ? 's' : ''} ago`
}

const STATUS_ICON = {
  missed: { color: 'text-red-500', label: 'Missed' },
  answered: { color: 'text-green-500', label: 'Answered' },
  declined: { color: 'text-orange-500', label: 'Declined' },
  busy: { color: 'text-yellow-500', label: 'Busy' },
}

export default function CallsView({ darkMode, onCallStart, onNewCall }) {
  const { user } = useAuth()
  const [calls, setCalls] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showNewCall, setShowNewCall] = useState(false)

  useEffect(() => {
    getCalls().then((d) => setCalls(d.calls || [])).catch(() => {})
  }, [])

  const filtered = calls.filter((c) => {
    const other = c.caller_id === user?.id ? c.callee_name : c.caller_name
    if (search && !(other || '').toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'missed') return c.status === 'missed'
    if (filter === 'incoming') return c.callee_id === user?.id
    if (filter === 'outgoing') return c.caller_id === user?.id
    return true
  })

  function handleNewCallStart(callType, targetUserId, targetName, targetAvatar) {
    setShowNewCall(false)
    onNewCall?.(callType, targetUserId, targetName, targetAvatar)
  }

  return (
    <div className={`w-80 flex flex-col border-r ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Calls</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewCall(true)}
            className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white hover:bg-violet-700 transition-colors"
            title="New call"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className={`bg-transparent flex-1 outline-none text-sm ${darkMode ? 'text-white placeholder-gray-500' : 'placeholder-gray-400'}`}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-4 pb-2 flex gap-1">
        {[['all', 'All Calls'], ['missed', 'Missed'], ['incoming', 'Incoming'], ['outgoing', 'Outgoing']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
              filter === key
                ? 'bg-violet-100 text-violet-700'
                : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((c) => {
          const isMe = c.caller_id === user?.id
          const otherName = isMe ? c.callee_name : c.caller_name
          const otherAvatar = isMe ? c.callee_avatar : c.caller_avatar
          const { color, label } = STATUS_ICON[c.status] || STATUS_ICON.missed

          return (
            <div key={c.id}
              className={`flex items-center gap-3 px-4 py-3 border-b transition-colors cursor-pointer ${darkMode ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-50 hover:bg-gray-50'}`}
              onClick={() => {
                const targetId = isMe ? c.callee_id : c.caller_id
                if (targetId) onNewCall?.(c.call_type, targetId, otherName, otherAvatar)
              }}
            >
              <div className="relative shrink-0 w-11 h-11">
                <div className="w-full h-full rounded-full overflow-hidden">
                  {otherAvatar ? <img src={otherAvatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">{(otherName || '?')[0].toUpperCase()}</div>}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{otherName || 'Unknown'}</p>
                <div className="flex items-center gap-1">
                  <svg className={`w-3 h-3 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label} · {timeAgo(c.started_at)}</span>
                </div>
              </div>
              <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className={`text-sm text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No calls yet</p>
        )}
      </div>

      {showNewCall && (
        <NewCallModal
          darkMode={darkMode}
          onClose={() => setShowNewCall(false)}
          onCall={handleNewCallStart}
        />
      )}
    </div>
  )
}
