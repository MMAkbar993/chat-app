import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCalendarEvents, disconnectCalendar } from '../../api/calendar'
import Button from '../ui/Button'
import MonthGrid from './MonthGrid'
import WeekGrid from './WeekGrid'
import { openSocialOAuthPopup, subscribeSocialOAuthResults } from '../../utils/socialOAuth'

const VIEWS = ['day', 'week', 'month']

function startOfDay(d) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function startOfWeek(d) {
  const c = startOfDay(d)
  c.setDate(c.getDate() - c.getDay())
  return c
}

function addDays(d, n) {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

function addMonths(d, n) {
  const c = new Date(d)
  c.setMonth(c.getMonth() + n)
  return c
}

function getRange(view, currentDate) {
  if (view === 'day') {
    const start = startOfDay(currentDate)
    return { start, end: addDays(start, 1), days: [start] }
  }
  if (view === 'week') {
    const start = startOfWeek(currentDate)
    const end = addDays(start, 7)
    return { start, end, days: Array.from({ length: 7 }, (_, i) => addDays(start, i)) }
  }
  // month — grid always shows 6 full weeks (42 days) so the layout never reflows
  const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const start = startOfWeek(firstOfMonth)
  const end = addDays(start, 42)
  return { start, end, days: Array.from({ length: 42 }, (_, i) => addDays(start, i)) }
}

function periodLabel(view, currentDate, range) {
  if (view === 'day') return currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  if (view === 'month') return currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })
  const end = addDays(range.start, 6)
  const sameMonth = range.start.getMonth() === end.getMonth()
  const startStr = range.start.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const endStr = end.toLocaleDateString([], sameMonth ? { day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })
  return `${startStr} – ${endStr}`
}

export default function CalendarPage({ darkMode }) {
  const [connected, setConnected] = useState(null)
  const [view, setView] = useState('month')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [disconnecting, setDisconnecting] = useState(false)

  const today = useMemo(() => new Date(), [])
  const range = useMemo(() => getRange(view, currentDate), [view, currentDate])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getCalendarEvents(range.start.toISOString(), range.end.toISOString())
      setEvents(data.events)
      setConnected(true)
    } catch (err) {
      if (err.response?.status === 404) {
        setConnected(false)
      } else {
        setError(err.response?.data?.error || 'Could not load your calendar')
      }
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    return subscribeSocialOAuthResults((data) => {
      if (data.type === 'social-connect-success' && data.platform === 'calendar') load()
    })
  }, [load])

  function handleConnect() {
    const { blocked } = openSocialOAuthPopup('calendar', { path: '/api/calendar/connect' })
    if (blocked) setError('Popup was blocked. Allow popups for this site and try again.')
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await disconnectCalendar()
      setConnected(false)
      setEvents([])
    } catch {
      setError('Could not disconnect. Please try again.')
    } finally {
      setDisconnecting(false)
    }
  }

  function navigate(dir) {
    if (view === 'day') setCurrentDate((d) => addDays(d, dir))
    else if (view === 'week') setCurrentDate((d) => addDays(d, dir * 7))
    else setCurrentDate((d) => addMonths(d, dir))
  }

  function onEventClick(e) {
    if (e.htmlLink) window.open(e.htmlLink, '_blank', 'noopener,noreferrer')
  }

  if (connected === false) {
    return (
      <div className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="text-center max-w-sm px-6">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Connect your Google Calendar to see your upcoming events here.
          </p>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}
          <Button onClick={handleConnect}>Connect Google Calendar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between gap-4 px-6 py-4 border-b shrink-0 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Calendar</h1>
          <button
            onClick={() => navigate(-1)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            onClick={() => navigate(1)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Today
          </button>
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{periodLabel(view, currentDate, range)}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex rounded-lg p-0.5 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                  view === v ? 'bg-violet-600 text-white' : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className={`text-xs disabled:opacity-50 ${darkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      </div>

      {error && <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : view === 'month' ? (
        <MonthGrid darkMode={darkMode} days={range.days} currentMonth={currentDate.getMonth()} today={today} events={events} onEventClick={onEventClick} />
      ) : (
        <WeekGrid darkMode={darkMode} days={range.days} today={today} events={events} onEventClick={onEventClick} />
      )}
    </div>
  )
}
