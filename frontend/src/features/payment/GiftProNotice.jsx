import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { giftProEnd, giftProText } from '../../utils/plan'

// Shown once when someone opens Pulse with free Pro from the Christmas giveaway, so they know
// they have been upgraded (and do not go looking for an upgrade they already have). Shown again
// only if the end date changes, i.e. they win more Pro.
const SEEN_KEY = 'pulse:giftProSeen'

function seenFor() {
  try { return localStorage.getItem(SEEN_KEY) } catch { return null }
}

const PERKS = ['Unlimited audio and video calls', 'Screen sharing', 'Groups and Google Calendar', 'Unlimited file sharing']

export default function GiftProNotice({ darkMode = false }) {
  const { user } = useAuth()
  const end = giftProEnd(user)
  const stamp = end ? end.toISOString() : null
  const [closedFor, setClosedFor] = useState(null)
  const open = Boolean(stamp) && seenFor() !== stamp && closedFor !== stamp

  function close() {
    try { localStorage.setItem(SEEN_KEY, stamp) } catch { /* shown again next visit, harmless */ }
    setClosedFor(stamp)
  }

  if (!open) return null
  const first = (user.display_name || user.full_name || '').split(' ')[0]
  return (
    <Modal isOpen onClose={close} maxWidth="max-w-sm" darkMode={darkMode}>
      <div className="relative overflow-hidden rounded-2xl">
        <div className="bg-linear-to-br from-red-700 via-red-600 to-amber-500 px-6 pb-6 pt-8 text-center text-white">
          <img src="/xmas-assets/gift-pulse.webp" alt="" className="mx-auto w-28 drop-shadow-[0_10px_14px_rgba(0,0,0,0.35)]" />
          <h2 className="mt-3 text-2xl font-extrabold">You've been upgraded{first ? `, ${first}` : ''}!</h2>
          <p className="mt-1 text-sm text-white/90">You have Pulse Pro {giftProText(end)}, free from the Christmas giveaway. Nothing to pay.</p>
        </div>
        <div className={`px-6 py-5 ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-700'}`}>
          <p className="text-sm font-semibold">Everything in Pro is now on:</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-xs text-violet-700" aria-hidden="true">✓</span>{p}
              </li>
            ))}
          </ul>
          <button onClick={close} className="mt-5 w-full rounded-xl bg-violet-600 py-3 text-[15px] font-bold text-white hover:bg-violet-700">
            Start using Pro
          </button>
        </div>
      </div>
    </Modal>
  )
}
