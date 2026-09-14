import { useCallback, useEffect, useState } from 'react'
import adminClient from '../api/adminClient'
import { ROLE_LABELS } from '../../utils/roleLabels'

const ROLE_ENTRIES = Object.entries(ROLE_LABELS).sort((a, b) => a[1].localeCompare(b[1]))

const EMPTY = {
  title: '', body: '', image_url: '', link_url: '', link_text: 'Learn More',
  target_roles: [], active: true, starts_at: '', ends_at: '', weight: 1, logo_border: true,
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Datetime-local inputs want "YYYY-MM-DDTHH:mm" and reject the ISO string Postgres returns.
function toLocalInput(value) {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function AdForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function toggleRole(role) {
    setForm((f) => ({
      ...f,
      target_roles: f.target_roles.includes(role)
        ? f.target_roles.filter((r) => r !== role)
        : [...f.target_roles, role],
    }))
  }

  async function handleImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('image', file)
      const { data } = await adminClient.post('/ads/upload', body)
      set('image_url', data.imageUrl)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not upload image.')
    }
    setUploading(false)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.link_url.trim()) {
      setError('Title and link URL are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      }
      if (form.id) await adminClient.put(`/ads/${form.id}`, payload)
      else await adminClient.post('/ads', payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save the ad.')
    }
    setSaving(false)
  }

  const inp = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-400'
  const lbl = 'block text-xs font-semibold text-gray-500 mb-1.5'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
      <h2 className="text-lg font-bold text-gray-900">{form.id ? 'Edit Ad' : 'New Ad'}</h2>

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Title</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)}
                 maxLength={120} placeholder="SiGMA Europe" className={inp} />
        </div>
        <div>
          <label className={lbl}>Link URL</label>
          <input value={form.link_url} onChange={(e) => set('link_url', e.target.value)}
                 placeholder="https://sigma.world/europe" className={inp} />
        </div>
      </div>

      <div>
        <label className={lbl}>Text</label>
        <textarea value={form.body} onChange={(e) => set('body', e.target.value)}
                  maxLength={300} rows={2}
                  placeholder="Meet the iGaming world in Malta this November."
                  className={`${inp} resize-none`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Link Text</label>
          <input value={form.link_text} onChange={(e) => set('link_text', e.target.value)}
                 maxLength={60} placeholder="Learn More" className={inp} />
        </div>
        <div>
          <label className={lbl}>Weight</label>
          <input type="number" min={1} value={form.weight}
                 onChange={(e) => set('weight', e.target.value)} className={inp} />
          <p className="text-xs text-gray-400 mt-1">
            Share of impressions when several ads match the same user. A weight of 3 shows three
            times as often as a weight of 1.
          </p>
        </div>
      </div>

      <div>
        <label className={lbl}>Image</label>
        <div className="flex items-center gap-3">
          {form.image_url && (
            <img src={form.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
          )}
          <input type="file" accept="image/*" onChange={handleImage}
                 className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-violet-600" />
          {uploading && <span className="text-xs text-gray-400">Uploading…</span>}
          {form.image_url && (
            <button type="button" onClick={() => set('image_url', '')}
                    className="text-xs text-red-500 hover:text-red-700">Remove</button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Stored on our own server and served from our domain — ads never load creative from an
          advertiser's host. Square logos work best. Max 2MB.
        </p>
        <label className="flex items-center gap-2.5 cursor-pointer mt-3">
          <input type="checkbox" checked={form.logo_border} onChange={(e) => set('logo_border', e.target.checked)}
                 className="w-4 h-4 accent-violet-600" />
          <span className="text-sm text-gray-700">Show a border around the logo</span>
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Starts (optional)</label>
          <input type="datetime-local" value={toLocalInput(form.starts_at)}
                 onChange={(e) => set('starts_at', e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Ends (optional)</label>
          <input type="datetime-local" value={toLocalInput(form.ends_at)}
                 onChange={(e) => set('ends_at', e.target.value)} className={inp} />
        </div>
      </div>

      <div>
        <label className={lbl}>
          Target roles — {form.target_roles.length === 0 ? 'showing to everyone' : `${form.target_roles.length} selected`}
        </label>
        <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto p-1">
          {ROLE_ENTRIES.map(([value, label]) => {
            const on = form.target_roles.includes(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleRole(value)}
                className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${
                  on ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Targeting uses the professional role on a user's profile only. Message content is never
          used to select an ad.
        </p>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)}
               className="w-4 h-4 accent-violet-600" />
        <span className="text-sm text-gray-700">Active</span>
      </label>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl px-5 py-2.5 text-sm font-semibold">
          {saving ? 'Saving…' : 'Save Ad'}
        </button>
      </div>
    </div>
  )
}

export default function AdminAdsPage() {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminClient.get('/ads')
      setAds(data.ads || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(ad) {
    if (!window.confirm(`Delete "${ad.title}"? Its impression and click history goes with it.`)) return
    try {
      await adminClient.delete(`/ads/${ad.id}`)
      load()
    } catch {}
  }

  if (editing) {
    return (
      <AdForm
        initial={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => { setEditing(null); load() }}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sponsored Ads</h1>
          <p className="text-sm text-gray-500">
            {ads.length} {ads.length === 1 ? 'ad' : 'ads'} · shown to Free accounts only
          </p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shrink-0">
          New Ad
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ads.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <p className="text-sm">No ads yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Ad</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden lg:table-cell">Targeting</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Views</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Clicks</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">CTR</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Runs</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => {
                  const views = Number(ad.impressions) || 0
                  const clicks = Number(ad.clicks) || 0
                  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '—'
                  return (
                    <tr key={ad.id} className="border-b border-gray-50 last:border-b-0">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {ad.image_url
                            ? <img src={ad.image_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                            : <span className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate flex items-center gap-2">
                              {ad.title}
                              {!ad.active && (
                                <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">Paused</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{ad.link_url}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 hidden lg:table-cell text-gray-500 text-xs">
                        {ad.target_roles?.length
                          ? `${ad.target_roles.length} role${ad.target_roles.length === 1 ? '' : 's'}`
                          : 'Everyone'}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-700">{views.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-gray-700">{clicks.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-gray-700">{ctr === '—' ? '—' : `${ctr}%`}</td>
                      <td className="px-6 py-3 hidden md:table-cell text-gray-500 text-xs whitespace-nowrap">
                        {fmtDate(ad.starts_at)} → {fmtDate(ad.ends_at)}
                      </td>
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        <button onClick={() => setEditing({ ...ad, body: ad.body || '', image_url: ad.image_url || '', target_roles: ad.target_roles || [], logo_border: ad.logo_border !== false })}
                                className="text-xs font-semibold text-violet-600 hover:text-violet-800">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(ad)}
                                className="ml-3 text-xs font-semibold text-red-500 hover:text-red-700">
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Views are daily unique viewers, not raw renders — one per person per ad per day. Pro
        accounts are never served an ad.
      </p>
    </div>
  )
}
