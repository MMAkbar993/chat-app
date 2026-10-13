import { useEffect, useState, useCallback } from 'react'
import adminClient from '../api/adminClient'
import { useToast } from '../../context/ToastContext'
import { apiErrorMessage } from '../../utils/apiError'

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia',
  'Austria','Azerbaijan','Bahrain','Bangladesh','Belarus','Belgium','Bolivia','Bosnia',
  'Brazil','Bulgaria','Cambodia','Canada','Chile','China','Colombia','Croatia','Cuba',
  'Cyprus','Czech Republic','Denmark','Ecuador','Egypt','Estonia','Ethiopia','Finland',
  'France','Georgia','Germany','Ghana','Greece','Guatemala','Honduras','Hungary','India',
  'Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan',
  'Kazakhstan','Kenya','Kuwait','Latvia','Lebanon','Libya','Lithuania','Luxembourg',
  'Malaysia','Mexico','Moldova','Morocco','Myanmar','Nepal','Netherlands','New Zealand',
  'Nigeria','North Korea','Norway','Oman','Pakistan','Panama','Peru','Philippines','Poland',
  'Portugal','Qatar','Romania','Russia','Saudi Arabia','Serbia','Singapore','Slovakia',
  'Slovenia','Somalia','South Africa','South Korea','Spain','Sri Lanka','Sudan','Sweden',
  'Switzerland','Syria','Taiwan','Thailand','Tunisia','Turkey','UAE','Uganda','UK',
  'Ukraine','USA','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zimbabwe','Other',
]

function Avatar({ name, url }) {
  const initials = name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?'
  if (url) return <img src={url} alt="" className="w-9 h-9 rounded-full object-cover" />
  return (
    <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  )
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Badge({ blocked, kycStatus }) {
  const { label, color } = blocked
    ? { label: 'Blocked', color: 'red' }
    : kycStatus === 'verified'
      ? { label: 'Active', color: 'green' }
      : kycStatus === 'failed'
        ? { label: 'Failed KYC', color: 'red' }
        : kycStatus === 'review'
          ? { label: 'Needs review', color: 'violet' }
          : { label: 'KYC Pending', color: 'amber' }
  const colors = {
    red:   'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    violet: 'bg-violet-100 text-violet-700',
  }
  const dots = {
    red:   'bg-red-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[color]}`} />
      {label}
    </span>
  )
}

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || '',
    password: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isEdit = !!user

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        const { data } = await adminClient.put(`/users/${user.id}`, {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          country: form.country,
        })
        onSave(data.user)
      } else {
        const { data } = await adminClient.post('/users', form)
        onSave(data.user)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? 'Edit Member' : 'Add New Member'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
            <input
              value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required
              placeholder="John Doe"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
            <input
              type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required
              placeholder="john@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input
              value={form.phone} onChange={(e) => set('phone', e.target.value)}
              placeholder="+1 234 567 8900"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country *</label>
            <select
              value={form.country} onChange={(e) => set('country', e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
            >
              <option value="">Select country...</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password <span className="text-gray-400">(default: Welcome@123)</span>
              </label>
              <input
                type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
                placeholder="Leave blank for default"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function isProPlan(plan, status) {
  return ['monthly', 'yearly'].includes(plan) && ['active', 'past_due'].includes(status)
}

const KYC_LABELS = {
  verified: 'Verified',
  review: 'Needs manual review',
  pending: 'Not completed',
  failed: 'Failed',
}

// Manual decisions on a member's identity check. The legal name typed here becomes their
// verified name — the only source their display name can be taken from — so it must match the
// ID exactly. The server tidies an all-capitals name.
function KycPanel({ detail, onChanged }) {
  const status = detail.kyc_status || 'pending'
  const [name, setName] = useState(detail.full_name || '')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)

  async function run(action) {
    setError('')
    setBusy(action)
    try {
      const body = action === 'approve' || action === 'rename' ? { action, legal_name: name } : { action }
      const { data } = await adminClient.post(`/users/${detail.id}/kyc`, body)
      setName(data.user.full_name || '')
      onChanged(data.user)
    } catch (err) {
      setError(err.response?.data?.error || 'That did not work. Try again.')
    } finally {
      setBusy(null)
      setConfirmAction(null)
    }
  }

  const btn = 'text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-40'
  const needsName = status === 'review' || status === 'verified'

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${status === 'review' ? 'border-violet-200 bg-violet-50/50' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-gray-800">Identity check</p>
        <Badge blocked={false} kycStatus={status} />
      </div>

      {status === 'review' && (
        <p className="text-xs text-gray-600">
          Didit approved this ID but did not return a name. Open the session in the Didit dashboard,
          check the document, and enter the legal name exactly as it appears on it.
          {detail.kyc_session_id && <> Session ID: <span className="font-mono">{detail.kyc_session_id}</span></>}
        </p>
      )}
      {status === 'verified' && (
        <p className="text-xs text-gray-600">
          Shown on Pulse as <span className="font-semibold">{detail.display_name || detail.full_name}</span>.
          Correct the legal name only if it does not match the ID.
        </p>
      )}
      {status === 'failed' && (
        <p className="text-xs text-gray-600">The check failed. Let the member try again, or approve them by hand after checking their ID.</p>
      )}
      {status === 'pending' && (
        <p className="text-xs text-gray-600">The member has not finished the identity check yet.</p>
      )}

      {(needsName || status === 'failed') && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Legal name (as on the ID)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
          />
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {status !== 'verified' && (
          <button disabled={!!busy || !name.trim()} onClick={() => setConfirmAction('approve')}
            className={`${btn} bg-green-600 hover:bg-green-700 text-white`}>
            {busy === 'approve' ? 'Approving…' : 'Approve with this name'}
          </button>
        )}
        {status === 'verified' && (
          <button disabled={!!busy || !name.trim() || name.trim() === detail.full_name} onClick={() => setConfirmAction('rename')}
            className={`${btn} bg-violet-600 hover:bg-violet-700 text-white`}>
            {busy === 'rename' ? 'Saving…' : 'Save corrected name'}
          </button>
        )}
        {(status === 'review' || status === 'pending') && (
          <button disabled={!!busy} onClick={() => setConfirmAction('reject')}
            className={`${btn} border border-red-200 text-red-600 hover:bg-red-50`}>
            Reject
          </button>
        )}
        {status !== 'pending' && (
          <button disabled={!!busy} onClick={() => setConfirmAction('retry')}
            className={`${btn} border border-gray-200 text-gray-600 hover:bg-gray-50`}>
            Let them retry the ID check
          </button>
        )}
      </div>

      {confirmAction && (
        <div className="rounded-lg bg-white border border-gray-200 p-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-700">
            {{
              approve: `Approve this member as "${name.trim()}"? They get access and a welcome email.`,
              rename: `Change their legal name to "${name.trim()}"? Their display name updates to match.`,
              reject: 'Mark this identity check as failed? They will not be able to use Pulse.',
              retry: 'Clear this check so the member goes through the ID check again? They lose access until they pass.',
            }[confirmAction]}
          </p>
          <span className="flex gap-2">
            <button onClick={() => setConfirmAction(null)} className={`${btn} border border-gray-200 text-gray-600 hover:bg-gray-50`}>Cancel</button>
            <button onClick={() => run(confirmAction)} className={`${btn} bg-gray-900 hover:bg-gray-800 text-white`}>Confirm</button>
          </span>
        </div>
      )}
    </div>
  )
}

function UserDetailModal({ userId, onClose, onSaved }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [packageSaving, setPackageSaving] = useState(false)

  useEffect(() => {
    adminClient.get(`/users/${userId}`)
      .then(({ data }) => {
        setDetail(data.user)
        setForm({
          full_name: data.user.full_name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          country: data.user.country || '',
        })
      })
      .catch(() => setError('Could not load user'))
      .finally(() => setLoading(false))
  }, [userId])

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function saveProfile(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await adminClient.put(`/users/${userId}`, form)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function changePackage(plan) {
    setPackageSaving(true)
    try {
      const { data } = await adminClient.patch(`/users/${userId}/package`, { plan })
      setDetail((d) => ({ ...d, subscription_plan: data.user.subscription_plan, subscription_status: data.user.subscription_status }))
    } catch {
      setError('Could not change package')
    } finally {
      setPackageSaving(false)
    }
  }

  const isPro = detail && isProPlan(detail.subscription_plan, detail.subscription_status)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-800">Member Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading || !detail ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
            )}

            {/* Read-only summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Verification</p>
                <p className="text-sm font-semibold text-gray-800">{KYC_LABELS[detail.kyc_status] || KYC_LABELS.pending}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Last Active</p>
                <p className="text-sm font-semibold text-gray-800">{fmtDate(detail.last_seen_at)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Login Count</p>
                <p className="text-sm font-semibold text-gray-800">{detail.login_count ?? 0}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Joined</p>
                <p className="text-sm font-semibold text-gray-800">{fmtDate(detail.created_at)}</p>
              </div>
            </div>

            <KycPanel
              key={`${detail.kyc_status}-${detail.full_name}`}
              detail={detail}
              onChanged={(u) => {
                setDetail((d) => ({ ...d, ...u }))
                setForm((f) => ({ ...f, full_name: u.full_name || '' }))
                onSaved({ keepOpen: true })
              }}
            />

            {/* Package */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Package</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isPro ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>
                  {isPro ? 'Pro' : 'Free'}
                </span>
                <button
                  disabled={packageSaving || isPro}
                  onClick={() => changePackage('pro')}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white transition-colors"
                >
                  Set Pro
                </button>
                <button
                  disabled={packageSaving || !isPro}
                  onClick={() => changePackage('free')}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-gray-600 transition-colors"
                >
                  Set Free
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Local override — does not create or change a real Stripe subscription.</p>
            </div>

            {/* Editable profile */}
            <form onSubmit={saveProfile} className="space-y-3">
              <p className="text-sm font-semibold text-gray-800">Profile</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required placeholder="Full name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="Email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Phone"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                <input value={form.country} onChange={(e) => set('country', e.target.value)} required placeholder="Country"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
              <button type="submit" disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors">
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </form>

            {/* Verified websites */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Verified Websites ({detail.verified_websites?.length || 0})</p>
              {detail.verified_websites?.length ? (
                <div className="space-y-1.5">
                  {detail.verified_websites.map((w) => (
                    <div key={w.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
                      <span className="text-gray-700 truncate">{w.url}</span>
                      <span className={`text-xs font-medium ${w.verified ? 'text-green-600' : 'text-amber-600'}`}>
                        {w.verified ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400">None</p>}
            </div>

            {/* Approved company representation */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Approved Representative Of ({detail.rep_websites?.length || 0})</p>
              {detail.rep_websites?.length ? (
                <div className="space-y-1.5">
                  {detail.rep_websites.map((w) => (
                    <div key={w.url} className="flex items-center justify-between bg-violet-50 rounded-xl px-3 py-2 text-sm">
                      <span className="text-gray-700 truncate">{w.url}</span>
                      <span className="text-xs font-medium text-violet-600">Approved Rep</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400">None</p>}
            </div>

            {/* Reports against this user */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Reports Against This User ({detail.reports?.length || 0})</p>
              {detail.reports?.length ? (
                <div className="space-y-1.5">
                  {detail.reports.map((r) => (
                    <div key={r.id} className="bg-red-50 rounded-xl px-3 py-2 text-sm">
                      <p className="text-gray-700">{r.reason || 'No reason given'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        By {r.reporter_name || 'Unknown'} · {fmtDate(r.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400">None</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfirmDialog({ message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <p className="text-gray-700 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'
            }`}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | { user }
  const [confirm, setConfirm] = useState(null) // null | { type, user }
  const [kycFilter, setKycFilter] = useState('') // '' | 'review'
  const [reviewCount, setReviewCount] = useState(0)
  const LIMIT = 20

  const { showToast } = useToast()
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminClient.get('/users', { params: { search, page, limit: LIMIT, kyc: kycFilter } })
      setUsers(data.users)
      setTotal(data.total)
      setReviewCount(data.reviewCount || 0)
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not load members'), 'error')
    }
    setLoading(false)
  }, [search, page, kycFilter, showToast])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, kycFilter])

  // keepOpen: an action inside the detail view (e.g. a KYC decision) refreshes the list behind it
  // without closing the member the admin is looking at.
  function handleSaved(opts) {
    if (!opts?.keepOpen) setModal(null)
    load()
  }

  async function handleDelete(user) {
    try {
      await adminClient.delete(`/users/${user.id}`)
      load()
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not delete this member'), 'error')
    }
    setConfirm(null)
  }

  async function handleBlock(user) {
    try {
      await adminClient.post(`/users/${user.id}/block`)
      load()
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not block this member'), 'error')
    }
    setConfirm(null)
  }

  async function handleUnblock(user) {
    try {
      await adminClient.post(`/users/${user.id}/unblock`)
      load()
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not unblock this member'), 'error')
    }
    setConfirm(null)
  }

  const pages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500">{total} total members</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Member
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
        />
      </div>

      {/* KYC filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: '', label: 'All members' },
          { value: 'review', label: 'Needs review', count: reviewCount },
        ].map((f) => (
          <button
            key={f.value || 'all'}
            onClick={() => setKycFilter(f.value)}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
              kycFilter === f.value ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${kycFilter === f.value ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">No members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Member</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Phone</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden lg:table-cell">Country</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden xl:table-cell">Joined</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.full_name} url={u.avatar_url} />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{u.full_name}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-500 hidden md:table-cell">{u.phone || '—'}</td>
                    <td className="px-6 py-3 text-gray-500 hidden lg:table-cell">{u.country}</td>
                    <td className="px-6 py-3 text-gray-500 hidden xl:table-cell">{fmtDate(u.created_at)}</td>
                    <td className="px-6 py-3">
                      <Badge blocked={!!u.blocked_at} kycStatus={u.kyc_status} />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModal({ userId: u.id })}
                          className="text-gray-400 hover:text-violet-600 transition-colors p-1"
                          title="View / Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {u.blocked_at ? (
                          <button
                            onClick={() => setConfirm({ type: 'unblock', user: u })}
                            className="text-gray-400 hover:text-green-600 transition-colors p-1"
                            title="Unblock"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirm({ type: 'block', user: u })}
                            className="text-gray-400 hover:text-orange-600 transition-colors p-1"
                            title="Block"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => setConfirm({ type: 'delete', user: u })}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page {page} of {pages} · {total} members
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'add' && (
        <UserModal onClose={() => setModal(null)} onSave={handleSaved} />
      )}
      {modal?.userId && (
        <UserDetailModal userId={modal.userId} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {confirm?.type === 'delete' && (
        <ConfirmDialog
          message={`Permanently delete "${confirm.user.full_name}"? This cannot be undone.`}
          onConfirm={() => handleDelete(confirm.user)}
          onCancel={() => setConfirm(null)}
          danger
        />
      )}
      {confirm?.type === 'block' && (
        <ConfirmDialog
          message={`Block "${confirm.user.full_name}"? They will be unable to use the platform.`}
          onConfirm={() => handleBlock(confirm.user)}
          onCancel={() => setConfirm(null)}
          danger
        />
      )}
      {confirm?.type === 'unblock' && (
        <ConfirmDialog
          message={`Unblock "${confirm.user.full_name}"? They will regain access to the platform.`}
          onConfirm={() => handleUnblock(confirm.user)}
          onCancel={() => setConfirm(null)}
          danger={false}
        />
      )}
    </div>
  )
}
