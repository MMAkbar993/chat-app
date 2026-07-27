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

export default function AdminToolsPage() {
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Tools</h1>
        <p className="text-sm text-gray-500">Broadcast in-app notifications to your users</p>
      </div>

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
