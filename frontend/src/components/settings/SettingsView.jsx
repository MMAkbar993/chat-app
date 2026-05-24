import { useState, useEffect, useRef } from 'react'
import { getMyProfile, updateProfile, uploadAvatar } from '../../api/users'
import { useAuth } from '../../context/AuthContext'
import TwoFactorSection from './TwoFactorSection'
import SocialLinksSection from './SocialLinksSection'

export default function SettingsView({ darkMode }) {
  const { setUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    getMyProfile().then((d) => {
      setProfile(d.user)
      setForm({
        display_name: d.user.display_name || '',
        bio: d.user.bio || '',
        gender: d.user.gender || '',
        phone: d.user.phone || '',
        website: d.user.website || '',
        location: d.user.location || '',
      })
    }).catch(() => {})
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const data = await updateProfile(form)
      setProfile(data.user)
      setUser((prev) => ({ ...prev, ...data.user }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  async function handleAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await uploadAvatar(file)
      setProfile((prev) => ({ ...prev, avatar_url: data.avatarUrl }))
      setUser((prev) => ({ ...prev, avatar_url: data.avatarUrl }))
    } catch {}
  }

  if (!profile) return (
    <div className={`w-80 flex items-center justify-center border-r ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const inputCls = `w-full rounded-xl px-4 py-2 text-sm outline-none border ${
    darkMode ? 'bg-gray-800 text-white border-gray-700 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
  }`

  return (
    <div className={`w-80 flex flex-col border-r overflow-y-auto ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="px-4 pt-5 pb-3">
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
      </div>

      <div className="px-4">
        <div className={`rounded-2xl p-4 mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Profile Info</span>
          </div>

          {/* Avatar upload */}
          <div className="flex justify-center mb-4">
            <button onClick={() => fileRef.current?.click()} className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-violet-400">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white text-xl font-bold">{(profile.display_name || profile.full_name || '?')[0].toUpperCase()}</div>}
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-white">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            {/* Locked name */}
            <div>
              <input value={profile.full_name} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
              <p className={`text-xs mt-1 flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <span>🔒</span> Locked (KYC Verified)
              </p>
            </div>

            <div>
              <input value="" disabled placeholder="Last Name" className={`${inputCls} opacity-60 cursor-not-allowed`} />
              <p className={`text-xs mt-1 flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <span>🔒</span> Locked (KYC Verified)
              </p>
            </div>

            <div>
              <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Username</label>
              <div className={`flex items-center rounded-xl border px-4 py-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <input
                  value={form.display_name || profile.username}
                  onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                  className={`flex-1 bg-transparent outline-none text-sm ${darkMode ? 'text-white' : ''}`}
                />
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>

            <div>
              <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Display name in chat and profile</label>
              <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>This name is shown to others in chat lists, headers, and messages.</p>
              <div className={`flex items-center rounded-xl border px-4 py-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <input
                  value={form.display_name}
                  onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                  placeholder="Full name"
                  className={`flex-1 bg-transparent outline-none text-sm ${darkMode ? 'text-white placeholder-gray-500' : 'placeholder-gray-400'}`}
                />
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            <div>
              <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                className={`${inputCls}`}
              >
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Phone number"
                className={inputCls}
              />
            </div>

            <div>
              <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="City, Country"
                className={inputCls}
              />
            </div>

            <div>
              <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Website</label>
              <input
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://yourwebsite.com"
                className={inputCls}
              />
            </div>

            <div>
              <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3}
                placeholder="Tell people about yourself..."
                className={`${inputCls} resize-none`}
              />
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2 font-semibold text-sm disabled:opacity-50 transition-colors">
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <TwoFactorSection darkMode={darkMode} />
        <SocialLinksSection darkMode={darkMode} />
      </div>
    </div>
  )
}
