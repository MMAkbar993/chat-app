// The list that opens above the message box when you type "@", Telegram-style. Purely visual:
// MessageInput decides when it shows, what it lists and which row is active.
export default function MentionPicker({ items, activeIndex, onPick, onHover, darkMode }) {
  if (!items.length) return null
  return (
    <div
      role="listbox"
      aria-label="Mention someone"
      className={`absolute bottom-full left-0 right-0 mb-2 z-30 max-h-64 overflow-y-auto rounded-xl shadow-xl border py-1 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}
    >
      {items.map((p, i) => (
        <button
          key={p.id}
          type="button"
          role="option"
          aria-selected={i === activeIndex}
          // mousedown, not click: keeps the focus (and the caret) in the message box
          onMouseDown={(e) => { e.preventDefault(); onPick(p) }}
          onMouseEnter={() => onHover(i)}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
            i === activeIndex ? (darkMode ? 'bg-gray-700' : 'bg-violet-50') : ''
          }`}
        >
          <span className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-violet-500 text-white text-xs font-bold flex items-center justify-center">
            {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : (p.name || '?')[0].toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className={`block text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{p.name}</span>
            <span className={`block text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>@{p.username}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
