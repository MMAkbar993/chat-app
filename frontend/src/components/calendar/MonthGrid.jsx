const MAX_PILLS = 3

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function eventDate(e) {
  return new Date(e.start?.length === 10 ? `${e.start}T00:00` : e.start)
}

export default function MonthGrid({ darkMode, days, currentMonth, today, events, onEventClick }) {
  const eventsByDay = days.map((day) => events.filter((e) => isSameDay(eventDate(e), day)))

  return (
    <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
      {days.map((day, i) => {
        const inMonth = day.getMonth() === currentMonth
        const isToday = isSameDay(day, today)
        const dayEvents = eventsByDay[i]
        return (
          <div
            key={day.toISOString()}
            className={`border-b border-r p-1.5 overflow-hidden flex flex-col ${darkMode ? 'border-gray-800' : 'border-gray-100'} ${
              !inMonth ? (darkMode ? 'bg-gray-900/40' : 'bg-gray-50/60') : ''
            }`}
          >
            <span
              className={`text-xs w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${
                isToday
                  ? 'bg-violet-600 text-white font-semibold'
                  : inMonth
                  ? darkMode ? 'text-gray-300' : 'text-gray-700'
                  : darkMode ? 'text-gray-600' : 'text-gray-400'
              }`}
            >
              {day.getDate()}
            </span>
            <div className="mt-1 space-y-0.5 overflow-hidden">
              {dayEvents.slice(0, MAX_PILLS).map((e) => (
                <button
                  key={e.id}
                  onClick={() => onEventClick(e)}
                  title={e.title}
                  className={`w-full text-left text-[11px] leading-tight px-1.5 py-0.5 rounded truncate transition-colors ${
                    darkMode ? 'bg-violet-900/50 text-violet-200 hover:bg-violet-900' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                  }`}
                >
                  {e.title}
                </button>
              ))}
              {dayEvents.length > MAX_PILLS && (
                <p className={`text-[11px] px-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  +{dayEvents.length - MAX_PILLS} more
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
