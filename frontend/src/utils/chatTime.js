// Time and date wording used across the chat screens.

// Chat and group lists: "14:05" today, then "Yesterday", "3 days ago", then a date.
export function formatListTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const today = new Date()
  const diff = Math.floor((today - d) / 86400000)
  if (diff === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return d.toLocaleDateString()
}

// A call length in seconds as "m:ss".
export function formatCallDuration(secs) {
  if (!secs) return ''
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// The chat header line for someone offline.
export function formatLastSeen(ts) {
  if (!ts) return 'Offline'
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'last seen just now'
  if (diffMins < 60) return `last seen ${diffMins}m ago`
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const today = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (date >= today) return `last seen today at ${timeStr}`
  if (date >= yesterday) return `last seen yesterday at ${timeStr}`
  return `last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
}

// The divider between days in an open chat.
export function formatDayLabel(ts) {
  const d = new Date(ts)
  const today = new Date()
  const diff = Math.floor((today - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString()
}

// Messages with a day divider before the first message of each day.
export function groupByDate(messages) {
  const groups = []
  let lastDate = null
  for (const msg of messages) {
    const date = new Date(msg.created_at).toDateString()
    if (date !== lastDate) {
      groups.push({ type: 'date', label: formatDayLabel(msg.created_at) })
      lastDate = date
    }
    groups.push({ type: 'msg', msg })
  }
  return groups
}
