import { useState, useEffect } from 'react'
import { getContacts } from '../../api/contacts'
import { createGroup } from '../../api/groups'

export default function CreateGroupModal({ darkMode, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [contacts, setContacts] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getContacts().then((d) => setContacts(d.contacts || [])).catch(() => {})
  }, [])

  function toggle(id) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    try {
      const data = await createGroup(name.trim(), selected)
      onCreated?.(data.group)
      onClose()
    } catch {}
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`w-full max-w-sm rounded-2xl shadow-xl p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Create Group</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className={`w-full rounded-xl px-4 py-2 mb-4 outline-none text-sm ${darkMode ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-gray-100 placeholder-gray-400'}`}
        />
        <p className={`text-xs mb-2 font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add Members</p>
        <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
          {contacts.map((c) => (
            <label key={c.id} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
              <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="accent-violet-600" />
              <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" /> : (c.display_name || c.full_name || '?')[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium">{c.display_name || c.full_name}</span>
            </label>
          ))}
          {contacts.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No contacts to add</p>}
        </div>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2 font-semibold text-sm disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </div>
  )
}
