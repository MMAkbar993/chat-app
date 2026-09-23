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
  // Support needs a way to move a site to another account: companies lose the person who
  // verified the domain, and admin rights otherwise only come from proving control of it.
  const [reassigning, setReassigning] = useState(null)
  const [newOwnerId, setNewOwnerId] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminClient.get('/websites', { params: { status } })
      setWebsites(data.websites)
    } catch {}
    setLoading(false)
  }, [status])

  useEffect(() => { load() }, [load])

  async function handleReassign() {
    setBusy(true)
    setNote('')
    try {
      await adminClient.post(`/websites/${reassigning.id}/reassign`, { newOwnerId: newOwnerId.trim() })
      setReassigning(null)
      setNewOwnerId('')
      await load()
    } catch (err) {
      setNote(err.response?.data?.error || 'Could not reassign that website.')
    }
    setBusy(false)
  }

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
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${w.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {w.verified ? 'Approved' : 'Pending'}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{fmtDate(w.created_at)}</p>
                </div>
                <button
                  onClick={() => { setReassigning(w); setNewOwnerId(''); setNote('') }}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-800 whitespace-nowrap"
                >
                  Change admin
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {reassigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReassigning(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-gray-900">Change website admin</p>
            <p className="text-sm text-gray-500 mt-1">
              Moves <span className="font-medium">{reassigning.url}</span> and its business profile to another
              account. Representatives of the domain follow, and the current admin loses it.
            </p>
            <label className="block text-xs font-medium text-gray-500 mt-4 mb-1">New admin's user ID</label>
            <input
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              placeholder="Paste the user ID from the Users page"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-400"
            />
            {note && <p className="text-xs text-red-500 mt-2">{note}</p>}
            <div className="mt-5 flex gap-2 justify-end">
              <button
                onClick={() => setReassigning(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                disabled={busy || !newOwnerId.trim()}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {busy ? 'Moving…' : 'Change admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BusinessesSection() {
  const [businesses, setBusinesses] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminClient.get('/businesses', { params: { search } })
      setBusinesses(data.businesses)
    } catch {}
    setLoading(false)
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  async function handleDelete() {
    setBusy(true)
    try {
      await adminClient.delete(`/businesses/${confirming.id}`)
      setConfirming(null)
      await load()
    } catch {}
    setBusy(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 pt-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by business name or domain"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : businesses.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-10">No business profiles found</p>
      ) : (
        <div className="divide-y divide-gray-50 mt-3">
          {businesses.map((b) => (
            <div key={b.id} className="flex items-center gap-3 px-6 py-3">
              <span className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-gray-100 text-gray-700 text-sm font-bold">
                {b.logo_url ? <img src={b.logo_url} alt="" className="w-full h-full object-cover" /> : (b.name || '?')[0].toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{b.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {b.domain} · /b/{b.slug} · admin: {b.owner_display_name || b.owner_full_name || b.owner_username}
                  {' · '}{b.representative_count} rep{Number(b.representative_count) === 1 ? '' : 's'}
                </p>
              </div>
              <a
                href={`/b/${b.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 shrink-0"
              >
                View
              </a>
              <button
                onClick={() => setConfirming(b)}
                className="text-xs font-semibold text-red-500 hover:text-red-700 shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirming(null)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-gray-900">Delete this business profile?</p>
            <p className="text-sm text-gray-500 mt-1.5">
              <span className="font-medium">{confirming.name}</span> ({confirming.domain}) will be removed and its
              share link will stop working. The website stays verified and the admin can create a new profile.
            </p>
            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={() => setConfirming(null)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
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
        <p className="text-sm font-semibold text-gray-700 mb-3">Business Profiles</p>
        <BusinessesSection />
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Representatives</p>
        <RepresentationRequestsSection />
      </div>
    </div>
  )
}
