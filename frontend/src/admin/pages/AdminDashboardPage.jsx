import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import adminClient from '../api/adminClient'

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function Avatar({ name, url, size = 8 }) {
  const initials = name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?'
  if (url) return <img src={url} alt="" className={`w-${size} h-${size} rounded-full object-cover`} />
  return (
    <div className={`w-${size} h-${size} rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminClient.get('/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { stats, recentUsers, recentGroups } = data || {}

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={stats?.users}
          color="bg-violet-100"
          icon={
            <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Groups"
          value={stats?.groups}
          color="bg-blue-100"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM3 17v-2a4 4 0 014-4h4" />
            </svg>
          }
        />
        <StatCard
          label="Total Chats"
          value={stats?.chats}
          color="bg-green-100"
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          }
        />
        <StatCard
          label="Total Calls"
          value={stats?.calls}
          color="bg-orange-100"
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          }
        />
      </div>

      {/* Recent rows */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Members</h2>
            <Link to="/admin/users" className="text-violet-600 text-sm font-medium hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers?.length ? recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-6 py-3">
                <Avatar name={u.full_name} url={u.avatar_url} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">{fmtDate(u.created_at)}</p>
                  <p className="text-xs text-gray-400">{u.country}</p>
                </div>
              </div>
            )) : (
              <p className="px-6 py-8 text-center text-gray-400 text-sm">No members yet</p>
            )}
          </div>
        </div>

        {/* Recent groups */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Groups</h2>
            <Link to="/admin/groups" className="text-violet-600 text-sm font-medium hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentGroups?.length ? recentGroups.map((g) => (
              <div key={g.id} className="flex items-center gap-3 px-6 py-3">
                <Avatar name={g.name} url={g.avatar_url} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{g.name || 'Unnamed group'}</p>
                  <p className="text-xs text-gray-400 truncate">Owner: {g.owner_name || '—'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">{fmtDate(g.created_at)}</p>
                  <p className="text-xs text-gray-400">{g.member_count} members</p>
                </div>
              </div>
            )) : (
              <p className="px-6 py-8 text-center text-gray-400 text-sm">No groups yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
