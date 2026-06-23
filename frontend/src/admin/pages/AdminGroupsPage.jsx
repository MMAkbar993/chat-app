import { useEffect, useState, useCallback } from 'react'
import adminClient from '../api/adminClient'

function Avatar({ name, url }) {
  const initials = name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?'
  if (url) return <img src={url} alt="" className="w-9 h-9 rounded-full object-cover" />
  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  )
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminClient.get('/groups', { params: { search, page, limit: LIMIT } })
      setGroups(data.groups)
      setTotal(data.total)
    } catch {}
    setLoading(false)
  }, [search, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search])

  const pages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
        <p className="text-sm text-gray-500">{total} total groups</p>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM3 17v-2a4 4 0 014-4h4" />
            </svg>
            <p className="text-sm">No groups found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Group</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Owner</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden lg:table-cell">Members</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden xl:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {groups.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={g.name} url={g.avatar_url} />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{g.name || 'Unnamed group'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 hidden md:table-cell">
                      <div>
                        <p className="text-gray-700 truncate">{g.owner_name || '—'}</p>
                        {g.owner_email && <p className="text-xs text-gray-400 truncate">{g.owner_email}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-500 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {g.member_count} members
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500 hidden xl:table-cell">{fmtDate(g.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page {page} of {pages} · {total} groups
            </p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                Previous
              </button>
              <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
