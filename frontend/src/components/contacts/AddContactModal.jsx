import { useEffect, useMemo, useState } from 'react'
import { searchUsers, addContact } from '../../api/contacts'
import { useAuth } from '../../context/AuthContext'
import { isProUser } from '../../utils/plan'
import { getRoleLabel } from '../../utils/roleLabels'
import UpgradeModal from '../../features/payment/UpgradeModal'
import InviteOthersModal from './InviteOthersModal'
import BusinessCard from '../business/BusinessCard'

function useDebouncedSearch(query, mode, enabled) {
  const [results, setResults] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const trimmed = query.trim().replace(/^@/, '')
    if (!enabled || trimmed.length < 3) { setResults([]); setBusinesses([]); setLoading(false); return }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const data = await searchUsers(query, mode)
        setResults(data.users || [])
        setBusinesses(data.businesses || [])
      } catch {
        setResults([])
        setBusinesses([])
      }
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query, mode, enabled])

  return { results, businesses, loading, active: enabled && query.trim().replace(/^@/, '').length >= 3 }
}

export default function AddContactModal({ darkMode, onClose, onAdded, onMessage, contacts = [] }) {
  const { user } = useAuth()
  const pro = isProUser(user)
  const contactIds = useMemo(() => new Set(contacts.map((c) => c.id)), [contacts])
  const [usernameQuery, setUsernameQuery] = useState('')
  const [businessQuery, setBusinessQuery] = useState('')
  const [adding, setAdding] = useState(null)
  const [added, setAdded] = useState({})
  const [toast, setToast] = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const byUsername = useDebouncedSearch(usernameQuery, 'username', true)
  const byBusiness = useDebouncedSearch(businessQuery, 'business', pro)

  // A company that has a business profile is shown as that profile, where the searcher picks who
  // to talk to. Only when no profile matches do the individual people from it get listed.
  const businesses = byBusiness.active ? byBusiness.businesses : []
  const results = useMemo(() => {
    const map = new Map()
    const fromBusiness = businesses.length > 0 ? [] : byBusiness.results
    for (const u of [...byUsername.results, ...fromBusiness]) map.set(u.id, u)
    return [...map.values()]
  }, [byUsername.results, byBusiness.results, businesses.length])

  const loading = byUsername.loading || byBusiness.loading
  const searched = byUsername.active || byBusiness.active
  const activeQueryLabel = byBusiness.active ? businessQuery.trim() : usernameQuery.trim()

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function handleBusinessFocus(e) {
    if (!pro) { e.target.blur(); setShowUpgrade(true) }
  }

  async function handleAdd(u) {
    setAdding(u.id)
    try {
      await addContact(u.id)
      setAdded((prev) => ({ ...prev, [u.id]: true }))
      showToast(`${u.display_name || u.full_name} added successfully.`)
      onAdded?.()
    } catch (err) {
      const msg = err?.response?.data?.error || ''
      if (msg.includes('already')) {
        showToast('This contact is already in your list.', 'error')
      } else if (msg.includes('yourself')) {
        showToast('You cannot add yourself as a contact.', 'error')
      } else {
        showToast('Could not add contact. Please try again.', 'error')
      }
    }
    setAdding(null)
  }

  const cardBg   = darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
  const inputBg  = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
  const sub      = darkMode ? 'text-gray-400' : 'text-gray-500'
  const label    = `text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`
  const rule     = darkMode ? 'border-gray-700' : 'border-gray-200'
  const rowHover = darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`w-full max-w-md rounded-2xl shadow-xl p-6 ${cardBg}`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Add Contact</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mb-3 px-3 py-2 rounded-xl text-sm font-medium ${
            toast.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Search by Username */}
        <p className={label}>Search by Username</p>
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 mb-1 border ${inputBg}`}>
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={usernameQuery}
            onChange={(e) => setUsernameQuery(e.target.value)}
            placeholder="Enter exact username"
            className={`flex-1 bg-transparent outline-none text-sm ${darkMode ? 'text-white placeholder-gray-500' : 'placeholder-gray-400'}`}
            autoFocus
          />
        </div>
        <p className={`text-xs mb-4 px-1 ${sub}`}>Enter someone's exact username to find them.</p>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex-1 border-t ${rule}`} />
          <span className={`text-xs font-semibold ${sub}`}>OR</span>
          <div className={`flex-1 border-t ${rule}`} />
        </div>

        {/* Search by Business Name — a free user gets a normal-looking enabled input with only
            a small star icon marking it as gated, easy to miss until they've already typed and
            wondered why nothing happens. A visible "PRO" chip on the label and a dimmed,
            lock-iconed input make the gate obvious before they try, not after. */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <p className={`${label} mb-0`}>Search by Business Name</p>
          {!pro && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" />
              </svg>
              Pro
            </span>
          )}
        </div>
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 mb-1 border ${inputBg} ${!pro ? 'cursor-pointer opacity-60' : ''}`}>
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={businessQuery}
            onChange={(e) => setBusinessQuery(e.target.value)}
            onFocus={handleBusinessFocus}
            readOnly={!pro}
            placeholder="Enter a business or company name"
            className={`flex-1 bg-transparent outline-none text-sm ${!pro ? 'cursor-pointer' : ''} ${darkMode ? 'text-white placeholder-gray-500' : 'placeholder-gray-400'}`}
          />
          {!pro && (
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </div>
        <p className={`text-xs mb-4 px-1 ${sub}`}>
          {pro ? 'Enter a business or company name to find people from that organization.' : 'This is a Pro feature — tap to upgrade and search by business or company name.'}
        </p>

        {/* Results */}
        {loading && <p className="text-center text-gray-400 text-sm py-4">Searching…</p>}
        {!loading && businesses.length > 0 && (
          <div className="mb-3">
            <p className={`text-xs font-bold uppercase tracking-wide mb-2 px-1 ${sub}`}>
              {businesses.length} {businesses.length === 1 ? 'business' : 'businesses'} found for "{businessQuery.trim()}"
            </p>
            <div className="space-y-2">
              {businesses.map((b) => (
                <BusinessCard key={b.id} business={b} darkMode={darkMode} />
              ))}
            </div>
          </div>
        )}
        {!loading && results.length > 0 && (
          <p className={`text-xs font-bold uppercase tracking-wide mb-2 px-1 ${sub}`}>
            {results.length} {results.length === 1 ? 'result' : 'results'} found{activeQueryLabel ? ` for "${activeQueryLabel}"` : ''}
          </p>
        )}
        <div className="space-y-1 max-h-60 overflow-y-auto -mx-1">
          {results.map((u) => (
            <div key={u.id} className={`flex items-center gap-3 px-1 py-2 rounded-xl transition-colors ${rowHover}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0 ${u.avatar_url ? '' : 'bg-violet-500'}`}>
                {u.avatar_url
                  ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  : (u.full_name || u.username || '?')[0].toUpperCase()}
              </div>
              {/* What they do comes before where they work. Searching a company returns a list
                  of people from it, and the job title is the thing that tells you which of
                  them is worth messaging. */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{u.display_name || u.full_name}</p>
                <p className={`text-xs truncate ${sub}`}>{u.job_title || getRoleLabel(u)}</p>
                {u.matched_company && (
                  <p className={`text-xs truncate ${sub}`}>{u.matched_company}</p>
                )}
              </div>
              {contactIds.has(u.id) || added[u.id] ? (
                <button
                  onClick={() => onMessage?.(u)}
                  className="text-xs font-semibold text-violet-600 border border-violet-300 rounded-full px-4 py-1.5 hover:bg-violet-50 transition-colors shrink-0"
                >
                  Message
                </button>
              ) : (
                <button
                  onClick={() => handleAdd(u)}
                  disabled={adding === u.id}
                  className="text-xs font-semibold text-violet-600 border border-violet-300 rounded-full px-4 py-1.5 hover:bg-violet-50 transition-colors disabled:opacity-50 shrink-0"
                >
                  {adding === u.id ? '…' : 'Add'}
                </button>
              )}
            </div>
          ))}
          {!loading && searched && results.length === 0 && businesses.length === 0 && (
            <p className={`text-center text-sm py-4 ${sub}`}>No users found</p>
          )}
        </div>

        {/* Invite footer */}
        <div className={`mt-4 pt-4 border-t text-center ${rule}`}>
          <p className={`text-xs ${sub}`}>Can't find the person you're looking for?</p>
          <button onClick={() => setShowInvite(true)} className="text-xs font-semibold text-violet-600 hover:underline">
            Invite by email
          </button>
        </div>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
      {showInvite && <InviteOthersModal darkMode={darkMode} onClose={() => setShowInvite(false)} />}
    </div>
  )
}
