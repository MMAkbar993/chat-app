import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { getCalendarStatus, scheduleMeeting } from '../../api/calendar'
import { openSocialOAuthPopup, subscribeSocialOAuthResults } from '../../utils/socialOAuth'

function toDateInput(d) {
  return d.toISOString().slice(0, 10)
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + n)
  return toDateInput(d)
}

export default function ScheduleMeetingModal({ isOpen, onClose, onScheduled, conversationId, darkMode }) {
  const [status, setStatus] = useState(null) // null = loading, else { connected, calendarName }
  const [needsReconnect, setNeedsReconnect] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => toDateInput(new Date()))
  const [allDay, setAllDay] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadStatus = () => {
    setStatus(null)
    getCalendarStatus()
      .then((data) => { setStatus(data); setNeedsReconnect(false) })
      .catch(() => setStatus({ connected: false, calendarName: null }))
  }

  useEffect(() => { if (isOpen) loadStatus() }, [isOpen])

  useEffect(() => {
    return subscribeSocialOAuthResults((data) => {
      if (data.type === 'social-connect-success' && data.platform === 'calendar') loadStatus()
    })
  }, [])

  function reset() {
    setTitle(''); setDate(toDateInput(new Date())); setAllDay(false)
    setStartTime('09:00'); setEndTime('10:00'); setDescription(''); setError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleConnect() {
    const { blocked } = openSocialOAuthPopup('calendar', { path: '/api/calendar/connect' })
    if (blocked) setError('Popup was blocked. Allow popups for this site and try again.')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }
    if (!allDay && startTime >= endTime) { setError('End time must be after start time.'); return }

    setSaving(true)
    setError('')
    try {
      // Local date+time inputs converted to a real UTC instant — a bare "2026-08-01T09:00:00"
      // with no offset is ambiguous to Google's API, while new Date(...) here correctly parses it
      // as local time (per the input's own semantics), and toISOString() gives an unambiguous instant.
      const payload = allDay
        ? { conversationId, title, description, allDay: true, start: date, end: addDays(date, 1) }
        : {
            conversationId, title, description, allDay: false,
            start: new Date(`${date}T${startTime}:00`).toISOString(),
            end: new Date(`${date}T${endTime}:00`).toISOString(),
          }

      const { message } = await scheduleMeeting(payload)
      onScheduled(message)
      handleClose()
    } catch (err) {
      if (err.response?.data?.error === 'insufficient_scope') {
        setNeedsReconnect(true)
      } else {
        setError(err.response?.data?.error || 'Could not schedule the meeting.')
      }
    } finally {
      setSaving(false)
    }
  }

  const inputClass = `w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-violet-400 ${
    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
  }`

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md" darkMode={darkMode} scroll>
      <div className="p-6">
        <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Schedule meeting</h2>

        {status === null ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-7 h-7 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !status.connected ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Connect your Google Calendar to schedule meetings without leaving the chat.
            </p>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}
            <Button onClick={handleConnect}>Connect Google Calendar</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Scheduling on: <span className="font-medium">{status.calendarName || 'your Google Calendar'}</span>
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
            )}

            {needsReconnect && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3">
                <span>This connection needs to be upgraded to allow scheduling.</span>
                <button type="button" onClick={handleConnect} className="shrink-0 font-semibold text-amber-900 hover:underline">Reconnect</button>
              </div>
            )}

            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus
                placeholder="e.g. Strategy call" className={inputClass} />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
            </div>

            <label className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)}
                className="w-4 h-4 rounded accent-violet-600" />
              All day
            </label>

            {!allDay && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>End</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className={inputClass} />
                </div>
              </div>
            )}

            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description (optional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} />
            </div>

            <Button type="submit" loading={saving} className="w-full">Schedule &amp; send invite</Button>
          </form>
        )}
      </div>
    </Modal>
  )
}
