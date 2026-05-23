import { useState, useRef, useEffect } from 'react'

const CATEGORIES = {
  '😀': ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','🥴','😠','😡','🤬','😷','🤒','🤕','🤢','🤮','🤧','😇','🥳','🥺'],
  '👋': ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💪','💅','🤳','🫶','🫀','🫁'],
  '❤️': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💋','😻','💑','👫','👬','👭'],
  '🐶': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐴','🦄','🐝','🦋','🐞','🐜','🦗','🐢','🦎','🐍','🐙','🦑','🦀','🐠','🐟','🐬','🐳','🦭','🐊','🦕','🦖'],
  '🍎': ['🍎','🍊','🍋','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🌶️','🥕','🧄','🥔','🍠','🥜','🍞','🧀','🥚','🍳','🥞','🧇','🥓','🌮','🌯','🥙','🍿','🍱','🍣','🍦','🧁','🎂','🍰','🍪','🍩','🍫','🍬','🍭','🥤','☕','🍺','🍻','🥂','🍷','🥃','🍹'],
  '✈️': ['🚗','🚕','🚙','🚌','🏎️','🚓','🚑','🚒','🛻','🚚','🚜','🏍️','🛵','🚲','🛴','✈️','🚀','🛸','⛵','🚢','🚂','🚆','🚇','🗺️','🗼','🏰','🏯','🌋','🏔️','⛰️','🏕️','🏖️','🏝️','🌅','🌄','🌠','🎆','🎇','🗽'],
  '⚽': ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🎿','🛷','🎯','🎮','🎲','🧩','🎪','🎭','🎨','🎬','🎤','🎧','🎼','🎵','🎶','🎷','🎸','🎹','🎺','🎻','🥁','🎰','🏆','🥇','🎖️','🏅'],
  '💡': ['💻','📱','⌨️','🖥️','💾','💿','📷','📸','📹','📞','☎️','📺','📻','🔋','🔌','💡','🔦','🔮','💰','💵','💳','🪙','📊','📈','📉','✉️','📦','📬','📋','📌','📍','✂️','🔑','🗝️','🔒','🔓','🔨','⚙️','🔭','🔬','🩺','💊','🩹'],
  '🔴': ['❤️‍🔥','✨','⭐','🌟','💫','⚡','🌈','🌊','🎉','🎊','🎈','🎁','🎀','🏆','🔥','💯','✔️','❌','❓','❗','♻️','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔔','🔕','💬','💭','🗯️','🕐','🕑','🕒','🕓'],
}

const ALL_EMOJIS = Object.values(CATEGORIES).flat()

export default function EmojiPicker({ onSelect, onClose, darkMode }) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('😀')
  const pickerRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const filtered = search.trim()
    ? ALL_EMOJIS.filter((e) => e.includes(search.trim()))
    : (CATEGORIES[activeTab] || [])

  return (
    <div
      ref={pickerRef}
      className={`w-72 rounded-2xl shadow-2xl overflow-hidden ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
      }`}
    >
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji..."
          autoFocus
          className={`w-full rounded-xl px-3 py-1.5 text-sm outline-none ${
            darkMode ? 'bg-gray-700 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-800 placeholder-gray-400'
          }`}
        />
      </div>

      {/* Category tabs */}
      {!search.trim() && (
        <div className={`flex gap-0.5 px-2 pb-1.5 overflow-x-auto border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          {Object.keys(CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`text-lg p-1.5 rounded-lg transition-colors shrink-0 ${
                activeTab === cat
                  ? darkMode ? 'bg-gray-600' : 'bg-violet-50'
                  : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="h-52 overflow-y-auto p-2">
        <div className="grid grid-cols-8 gap-0.5">
          {filtered.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => { onSelect(emoji); onClose() }}
              className={`text-xl p-1.5 rounded-lg transition-colors hover:scale-110 ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className={`text-xs text-center py-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No results</p>
        )}
      </div>
    </div>
  )
}
