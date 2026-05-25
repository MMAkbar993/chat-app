import { useState } from 'react'
import { changePassword } from '../../api/users'

function EyeIcon({ open }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

export default function PasswordSection({ darkMode }) {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [show, setShow] = useState({ old: false, new: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const inp = `w-full rounded-xl px-4 py-2.5 text-sm outline-none border pr-10 ${
    darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
  } focus:ring-2 focus:ring-violet-400`
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match.')
      return
    }
    setSaving(true)
    try {
      await changePassword({ old_password: form.old_password, new_password: form.new_password })
      setSuccess('Password updated successfully.')
      setForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password.')
    }
    setSaving(false)
  }

  function PasswordField({ id, label, value, showKey }) {
    return (
      <div>
        <label className={`text-xs mb-1 block ${sub}`}>{label}</label>
        <div className="relative">
          <input
            type={show[showKey] ? 'text' : 'password'}
            value={value}
            onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
            placeholder={label}
            className={inp}
          />
          <button
            type="button"
            onClick={() => setShow((s) => ({ ...s, [showKey]: !s[showKey] }))}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${sub}`}
          >
            <EyeIcon open={show[showKey]} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600">{success}</p>}

      <PasswordField id="old_password"     label="Old Password"      value={form.old_password}     showKey="old" />
      <PasswordField id="new_password"     label="New Password"      value={form.new_password}     showKey="new" />
      <PasswordField id="confirm_password" label="Confirm Password"  value={form.confirm_password} showKey="confirm" />

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
