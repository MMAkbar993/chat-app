const HOUR_HEIGHT = 56 // px
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isAllDay(e) {
  return e.start?.length === 10
}

function minutesIntoDay(dateStr) {
  const d = new Date(dateStr)
  return d.getHours() * 60 + d.getMinutes()
}

function fmtHour(h) {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

export default function WeekGrid({ darkMode, days, today, events, onEventClick }) {
  const allDayEvents = events.filter(isAllDay)
  const timedEvents = events.filter((e) => !isAllDay(e))

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day headers */}
      <div className="flex border-b shrink-0" style={{ borderColor: darkMode ? '#1f2937' : '#f3f4f6' }}>
        <div className="w-14 shrink-0" />
        {days.map((day) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={day.toISOString()} className="flex-1 text-center py-2 min-w-0">
              <p className={`text-[11px] uppercase font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {day.toLocaleDateString([], { weekday: 'short' })}
              </p>
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm mt-0.5 ${
                  isToday ? 'bg-violet-600 text-white font-semibold' : darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}
              >
                {day.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* All-day strip */}
      {allDayEvents.length > 0 && (
        <div className="flex border-b shrink-0" style={{ borderColor: darkMode ? '#1f2937' : '#f3f4f6' }}>
          <div className="w-14 shrink-0" />
          {days.map((day) => (
            <div key={day.toISOString()} className="flex-1 min-w-0 p-1 space-y-0.5">
              {allDayEvents.filter((e) => isSameDay(new Date(`${e.start}T00:00`), day)).map((e) => (
                <button
                  key={e.id}
                  onClick={() => onEventClick(e)}
                  title={e.title}
                  className={`w-full text-left text-[11px] px-1.5 py-0.5 rounded truncate ${
                    darkMode ? 'bg-emerald-900/50 text-emerald-200' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {e.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto" ref={(el) => el && el.scrollTo(0, HOUR_HEIGHT * 7)}>
        <div className="flex" style={{ height: HOUR_HEIGHT * 24 }}>
          <div className="w-14 shrink-0">
            {HOURS.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT }} className={`text-right pr-2 text-[11px] -mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {h !== 0 && fmtHour(h)}
              </div>
            ))}
          </div>
          {days.map((day) => {
            const dayEvents = timedEvents.filter((e) => isSameDay(new Date(e.start), day))
            return (
              <div key={day.toISOString()} className={`flex-1 min-w-0 relative border-l ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                {HOURS.map((h) => (
                  <div key={h} style={{ height: HOUR_HEIGHT }} className={`border-b ${darkMode ? 'border-gray-800' : 'border-gray-50'}`} />
                ))}
                {dayEvents.map((e, idx) => {
                  const startMin = minutesIntoDay(e.start)
                  const endMin = e.end ? Math.max(minutesIntoDay(e.end), startMin + 20) : startMin + 30
                  const top = (startMin / 60) * HOUR_HEIGHT
                  const height = ((endMin - startMin) / 60) * HOUR_HEIGHT
                  return (
                    <button
                      key={e.id}
                      onClick={() => onEventClick(e)}
                      title={e.title}
                      style={{ top, height: Math.max(height, 18), left: `${(idx % 3) * 6}px`, right: 2 }}
                      className={`absolute text-left text-[11px] leading-tight px-1.5 py-0.5 rounded overflow-hidden transition-colors ${
                        darkMode ? 'bg-violet-900/70 text-violet-200 hover:bg-violet-800' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                      }`}
                    >
                      {e.title}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
