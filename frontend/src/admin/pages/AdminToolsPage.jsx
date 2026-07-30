import { useCallback, useEffect, useState } from 'react'
import adminClient from '../api/adminClient'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const AUDIENCES = [
  { key: 'all', label: 'All Users' },
  { key: 'pro', label: 'Pro Users' },
  { key: 'free', label: 'Free Users' },
]

const EMAIL_LABELS = {
  password_reset_otp: 'Password Reset Code',
  feedback_notification: 'Feedback Notification',
  welcome: 'Welcome / Registration Success',
  unread_message: 'Unread Message (24h)',
  two_factor_enabled: '2FA Enabled',
  password_changed: 'Password Changed',
  email_changed: 'Email Changed',
  website_verified: 'Website Verified',
  admin_new_signup: 'Admin: New Signup',
}

const EMAIL_PLACEHOLDERS = {
  password_reset_otp: ['otp'],
  feedback_notification: ['label', 'username', 'userEmail', 'message'],
  welcome: ['appName', 'name'],
  unread_message: ['appName', 'name', 'senderName'],
  two_factor_enabled: ['appName'],
  password_changed: ['appName'],
  email_changed: ['appName', 'newEmail'],
  website_verified: ['appName', 'url'],
  admin_new_signup: ['appName', 'username', 'email', 'fullName'],
}

function BroadcastsSection() {
  const [audience, setAudience] = useState('all')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const { data } = await adminClient.get('/broadcasts')
      setHistory(data.broadcasts)
    } catch {}
    setLoadingHistory(false)
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  async function send(e) {
    e.preventDefault()
    setError('')
    setResult('')
    setSending(true)
    try {
      const { data } = await adminClient.post('/broadcasts', { audience, title, body })
      setResult(`Sent to ${data.recipientCount} user${data.recipientCount === 1 ? '' : 's'}.`)
      setTitle('')
      setBody('')
      loadHistory()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send broadcast')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={send} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}
          {result && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">{result}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Audience</label>
            <div className="flex gap-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setAudience(a.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    audience === a.key ? 'bg-violet-600 text-white' : 'text-gray-500 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="e.g. New feature: Groups"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
            <textarea
              value={body} onChange={(e) => setBody(e.target.value)} required rows={3}
              placeholder="What do you want to tell them?"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
          </div>

          <button type="submit" disabled={sending}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors flex items-center gap-2">
            {sending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Send Broadcast
          </button>
        </form>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Platform Announcements</p>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">No broadcasts sent yet</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {history.map((b) => (
                <div key={b.broadcast_id} className="px-6 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-800">{b.title}</p>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 shrink-0 capitalize">
                      {b.audience}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{b.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {fmtDate(b.created_at)} · {b.recipient_count} recipient{b.recipient_count === 1 ? '' : 's'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SystemEmailRow({ email, onSaved }) {
  const [enabled, setEnabled] = useState(email.enabled)
  const [subject, setSubject] = useState(email.subject)
  const [bodyHtml, setBodyHtml] = useState(email.body_html)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const dirty = enabled !== email.enabled || subject !== email.subject || bodyHtml !== email.body_html

  async function toggleEnabled() {
    const next = !enabled
    setEnabled(next)
    try {
      const { data } = await adminClient.patch(`/system-emails/${email.email_key}`, { enabled: next })
      onSaved(data.email)
    } catch {
      setEnabled(!next)
    }
  }

  async function save() {
    setSaving(true)
    setSavedMsg('')
    try {
      const { data } = await adminClient.patch(`/system-emails/${email.email_key}`, { subject, body_html: bodyHtml })
      onSaved(data.email)
      setSavedMsg('Saved.')
      setTimeout(() => setSavedMsg(''), 2000)
    } catch {
      setSavedMsg('Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{EMAIL_LABELS[email.email_key] || email.email_key}</p>
          <p className="text-xs text-gray-400">
            Placeholders: {(EMAIL_PLACEHOLDERS[email.email_key] || []).map((p) => `{{${p}}}`).join(', ')}
          </p>
        </div>
        <button
          onClick={toggleEnabled}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${enabled ? 'bg-violet-600' : 'bg-gray-200'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
        <input
          value={subject} onChange={(e) => setSubject(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Body (HTML)</label>
        <textarea
          value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} rows={6}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-400 resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {savedMsg && <span className="text-xs text-gray-500">{savedMsg}</span>}
      </div>
    </div>
  )
}

function SystemEmailsSection() {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminClient.get('/system-emails')
      setEmails(data.emails)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function handleSaved(updated) {
    setEmails((prev) => prev.map((e) => (e.email_key === updated.email_key ? updated : e)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-7 h-7 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <SystemEmailRow key={email.email_key} email={email} onSaved={handleSaved} />
      ))}
    </div>
  )
}

const TABS = [
  { key: 'broadcasts', label: 'Broadcasts' },
  { key: 'emails', label: 'System Emails' },
]

export default function AdminToolsPage() {
  const [tab, setTab] = useState('broadcasts')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Tools</h1>
        <p className="text-sm text-gray-500">Broadcast notifications and configure automatic emails</p>
      </div>

      <div className="flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-violet-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'broadcasts' ? <BroadcastsSection /> : <SystemEmailsSection />}
    </div>
  )
}
