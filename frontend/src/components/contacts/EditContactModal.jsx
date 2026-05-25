import { useState } from 'react'
import { updateContact } from '../../api/contacts'

export default function EditContactModal({ contact, darkMode, onClose, onUpdated }) {
  const [firstName, setFirstName] = useState(
    contact.custom_first_name || (contact.full_name || '').split(' ')[0] || ''
  )
  const [lastName, setLastName] = useState(
    contact.custom_last_name || (contact.full_name || '').split(' ').slice(1).join(' ') || ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const email = contact.email || contact.profile_email || ''
  const phone = contact.phone || contact.profile_phone || ''

  const cardBg  = darkMode ? 'bg-gray-900 text-white'  : 'bg-white text-gray-900'
  const inputBg = darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  const labelCls = `text-xs font-medium mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`
  const disabledBg = darkMode ? 'bg-gray-800/50 border-gray-700 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-400'

  async function handleSave() {
    if (!firstName.trim()) { setError('First name is required.'); return }
    setSaving(true)
    setError(null)
    try {
      await updateContact(contact.id, firstName.trim(), lastName.trim())
      onUpdated?.({ ...contact, custom_first_name: firstName.trim(), custom_last_name: lastName.trim() })
      onClose()
    } catch {
      setError('Could not update contact. Please try again.')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className={`w-[400px] rounded-2xl shadow-2xl p-6 ${cardBg}`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">Edit Contact</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-xl text-sm bg-red-100 text-red-700">{error}</div>
        )}

        {/* Fields grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>First Name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 ${inputBg}`}
            />
          </div>
          <div>
            <label className={labelCls}>Last Name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 ${inputBg}`}
            />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              value={email}
              readOnly
              className={`w-full rounded-xl border px-3 py-2 text-sm cursor-not-allowed ${disabledBg}`}
            />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input
              value={phone}
              readOnly
              className={`w-full rounded-xl border px-3 py-2 text-sm cursor-not-allowed ${disabledBg}`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Update Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}
