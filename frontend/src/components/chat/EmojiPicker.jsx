import { useState, useRef, useEffect, useMemo } from 'react'

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
const plain = (e) => e.replace(/️/g, '') // without the "show as emoji" marker, to compare
const OUR_EMOJIS = new Set(ALL_EMOJIS.map(plain))

// Search by words ("smile", "laugh", "thumbs up", "party"), using emojilib's keyword list for
// every emoji. It is loaded the first time someone searches, so the chat itself stays as small.
// Each typed word has to match a keyword. Best is a word of the emoji's own name ("heart" →
// red heart), then a whole keyword, then the start of a word; text inside a word (3+ letters)
// only counts when nothing matches better. The emojis on our tabs come first when the match is
// as good.
let emojiLibLoad = null
function loadEmojiLib() {
  if (!emojiLibLoad) emojiLibLoad = import('emojilib').then((m) => m.default || m)
  return emojiLibLoad
}

function searchEmojis(index, query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const hits = []
  for (const { emoji, terms } of index) {
    let score = 0
    let loose = false
    let byName = true
    for (const w of words) {
      let best = 0
      for (let i = 0; i < terms.length && best < 8; i++) {
        const t = terms[i]
        const parts = t.split(' ')
        if (i === 0 && (t === w || parts.includes(w))) best = Math.max(best, 8)
        else if (t === w) best = Math.max(best, 6)
        else if (parts.some((p) => p.startsWith(w))) best = Math.max(best, i === 0 ? 5 : 4)
        else if (w.length >= 3 && t.includes(w)) best = Math.max(best, 1)
      }
      if (!best) { score = 0; break }
      if (best === 1) loose = true
      if (best !== 8) byName = false
      score += best
    }
    if (score) hits.push({ emoji, score: score + (OUR_EMOJIS.has(plain(emoji)) ? 2 : 0), loose, byName, nameLength: terms[0].length, order: hits.length })
  }
  // Text-inside-a-word matches only when there is nothing better. Ties keep emojilib's order,
  // except between two name matches, where the shorter name wins ("fire" before "fire engine").
  const good = hits.filter((h) => !h.loose)
  return (good.length ? good : hits)
    .sort((a, b) => b.score - a.score || (a.byName && b.byName ? a.nameLength - b.nameLength : 0) || a.order - b.order)
    .slice(0, 120)
    .map((h) => h.emoji)
}

export default function EmojiPicker({ onSelect, onClose, darkMode }) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('😀')
  const [lib, setLib] = useState(null)
  const [libFailed, setLibFailed] = useState(false)
  const pickerRef = useRef(null)
  const query = search.trim()

  useEffect(() => {
    if (!query || lib) return
    let gone = false
    loadEmojiLib()
      .then((data) => { if (!gone) setLib(data) })
      .catch(() => { if (!gone) setLibFailed(true) })
    return () => { gone = true }
  }, [query, lib])

  const index = useMemo(() => (lib
    ? Object.entries(lib).map(([emoji, kws]) => ({ emoji, terms: kws.map((k) => String(k).replace(/_/g, ' ').toLowerCase()) }))
    : null), [lib])

  useEffect(() => {
    function handler(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const searching = Boolean(query) && !index && !libFailed
  const filtered = query
    ? (index ? searchEmojis(index, query) : ALL_EMOJIS.filter((e) => e.includes(query)))
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
          placeholder="Search emoji (smile, heart, party…)"
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
          <p className={`text-xs text-center py-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{searching ? 'Searching…' : 'No results'}</p>
        )}
      </div>
    </div>
  )
}
