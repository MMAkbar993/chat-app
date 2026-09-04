import { useState, useEffect, useCallback } from 'react'
import { getContacts, removeContact } from '../../api/contacts'
import { getOrCreateDirect } from '../../api/conversations'
import { useChat } from '../../context/ChatContext'
import { getRoleLabel } from '../../utils/roleLabels'
import AddContactModal from './AddContactModal'
import UserProfileModal from '../ui/UserProfileModal'
import EditContactModal from './EditContactModal'
import InviteOthersModal from './InviteOthersModal'

export default function ContactsView({ darkMode, onNavigate, onNewCall, mobileHidden }) {
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
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

  // Collapsed to bare alphanumerics on both sides so "Affiliate Roulette" still matches a
  // business stored as the bare domain "affiliateroulette.com" — same rule the Add Contact
  // business search uses.
  const collapse = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase()
    const name = (c.custom_first_name
      ? `${c.custom_first_name} ${c.custom_last_name || ''}`
      : c.display_name || c.full_name || c.username || '').toLowerCase()
    return name.includes(q) ||
      (c.username || '').toLowerCase().includes(q) ||
      (!!collapse(search) && collapse(c.matched_company).includes(collapse(search)))
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
    <div className={`w-full md:w-80 shrink-0 ${mobileHidden ? 'hidden md:flex' : 'flex'} flex-col border-r ${bg}`}>

      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        {/* Mobile: logo left, title centered, action buttons right */}
        <div className="relative flex items-center justify-between md:hidden">
          <img src="/Icon.png" alt="Pulse" className="w-8 h-8 shrink-0" />
          <h2 className={`absolute left-1/2 -translate-x-1/2 text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contacts</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInvite(true)}
              className={`text-sm font-medium underline underline-offset-2 transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Invite
            </button>
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
        {/* Desktop: original title-left, icons-right layout, unchanged */}
        <div className="hidden md:flex items-center justify-between">
          <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contacts</h2>
          <div className="flex items-center gap-2">
            {/* Invite — blocked contacts already live under Settings, no need to duplicate here */}
            <button
              onClick={() => setShowInvite(true)}
              className={`text-sm font-medium underline underline-offset-2 transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Invite
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
            placeholder="Search by name or business"
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
      <div className="flex-1 overflow-y-auto pb-28 md:pb-0">
        <div className="px-4 mb-2">
          <span className={`text-xs font-semibold uppercase tracking-wide ${sub}`}>
            All Contacts{filtered.length ? ` (${filtered.length})` : ''}
          </span>
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
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b ${darkMode ? 'border-gray-800' : 'border-gray-50'} ${rowHov}`}>
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
                    {/* Role and business each get their own line — sharing one line meant the
                        business (the longer, more distinguishing half) was always what got cut. */}
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{name}</p>
                      <p className={`text-xs truncate ${sub}`}>{getRoleLabel(c)}</p>
                      {c.matched_company && (
                        <p className="text-xs truncate font-medium text-violet-600">{c.matched_company}</p>
                      )}
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
        <AddContactModal
          darkMode={darkMode}
          contacts={contacts}
          onClose={() => setShowAdd(false)}
          onAdded={() => { load(); setShowAdd(false) }}
          onMessage={(u) => { handleChat(u); setShowAdd(false) }}
        />
      )}

      {showInvite && (
        <InviteOthersModal darkMode={darkMode} onClose={() => setShowInvite(false)} />
      )}

      {selectedContact && !editContact && (
        <UserProfileModal
          contact={selectedContact}
          isOnline={onlineUsers.has(selectedContact.id)}
          darkMode={darkMode}
          onClose={() => setSelectedContact(null)}
          onChatStart={() => handleChat(selectedContact)}
          onCallStart={(callType) => handleCall(selectedContact, callType)}
          onDeleteContact={handleDelete}
          onEditContact={(c) => { setEditContact(c) }}
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
