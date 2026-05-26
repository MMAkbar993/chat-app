import { useState, useEffect, useCallback } from 'react'

const ROLE_LABELS = {
  affiliate_publisher:  'Affiliate Publisher',
  casino_operator:      'Casino Operator',
  affiliate_manager:    'Affiliate Manager',
  game_provider:        'Game Provider',
  payment_provider:     'Payment Provider',
  platform_provider:    'Platform Provider',
  media_seo_agency:     'Media / SEO Agency',
  event_organizer:      'Event Organizer',
  influencer_streamer:  'Influencer / Streamer',
  investor_advisor:     'Investor / Advisor',
  compliance_legal:     'Compliance & Legal',
  kyc_aml_provider:     'KYC / AML Provider',
  other:                'Other',
}
import { getContacts, removeContact } from '../../api/contacts'
import { getOrCreateDirect } from '../../api/conversations'
import { useChat } from '../../context/ChatContext'
import AddContactModal from './AddContactModal'
import ContactDetailModal from './ContactDetailModal'
import EditContactModal from './EditContactModal'
import BlockedContactsModal from './BlockedContactsModal'
import InviteOthersModal from './InviteOthersModal'

export default function ContactsView({ darkMode, onNavigate, onNewCall }) {
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showBlocked, setShowBlocked] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [editContact, setEditContact] = useState(null)
  const [toast, setToast] = useState(null)

  const { openConversation, onlineUsers } = useChat()

  const load = useCallback(async () => {
    try {
      const data = await getContacts()
      setContacts(data.contacts || [])
    } catch {}
  }, [])

  useEffect(() => { load() }, [load])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const filtered = contacts.filter((c) => {
    const name = (c.custom_first_name
      ? `${c.custom_first_name} ${c.custom_last_name || ''}`
      : c.display_name || c.full_name || c.username || '').toLowerCase()
    return name.includes(search.toLowerCase()) ||
      (c.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
  })

  const grouped = {}
  filtered.forEach((c) => {
    const key = (c.custom_first_name || c.display_name || c.full_name || c.username || '#')[0].toUpperCase()
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(c)
  })

  async function handleChat(contact) {
    try {
      const data = await getOrCreateDirect(contact.id)
      openConversation(data.conversation)
      setSelectedContact(null)
      onNavigate('chats')
    } catch {}
  }

  function handleCall(contact, callType) {
    setSelectedContact(null)
    onNewCall?.(callType, contact.id, contact.custom_first_name
      ? `${contact.custom_first_name} ${contact.custom_last_name || ''}`.trim()
      : contact.display_name || contact.full_name || contact.username, contact.avatar_url)
  }

  async function handleDelete(contact) {
    try {
      await removeContact(contact.id)
      setContacts((prev) => prev.filter((c) => c.id !== contact.id))
      showToast('Contact removed successfully.')
    } catch {
      showToast('Could not delete contact.', 'error')
    }
  }

  function handleUpdated(updatedContact) {
    setContacts((prev) => prev.map((c) => c.id === updatedContact.id ? { ...c, ...updatedContact } : c))
    if (selectedContact?.id === updatedContact.id) setSelectedContact({ ...selectedContact, ...updatedContact })
    showToast('Contact updated successfully.')
  }

  const bg     = darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
  const sub    = darkMode ? 'text-gray-400' : 'text-gray-500'
  const rowHov = darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'

  return (
    <div className={`w-80 flex flex-col border-r ${bg}`}>

      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contacts</h2>
        <div className="flex items-center gap-1">
          {/* Invite button */}
          <button
            onClick={() => setShowInvite(true)}
            title="Invite Others"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          {/* Blocked contacts button */}
          <button
            onClick={() => setShowBlocked(true)}
            title="Blocked Contacts"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.93 4.93l14.14 14.14" />
            </svg>
          </button>
          {/* Add contact button */}
          <button
            onClick={() => setShowAdd(true)}
            title="Add Contact"
            className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white hover:bg-violet-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className={`bg-transparent flex-1 outline-none text-sm ${darkMode ? 'text-white placeholder-gray-500' : 'placeholder-gray-400'}`}
          />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mx-4 mb-2 px-3 py-2 rounded-xl text-xs font-medium ${toast.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {toast.msg}
        </div>
      )}

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 mb-2">
          <span className={`text-xs font-semibold uppercase tracking-wide ${sub}`}>All Contacts</span>
        </div>

        {filtered.length === 0 ? (
          <p className={`text-sm text-center py-8 ${sub}`}>
            {search ? 'No matches found.' : 'No contacts yet'}
          </p>
        ) : (
          Object.keys(grouped).sort().map((letter) => (
            <div key={letter}>
              <div className={`px-4 py-1 text-xs font-bold ${darkMode ? 'text-gray-400 bg-gray-800' : 'text-gray-500 bg-gray-50'}`}>{letter}</div>
              {grouped[letter].map((c) => {
                const name = c.custom_first_name
                  ? `${c.custom_first_name} ${c.custom_last_name || ''}`.trim()
                  : c.display_name || c.full_name || '?'
                const isOnline = onlineUsers.has(c.id)
                return (
                  <button key={c.id} onClick={() => setSelectedContact(c)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${rowHov}`}>
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden">
                        {c.avatar_url
                          ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">{name[0].toUpperCase()}</div>}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{name}</p>
                      <p className={`text-xs ${sub}`}>{ROLE_LABELS[c.primary_role] || c.primary_role || c.username}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddContactModal darkMode={darkMode} onClose={() => setShowAdd(false)} onAdded={() => { load(); setShowAdd(false) }} />
      )}

      {showBlocked && (
        <BlockedContactsModal darkMode={darkMode} onClose={() => setShowBlocked(false)} />
      )}

      {showInvite && (
        <InviteOthersModal darkMode={darkMode} onClose={() => setShowInvite(false)} />
      )}

      {selectedContact && !editContact && (
        <ContactDetailModal
          contact={selectedContact}
          darkMode={darkMode}
          onClose={() => setSelectedContact(null)}
          onChat={() => handleChat(selectedContact)}
          onCall={(callType) => handleCall(selectedContact, callType)}
          onDelete={handleDelete}
          onEdit={(c) => { setEditContact(c) }}
          onBlockToggle={(c, isBlocked) => showToast(isBlocked ? `${c.display_name || c.full_name} blocked.` : `${c.display_name || c.full_name} unblocked.`)}
        />
      )}

      {editContact && (
        <EditContactModal
          contact={editContact}
          darkMode={darkMode}
          onClose={() => setEditContact(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
