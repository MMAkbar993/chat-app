import { useState } from 'react'
import { sendInvite } from '../../api/contacts'

export default function InviteOthersModal({ darkMode, onClose }) {
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState(
    "Hi! I'd like to invite you to join Connect, a verified chat platform built for the iGaming industry. Once you sign up, we can connect directly and start chatting securely."
  )
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const cardBg  = darkMode ? 'bg-gray-900 text-white'  : 'bg-white text-gray-900'
  const inputBg = darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  const labelCls = `text-sm font-medium mb-1.5 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`

  async function handleSend() {
    if (!recipient.trim()) { setError('Please enter an email address or phone number.'); return }
    setSending(true)
    setError(null)
    try {
      await sendInvite(recipient.trim(), message.trim())
      setSent(true)
    } catch {
      setError('Could not send invitation. Please try again.')
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-[420px] rounded-2xl shadow-2xl p-6 ${cardBg}`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">Invite Others</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold">Invitation Sent!</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Your invitation has been sent to <strong>{recipient}</strong>.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 px-3 py-2 rounded-xl text-sm bg-red-100 text-red-700">{error}</div>
            )}

            <div className="mb-4">
              <label className={labelCls}>Email Address or Phone Number</label>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. friend@email.com or +1 555 000 0000"
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 ${inputBg}`}
              />
            </div>

            <div className="mb-5">
              <label className={labelCls}>Invitation Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 resize-none ${inputBg}`}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Send Invitation'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
