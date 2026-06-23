import { useEffect, useState, useCallback } from 'react'
import adminClient from '../api/adminClient'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminClient.get('/conversations', { params: { page, limit: LIMIT } })
      setConversations(data.conversations)
      setTotal(data.total)
    } catch {}
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  const pages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chat Overview</h1>
        <p className="text-sm text-gray-500">{total} total conversations</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Participants</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden lg:table-cell">Messages</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden xl:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {conversations.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.type === 'group'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{c.name || <span className="text-gray-400 italic">Direct</span>}</td>
                    <td className="px-6 py-3 text-gray-500 hidden md:table-cell">{c.member_count}</td>
                    <td className="px-6 py-3 text-gray-500 hidden lg:table-cell">{c.message_count}</td>
                    <td className="px-6 py-3 text-gray-500 hidden xl:table-cell">{fmtDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {page} of {pages} · {total} conversations</p>
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
