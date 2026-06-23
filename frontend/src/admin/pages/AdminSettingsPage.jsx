import { useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthContext'
import adminClient from '../api/adminClient'

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const { admin, setAdmin } = useAdminAuth()

  const [profile, setProfile] = useState({
    full_name: admin?.full_name || '',
    avatar_url: admin?.avatar_url || '',
  })
  const [profileMsg, setProfileMsg] = useState(null)
  const [profileSaving, setProfileSaving] = useState(false)

  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm: '' })
  const [pwdMsg, setPwdMsg] = useState(null)
  const [pwdSaving, setPwdSaving] = useState(false)

  async function saveProfile(e) {
    e.preventDefault()
    setProfileMsg(null)
    setProfileSaving(true)
    try {
      const { data } = await adminClient.put('/settings/profile', {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url || null,
      })
      setAdmin((a) => ({ ...a, ...data.admin }))
      setProfileMsg({ ok: true, text: 'Profile updated successfully.' })
    } catch (err) {
      setProfileMsg({ ok: false, text: err.response?.data?.error || 'Save failed' })
    } finally {
      setProfileSaving(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    setPwdMsg(null)
    if (pwd.new_password !== pwd.confirm) {
      setPwdMsg({ ok: false, text: 'New passwords do not match.' })
      return
    }
    if (pwd.new_password.length < 8) {
      setPwdMsg({ ok: false, text: 'Password must be at least 8 characters.' })
      return
    }
    setPwdSaving(true)
    try {
      await adminClient.post('/settings/password', {
        current_password: pwd.current_password,
        new_password: pwd.new_password,
      })
      setPwdMsg({ ok: true, text: 'Password changed successfully.' })
      setPwd({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      setPwdMsg({ ok: false, text: err.response?.data?.error || 'Failed to change password' })
    } finally {
      setPwdSaving(false)
    }
  }

  const initials = admin?.full_name
    ? admin.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A'

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile */}
      <Section title="Profile Settings">
        <form onSubmit={saveProfile} className="space-y-5">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-white text-xl font-bold">
                {initials}
              </div>
            )}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Avatar URL</label>
              <input
                value={profile.avatar_url}
                onChange={(e) => setProfile((p) => ({ ...p, avatar_url: e.target.value }))}
                placeholder="https://example.com/photo.jpg"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
            <input
              value={profile.full_name}
              onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
              required
              placeholder="Admin Name"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              value={admin?.email || ''}
              disabled
              className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
          </div>

          {profileMsg && (
            <div className={`rounded-xl px-4 py-3 text-sm ${
              profileMsg.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {profileMsg.text}
            </div>
          )}

          <button type="submit" disabled={profileSaving}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors flex items-center gap-2">
            {profileSaving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Save Profile
          </button>
        </form>
      </Section>

      {/* Change password */}
      <Section title="Change Password">
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password *</label>
            <input
              type="password"
              value={pwd.current_password}
              onChange={(e) => setPwd((p) => ({ ...p, current_password: e.target.value }))}
              required
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password *</label>
            <input
              type="password"
              value={pwd.new_password}
              onChange={(e) => setPwd((p) => ({ ...p, new_password: e.target.value }))}
              required
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password *</label>
            <input
              type="password"
              value={pwd.confirm}
              onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
              required
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {pwdMsg && (
            <div className={`rounded-xl px-4 py-3 text-sm ${
              pwdMsg.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {pwdMsg.text}
            </div>
          )}

          <button type="submit" disabled={pwdSaving}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors flex items-center gap-2">
            {pwdSaving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Change Password
          </button>
        </form>
      </Section>
    </div>
  )
}
