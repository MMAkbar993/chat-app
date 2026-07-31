import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { createCalendarEvent } from '../../api/calendar'

function toDateInput(d) {
  return d.toISOString().slice(0, 10)
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + n)
  return toDateInput(d)
}

export default function NewEventModal({ isOpen, onClose, onCreated, onInsufficientScope, darkMode, defaultDate }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => toDateInput(defaultDate || new Date()))
  const [allDay, setAllDay] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setTitle(''); setDate(toDateInput(defaultDate || new Date())); setAllDay(false)
    setStartTime('09:00'); setEndTime('10:00'); setDescription(''); setError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }
    if (!allDay && startTime >= endTime) { setError('End time must be after start time.'); return }

    setSaving(true)
    setError('')
    try {
      // For timed events, convert the local date+time inputs to a real UTC instant before
      // sending — a bare "2026-08-01T09:00:00" with no offset is ambiguous to Google's API,
      // while new Date(...) here correctly parses it as local time (per the datetime-local
      // input's own semantics), and toISOString() gives Google an unambiguous instant.
      const payload = allDay
        ? { title, description, allDay: true, start: date, end: addDays(date, 1) }
        : {
            title, description, allDay: false,
            start: new Date(`${date}T${startTime}:00`).toISOString(),
            end: new Date(`${date}T${endTime}:00`).toISOString(),
          }

      const { event } = await createCalendarEvent(payload)
      onCreated(event)
      handleClose()
    } catch (err) {
      if (err.response?.data?.error === 'insufficient_scope') {
        handleClose()
        onInsufficientScope()
      } else {
        setError(err.response?.data?.error || 'Could not create event.')
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
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>New event</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
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

        <Button type="submit" loading={saving} className="w-full">Create event</Button>
      </form>
    </Modal>
  )
}
