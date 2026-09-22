import { useEffect, useRef, useState } from 'react'
import {
  getMyBusinesses, createBusiness, updateBusiness, getPublicBusiness,
  uploadBusinessLogo, uploadBusinessCover,
} from '../../api/businesses'

const FIELDS = ['name', 'about', 'website_url', 'founded_on', 'email', 'industry', 'headquarters']

function toForm(b) {
  return {
    name: b.name || '',
    about: b.about || '',
    website_url: b.website_url || '',
    founded_on: b.founded_on ? String(b.founded_on).slice(0, 10) : '',
    email: b.email || '',
    industry: b.industry || '',
    headquarters: b.headquarters || '',
    services: b.services || [],
    slug: b.slug || '',
    show_on_profile: b.show_on_profile !== false,
  }
}

function Toggle({ on, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${on ? 'bg-violet-600' : 'bg-gray-400'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${on ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  )
}

export default function BusinessProfileSection({ darkMode, onToast }) {
  const [data, setData] = useState(null) // { businesses, availableWebsites }
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(null)
  const [team, setTeam] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(null)
  const [serviceDraft, setServiceDraft] = useState('')
  const [newSite, setNewSite] = useState('')
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const logoInput = useRef(null)
  const coverInput = useRef(null)

  const dm = darkMode
  const sub = dm ? 'text-gray-400' : 'text-gray-500'
  const heading = `text-sm font-bold ${dm ? 'text-white' : 'text-gray-900'}`
  const lbl = `block text-xs font-medium mb-1 ${sub}`
  const inp = `w-full rounded-xl px-4 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-violet-400 transition-colors ${
    dm ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
  }`
  const card = `rounded-2xl border p-5 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`

  async function load(keepId) {
    const d = await getMyBusinesses()
    setData(d)
    const pick = d.businesses.find((b) => b.id === keepId) || d.businesses[0] || null
    setSelectedId(pick?.id ?? null)
    setForm(pick ? toForm(pick) : null)
    if (!pick && d.availableWebsites[0]) setNewSite(d.availableWebsites[0].url)
  }

  useEffect(() => {
    load().catch(() => setData({ businesses: [], availableWebsites: [] }))
  }, [])

  const business = data?.businesses.find((b) => b.id === selectedId) || null

  // Team comes from the public view so this shows exactly what visitors will see.
  useEffect(() => {
    if (!business?.slug) { setTeam([]); return }
    getPublicBusiness(business.slug).then((d) => setTeam(d.team || [])).catch(() => setTeam([]))
  }, [business?.slug])

  function select(b) {
    setSelectedId(b.id)
    setForm(toForm(b))
  }

  function replaceBusiness(updated) {
    setData((d) => ({ ...d, businesses: d.businesses.map((b) => (b.id === updated.id ? updated : b)) }))
  }

  async function handleCreate() {
    if (!newSite || !newName.trim()) return
    setCreating(true)
    try {
      const { business: created } = await createBusiness({ website_url: newSite, name: newName.trim() })
      setNewName('')
      await load(created.id)
      onToast?.('Business profile created.')
    } catch (err) {
      onToast?.(err.response?.data?.error || 'Could not create the business profile.', 'error')
    }
    setCreating(false)
  }

  async function handleSave() {
    if (!business || !form) return
    setSaving(true)
    try {
      const patch = { services: form.services, show_on_profile: form.show_on_profile }
      for (const key of FIELDS) patch[key] = form[key]
      if (form.slug !== business.slug) patch.slug = form.slug
      const { business: updated } = await updateBusiness(business.id, patch)
      replaceBusiness(updated)
      setForm(toForm(updated))
      await load(updated.id)
      onToast?.('Business profile saved.')
    } catch (err) {
      onToast?.(err.response?.data?.error || 'Could not save the business profile.', 'error')
    }
    setSaving(false)
  }

  async function handleImage(kind, file) {
    if (!file || !business) return
    setUploading(kind)
    try {
      const upload = kind === 'logo' ? uploadBusinessLogo : uploadBusinessCover
      const { business: updated } = await upload(business.id, file)
      replaceBusiness(updated)
    } catch (err) {
      onToast?.(err.response?.data?.error || 'Could not upload that image.', 'error')
    }
    setUploading(null)
  }

  function addService() {
    const s = serviceDraft.trim()
    if (!s || form.services.includes(s) || form.services.length >= 12) return
    setForm((f) => ({ ...f, services: [...f.services, s] }))
    setServiceDraft('')
  }

  if (!data) {
    return (
      <div className="flex justify-center py-10">
        <span className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const shareUrl = business ? `${window.location.origin}/b/${business.slug}` : ''
  const websiteChoices = [
    ...(business ? [{ url: business.website_url }] : []),
    ...data.availableWebsites,
  ]

  const createCard = data.availableWebsites.length > 0 && (
    <div className={card}>
      <p className={heading}>{data.businesses.length ? 'Add another business profile' : 'Create your business profile'}</p>
      <p className={`text-xs mt-1 mb-4 ${sub}`}>
        A business profile gives your company a page people can open from your website and choose
        who on your team to message. Each verified website can have one.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Website</label>
          <select value={newSite} onChange={(e) => setNewSite(e.target.value)} className={inp}>
            {data.availableWebsites.map((w) => <option key={w.id} value={w.url}>{w.domain}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Business name</label>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Northstar Media" className={inp} />
        </div>
      </div>
      <button
        onClick={handleCreate}
        disabled={creating || !newName.trim() || !newSite}
        className="mt-4 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
      >
        {creating ? 'Creating…' : 'Create business profile'}
      </button>
    </div>
  )

  if (!business) {
    return (
      <div className="space-y-4">
        {createCard || (
          <p className={`text-sm ${sub}`}>Verify a website under Website Verification to create a business profile.</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {data.businesses.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {data.businesses.map((b) => (
            <button
              key={b.id}
              onClick={() => select(b)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                b.id === selectedId ? 'bg-violet-600 text-white' : dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Cover + logo */}
      <div className={`${card} p-0 overflow-hidden`}>
        <div
          className={`relative h-36 bg-cover bg-center ${business.cover_url ? '' : 'bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-600'}`}
          style={business.cover_url ? { backgroundImage: `url(${business.cover_url})` } : undefined}
        >
          <button
            onClick={() => coverInput.current?.click()}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/50 hover:bg-black/60 text-white text-xs font-semibold"
          >
            {uploading === 'cover' ? 'Uploading…' : business.cover_url ? 'Change cover' : 'Add cover image'}
          </button>
          <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={(e) => handleImage('cover', e.target.files?.[0])} />
        </div>
        <div className="px-5 pb-5 flex items-end gap-4 -mt-10">
          <button
            onClick={() => logoInput.current?.click()}
            title="Logo, 250 × 250"
            className={`relative w-20 h-20 rounded-2xl overflow-hidden ring-4 shrink-0 flex items-center justify-center text-xs font-semibold ${
              dm ? 'ring-gray-800 bg-gray-700 text-gray-300' : 'ring-white bg-gray-100 text-gray-500'
            }`}
          >
            {business.logo_url ? <img src={business.logo_url} alt="" className="w-full h-full object-cover" /> : 'Add logo'}
            {uploading === 'logo' && <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">…</span>}
          </button>
          <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={(e) => handleImage('logo', e.target.files?.[0])} />
          <p className={`text-xs pb-1 ${sub}`}>Logo: square, 250 × 250 px works best. Cover: a wide image, at least 1200 px across.</p>
        </div>
      </div>

      {/* Details */}
      <div className={`${card} space-y-4`}>
        <p className={heading}>Business details</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Business name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inp} />
          </div>
          <div>
            <label className={lbl}>Website</label>
            <select value={form.website_url} onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))} className={inp}>
              {websiteChoices.map((w) => (
                <option key={w.url} value={w.url}>{w.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Industry</label>
            <input value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} placeholder="e.g. Marketing & Advertising" className={inp} />
          </div>
          <div>
            <label className={lbl}>Headquarters</label>
            <input value={form.headquarters} onChange={(e) => setForm((f) => ({ ...f, headquarters: e.target.value }))} placeholder="e.g. Bucharest, Romania" className={inp} />
          </div>
          <div>
            <label className={lbl}>Founded</label>
            <input type="date" value={form.founded_on} onChange={(e) => setForm((f) => ({ ...f, founded_on: e.target.value }))} className={inp} />
          </div>
          <div>
            <label className={lbl}>Contact email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="hello@yourcompany.com" className={inp} />
          </div>
        </div>
        <div>
          <label className={lbl}>About</label>
          <textarea rows={4} value={form.about} onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))} placeholder="What your company does and who you work with." className={`${inp} resize-none`} />
        </div>
        <div>
          <label className={lbl}>Services</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.services.map((s) => (
              <span key={s} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${dm ? 'border-gray-600 text-gray-200' : 'border-gray-200 text-gray-700'}`}>
                {s}
                <button
                  type="button"
                  aria-label={`Remove ${s}`}
                  onClick={() => setForm((f) => ({ ...f, services: f.services.filter((x) => x !== s) }))}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={serviceDraft}
              onChange={(e) => setServiceDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addService() } }}
              placeholder="e.g. Affiliate Marketing, then press Enter"
              className={inp}
            />
            <button type="button" onClick={addService} className={`px-4 rounded-xl text-sm font-semibold ${dm ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Share link + visibility */}
      <div className={`${card} space-y-4`}>
        <p className={heading}>Share link</p>
        <p className={`text-xs -mt-2 ${sub}`}>
          Add this link to your website footer or contact page. Visitors see your business profile
          and choose who on your team to message.
        </p>
        <div>
          <label className={lbl}>Link</label>
          <div className="flex items-center gap-2">
            <span className={`text-sm shrink-0 ${sub}`}>{window.location.host}/b/</span>
            <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))} className={inp} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(shareUrl).then(() => onToast?.('Link copied.')).catch(() => {})}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
          >
            Copy link
          </button>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 rounded-xl text-sm font-semibold ${dm ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
            View business profile
          </a>
        </div>
        <div className={`flex items-start justify-between gap-4 pt-4 border-t ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
          <div>
            <p className={`text-sm font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>Show on my personal profile</p>
            <p className={`text-xs mt-0.5 ${sub}`}>Adds a card linking to this business on your own profile.</p>
          </div>
          <Toggle on={form.show_on_profile} onClick={() => setForm((f) => ({ ...f, show_on_profile: !f.show_on_profile }))} />
        </div>
      </div>

      {/* Team */}
      <div className={card}>
        <p className={heading}>Team members</p>
        <p className={`text-xs mt-1 mb-4 ${sub}`}>
          You and everyone you've approved as a representative of this website. Anyone who has hidden
          their profile from search isn't listed.
        </p>
        {team.length === 0 ? (
          <p className={`text-sm ${sub}`}>Save your profile to see your team here.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {team.map((m) => {
              const name = m.display_name || m.full_name || m.username
              return (
                <div key={m.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                  <span className={`w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white text-sm font-bold ${m.avatar_url ? '' : 'bg-violet-500'}`}>
                    {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" /> : (name || '?')[0].toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{name}</p>
                    <p className={`text-xs truncate ${sub}`}>{m.job_title || (m.is_owner ? 'Owner' : 'Representative')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save business profile'}
        </button>
      </div>

      {createCard}
    </div>
  )
}
