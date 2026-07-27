import { useEffect, useState } from 'react'
import adminClient from '../api/adminClient'

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className={`text-sm mt-1 ${color}`}>{label}</p>
    </div>
  )
}

export default function AdminBillingPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminClient.get('/billing/overview')
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500">Plan counts and revenue overview</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Active Subscriptions</p>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Free" value={data?.free} color="text-gray-500" />
          <StatCard label="Pro" value={data?.pro} color="text-violet-600" />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Total Sales</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Today" value={data?.sales ? `$${data.sales.today.toFixed(2)}` : undefined} color="text-green-600" />
          <StatCard label="This Week" value={data?.sales ? `$${data.sales.thisWeek.toFixed(2)}` : undefined} color="text-green-600" />
          <StatCard label="This Month" value={data?.sales ? `$${data.sales.thisMonth.toFixed(2)}` : undefined} color="text-green-600" />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Tracked from when this dashboard shipped — historical revenue before that isn't backfilled.
        </p>
      </div>
    </div>
  )
}
