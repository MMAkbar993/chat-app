import { useCallback, useEffect, useState } from 'react'
import adminClient from '../api/adminClient'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const WEBSITE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
]

function WebsitesSection() {
  const [status, setStatus] = useState('all')
  const [websites, setWebsites] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminClient.get('/websites', { params: { status } })
      setWebsites(data.websites)
    } catch {}
    setLoading(false)
  }, [status])

  useEffect(() => { load() }, [load])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-1 px-4 pt-4">
        {WEBSITE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              status === t.key ? 'bg-violet-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : websites.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-10">No websites found</p>
      ) : (
        <div className="divide-y divide-gray-50 mt-3">
          {websites.map((w) => (
            <div key={w.id} className="flex items-center justify-between px-6 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{w.url}</p>
                <p className="text-xs text-gray-400 truncate">{w.owner_name} · {w.owner_email}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${w.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {w.verified ? 'Approved' : 'Pending'}
                </span>
                <p className="text-xs text-gray-400 mt-1">{fmtDate(w.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const REQUEST_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'revoked', label: 'Revoked' },
]

function RepresentationRequestsSection() {
  const [status, setStatus] = useState('pending')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminClient.get('/websites/representation-requests', { params: { status } })
      setRequests(data.requests)
    } catch {}
    setLoading(false)
  }, [status])

  useEffect(() => { load() }, [load])

  async function act(id, action) {
    setActingId(id)
    try {
      await adminClient.post(`/websites/representation-requests/${id}/action`, { action })
      load()
    } catch {}
    setActingId(null)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-1 px-4 pt-4">
        {REQUEST_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              status === t.key ? 'bg-violet-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-10">No requests found</p>
      ) : (
        <div className="divide-y divide-gray-50 mt-3">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-6 py-3 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{r.website_url}</p>
                <p className="text-xs text-gray-400 truncate">
                  {r.requester_name} wants to represent {r.owner_name}'s website
                </p>
                <p className="text-xs text-gray-400">{fmtDate(r.created_at)}</p>
              </div>
              {status === 'pending' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    disabled={actingId === r.id}
                    onClick={() => act(r.id, 'approve')}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    disabled={actingId === r.id}
                    onClick={() => act(r.id, 'reject')}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
              {status === 'approved' && (
                <button
                  disabled={actingId === r.id}
                  onClick={() => act(r.id, 'revoke')}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-colors shrink-0"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminWebsitesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Website Verification</h1>
        <p className="text-sm text-gray-500">Verified websites and representative requests</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Verified Websites</p>
        <WebsitesSection />
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Representative Requests</p>
        <RepresentationRequestsSection />
      </div>
    </div>
  )
}
