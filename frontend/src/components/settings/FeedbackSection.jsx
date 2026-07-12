import { useState } from 'react'
import { submitFeedback } from '../../api/users'

const TYPES = [
  { key: 'bug', label: 'Report a Bug' },
  { key: 'feature', label: 'Feature Request' },
  { key: 'other', label: 'Other' },
]

export default function FeedbackSection({ darkMode, onToast }) {
  const [type, setType] = useState('bug')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const inp = `w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${
    darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
  } focus:ring-2 focus:ring-violet-400`

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!message.trim()) {
      setError('Please describe the issue or request before sending.')
      return
    }
    setSaving(true)
    try {
      await submitFeedback({ type, message: message.trim() })
      setMessage('')
      onToast?.('Thanks — your message has been sent to our team.')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send. Please try again.')
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className={`text-xs mb-1 ${sub}`}>
        Found a bug or have an idea to make Pulse better? Send it directly to our team.
      </p>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div>
        <label className={`text-xs mb-1 block ${sub}`}>Type</label>
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                type === t.key
                  ? 'bg-violet-600 text-white'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={`text-xs mb-1 block ${sub}`}>Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the issue or feature you'd like to see..."
          rows={6}
          maxLength={5000}
          className={`${inp} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
      >
        {saving ? 'Sending…' : 'Send to Support'}
      </button>
    </form>
  )
}
