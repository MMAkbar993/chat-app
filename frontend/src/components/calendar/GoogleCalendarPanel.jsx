import { useCallback, useEffect, useState } from 'react'
import client from '../../api/client'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { openSocialOAuthPopup, subscribeSocialOAuthResults } from '../../utils/socialOAuth'

function fmtEventTime(start) {
  if (!start) return ''
  const d = new Date(start)
  const isAllDay = start.length === 10 // date-only strings ("2026-08-01") vs datetime
  if (isAllDay) return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function GoogleCalendarPanel({ darkMode, onClose }) {
  const [connected, setConnected] = useState(null) // null = unknown/loading
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [disconnecting, setDisconnecting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await client.get('/calendar/events')
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
  }, [])

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
      await client.delete('/calendar/disconnect')
      setConnected(false)
      setEvents([])
    } catch {
      setError('Could not disconnect. Please try again.')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} maxWidth="max-w-md" darkMode={darkMode} scroll>
      <div className="p-6">
        <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Google Calendar</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-7 h-7 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : connected === false ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Connect your Google Calendar to see your upcoming events here.
            </p>
            <Button onClick={handleConnect}>Connect Google Calendar</Button>
          </div>
        ) : (
          <div>
            {events.length === 0 ? (
              <p className={`text-sm text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No upcoming events in the next few days.
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((e) => (
                  <a
                    key={e.id}
                    href={e.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block rounded-xl px-4 py-3 transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{e.title}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{fmtEventTime(e.start)}</p>
                  </a>
                ))}
              </div>
            )}

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className={`w-full text-center text-xs mt-4 pt-4 border-t transition-colors disabled:opacity-50 ${darkMode ? 'border-gray-800 text-gray-500 hover:text-red-400' : 'border-gray-100 text-gray-400 hover:text-red-500'}`}
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect Google Calendar'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
