import { useEffect, useRef, useState } from 'react'
import { getMessageReadsApi } from '../../api/conversations'

// "14:18" today, "Yesterday 14:18", otherwise "12 Oct 14:18".
function formatReadTime(ts) {
  const d = new Date(ts)
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d >= today) return time
  if (d >= yesterday) return `Yesterday ${time}`
  return `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })} ${time}`
}

function Person({ p, darkMode, right }) {
  return (
    <li className="flex items-center gap-2.5 py-1.5">
      <span className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
        {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : (p.name || '?')[0].toUpperCase()}
      </span>
      <span className={`flex-1 min-w-0 truncate text-sm ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{p.name}</span>
      {right && <span className={`text-xs shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{right}</span>}
    </li>
  )
}

// Who has read one of your group messages, opened from its ticks.
export default function ReadByPopover({ messageId, darkMode, onClose }) {
  const ref = useRef(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let live = true
    getMessageReadsApi(messageId)
      .then((d) => { if (live) setData(d) })
      .catch(() => { if (live) setError(true) })
    return () => { live = false }
  }, [messageId])

  useEffect(() => {
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const heading = `text-[11px] font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Read by"
      className={`absolute bottom-full right-0 mb-2 z-30 w-64 max-h-72 overflow-y-auto rounded-xl shadow-xl border p-3 text-left ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}
    >
      {!data && !error && (
        <div className="flex justify-center py-3">
          <span className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Could not load who read this.</p>}
      {data && (
        <>
          <p className={heading}>Read by</p>
          {data.read.length ? (
            <ul className="mt-1">
              {data.read.map((p) => <Person key={p.id} p={p} darkMode={darkMode} right={p.read_at ? formatReadTime(p.read_at) : 'Read'} />)}
            </ul>
          ) : (
            <p className={`mt-1 mb-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nobody yet</p>
          )}
          {data.notRead.length > 0 && (
            <>
              <p className={`${heading} mt-3`}>Not read yet</p>
              <ul className="mt-1 opacity-70">
                {data.notRead.map((p) => <Person key={p.id} p={p} darkMode={darkMode} />)}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )
}
