import { useState, useEffect, useRef } from 'react'
import { getMyProfile, updateProfile, uploadAvatar } from '../../api/users'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import TwoFactorSection from './TwoFactorSection'
import SocialLinksSection from './SocialLinksSection'
import PasswordSection from './PasswordSection'
import WebsiteVerificationSection from './WebsiteVerificationSection'
import BillingSection from './BillingSection'
import ChatSection from './ChatSection'
import NotificationsSection from './NotificationsSection'
import DeviceSection from './DeviceSection'

const INDUSTRY_ROLES = [
  { value: 'affiliate_publisher',  label: 'Affiliate Publisher' },
  { value: 'casino_operator',      label: 'Casino Operator' },
  { value: 'affiliate_manager',    label: 'Affiliate Manager' },
  { value: 'game_provider',        label: 'Game Provider' },
  { value: 'payment_provider',     label: 'Payment Provider' },
  { value: 'platform_provider',    label: 'Platform Provider' },
  { value: 'media_seo_agency',     label: 'Media / SEO Agency' },
  { value: 'event_organizer',      label: 'Event Organizer' },
  { value: 'influencer_streamer',  label: 'Influencer / Streamer' },
  { value: 'investor_advisor',     label: 'Investor / Advisor' },
  { value: 'compliance_legal',     label: 'Compliance & Legal' },
  { value: 'kyc_aml_provider',     label: 'KYC / AML Provider' },
  { value: 'other',                label: 'Other' },
]

const META = {
  profile: {
    title: 'Profile Info',
    color: 'bg-red-500',
    path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  website: {
    title: 'Website Verification',
    color: 'bg-blue-500',
    path: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  social: {
    title: 'Social Profiles',
    color: 'bg-pink-500',
    path: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  },
  billing: {
    title: 'Billing',
    color: 'bg-cyan-600',
    path: 'M3 10h18M7 15h1m4 0h1M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  password: {
    title: 'Password',
    color: 'bg-slate-500',
    path: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  },
  twofa: {
    title: 'Two-Factor Authentication',
    color: 'bg-indigo-500',
    path: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  chat: {
    title: 'Chat',
    color: 'bg-green-500',
    path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  notifications: {
    title: 'Notifications',
    color: 'bg-orange-500',
    path: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
  devices: {
    title: 'Device History',
    color: 'bg-amber-500',
    path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
}

// ─── profile form helpers ────────────────────────────────────────────────────

function InputIcon({ icon, tip, darkMode }) {
  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 group z-10">
      <div className="cursor-help text-gray-400">{icon}</div>
      <div className={`absolute right-0 top-full mt-1.5 w-52 text-xs rounded-lg px-2.5 py-1.5 z-20 leading-snug opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-white'}`}>
        {tip}
      </div>
    </div>
  )
}

function LockTooltip({ tip, darkMode }) {
  return (
    <InputIcon
      darkMode={darkMode}
      tip={tip}
      icon={
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      }
    />
  )
}

function InfoTooltip({ tip, darkMode }) {
  return (
    <InputIcon
      darkMode={darkMode}
      tip={tip}
      icon={
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    />
  )
}

function ChangeEmailModal({ currentEmail, darkMode, onClose, onChanged }) {
  const [step, setStep] = useState('form') // 'form' | 'done'
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!newEmail.includes('@')) { setError('Enter a valid email address.'); return }
    if (!password) { setError('Enter your current password to confirm.'); return }
    setSaving(true)
    setError('')
    try {
      await client.patch('/users/me/email', { new_email: newEmail, password })
      setStep('done')
      onChanged?.(newEmail)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update email.')
    }
    setSaving(false)
  }

  const inp = `w-full rounded-xl px-4 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-violet-400 transition-colors ${darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-96 rounded-2xl shadow-2xl p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base">Change Email</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {step === 'done' ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold">Email Updated</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your email has been changed to <strong>{newEmail}</strong>.</p>
            <button onClick={onClose} className="mt-2 px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            <div>
              <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>New Email Address</label>
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@email.com" className={inp} />
            </div>
            <div>
              <label className={`text-xs mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Password (to confirm)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inp} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50">
                {saving ? 'Saving…' : 'Update Email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ProfileInfoForm({ profile, darkMode, onSaved }) {
  const { setUser } = useAuth()
  const fileRef = useRef(null)
  const [form, setForm] = useState({
    bio:           profile.bio || '',
    gender:        profile.gender || '',
    phone:         profile.phone || '',
    location:      profile.location || '',
    country:       profile.country || '',
    primary_role:  profile.primary_role || '',
    date_of_birth: profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
    job_title:     profile.job_title || '',
    company_name:  profile.company_name || '',
  })
  const [displayMode, setDisplayMode] = useState(() => {
    return profile.display_name === profile.username ? 'username' : 'fullname'
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState({})
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [currentEmail, setCurrentEmail] = useState(profile.email || '')

  const knownRoleValues = INDUSTRY_ROLES.map((r) => r.value)
  const isOtherRole = form.primary_role && !knownRoleValues.includes(form.primary_role) && form.primary_role !== 'other'
  const kycLocked   = profile.kyc_status === 'verified'

  const inp = `w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${
    darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
  } focus:ring-2 focus:ring-violet-400 transition-colors`
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const lbl = `text-xs mb-1 flex items-center ${sub}`

  async function handleAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await uploadAvatar(file)
      setUser((prev) => ({ ...prev, avatar_url: data.avatarUrl }))
    } catch {}
  }

  function validate() {
    const errs = {}
    if (form.phone && !/^[\d\s\+\-\(\)]+$/.test(form.phone)) {
      errs.phone = 'Phone number can only contain digits, spaces, +, -, ( and ).'
    }
    return errs
  }

  async function handleSave(e) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      const payload = {
        display_name:  displayMode === 'username' ? profile.username : profile.full_name,
        bio:           form.bio,
        gender:        form.gender,
        phone:         form.phone,
        location:      form.location,
        country:       form.country,
        primary_role:  form.primary_role,
        date_of_birth: form.date_of_birth || undefined,
        job_title:     form.job_title || undefined,
        company_name:  form.company_name || undefined,
      }
      const data = await updateProfile(payload)
      setUser((prev) => ({ ...prev, ...data.user }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSaved?.()
    } catch {}
    setSaving(false)
  }

  const avatarSrc = profile.avatar_url
  const initials  = ((profile.display_name || profile.full_name || '?')[0]).toUpperCase()

  return (
    <>
    <form onSubmit={handleSave} className="space-y-3">
      {/* Avatar */}
      <div className="flex justify-center mb-2">
        <button type="button" onClick={() => fileRef.current?.click()} className="relative group">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-violet-400">
            {avatarSrc
              ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white text-2xl font-bold">{initials}</div>}
          </div>
          <span className="absolute bottom-0 right-0 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center text-white">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
      </div>

      {/* First Name (locked) */}
      <div>
        <label className={lbl}>Name</label>
        <div className="relative">
          <input value={profile.full_name} disabled className={`${inp} opacity-60 cursor-not-allowed ${kycLocked ? 'pr-9' : ''}`} />
          {kycLocked && <LockTooltip tip="Name cannot be changed after KYC verification." darkMode={darkMode} />}
        </div>
      </div>

      {/* Username */}
      <div>
        <label className={lbl}>Username</label>
        <div className={`flex items-center rounded-xl border px-4 py-2.5 gap-2 opacity-60 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
          <span className={`text-sm ${sub}`}>@</span>
          <input value={profile.username} disabled className={`flex-1 bg-transparent outline-none text-sm cursor-not-allowed ${darkMode ? 'text-white' : ''}`} />
        </div>
      </div>

      {/* Display name */}
      <div>
        <label className={lbl}>Display Name</label>
        <div className="relative">
          <select value={displayMode} onChange={(e) => setDisplayMode(e.target.value)} className={`${inp} pr-14 appearance-none`}>
            <option value="fullname">Full name</option>
            <option value="username">Username</option>
          </select>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <InfoTooltip tip="This name is shown to others in chat lists, headers, and messages." darkMode={darkMode} />
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className={lbl}>Gender</label>
        <div className="relative">
          <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className={`${inp} pr-8 appearance-none`}>
            <option value="">Prefer not to say</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Others">Others</option>
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Mobile */}
      <div>
        <label className={lbl}>Mobile Number</label>
        <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 555 000 0000" className={inp} />
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
      </div>

      {/* Email — editable via modal */}
      <div>
        <label className={lbl}>Email</label>
        <div className={`flex items-center rounded-xl border px-4 py-2.5 gap-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
          <span className={`flex-1 text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>{currentEmail}</span>
          <button type="button" onClick={() => setShowEmailModal(true)} className="text-xs text-violet-500 hover:text-violet-700 font-medium shrink-0">Change</button>
        </div>
      </div>

      {/* Date of birth */}
      <div>
        <label className={lbl}>Date of Birth</label>
        <input type="date" value={form.date_of_birth} onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))} className={inp} />
      </div>

      {/* Country */}
      <div>
        <label className={lbl}>Country</label>
        <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} placeholder="Country" className={inp} />
      </div>

      {/* About */}
      <div>
        <label className={lbl}>About</label>
        <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Tell people about yourself…" className={`${inp} resize-none`} />
      </div>

      {/* Industry Role */}
      <div>
        <label className={lbl}>Industry Role</label>
        <div className="relative">
          <select value={isOtherRole ? 'other' : form.primary_role} onChange={(e) => setForm((f) => ({ ...f, primary_role: e.target.value }))} className={`${inp} pr-8 appearance-none`}>
            <option value="">Select a role</option>
            {INDUSTRY_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Position */}
      <div>
        <label className={lbl}>Position</label>
        <input value={form.job_title} onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))} placeholder="e.g. CEO, Affiliate Manager…" className={inp} />
      </div>

      {/* Company Name — locked, set via website verification */}
      <div>
        <label className={lbl}>Company Name</label>
        <div className="relative">
          <input
            value={form.company_name}
            disabled
            placeholder={profile.website_verified || profile.website_representation_approved ? '' : 'Requires website verification'}
            className={`${inp} opacity-60 cursor-not-allowed pr-9`}
          />
          <LockTooltip
            tip={
              profile.website_representation_approved
                ? 'Company name was set when you were approved as a representative. Contact support to update.'
                : profile.website_verified
                  ? 'Company name is tied to your verified website. Contact support to update.'
                  : 'Verify your website to unlock your company name.'
            }
            darkMode={darkMode}
          />
        </div>
      </div>

      <button type="submit" disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50 transition-colors">
        {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>

    {showEmailModal && (
      <ChangeEmailModal
        currentEmail={currentEmail}
        darkMode={darkMode}
        onClose={() => setShowEmailModal(false)}
        onChanged={(email) => { setCurrentEmail(email) }}
      />
    )}
    </>
  )
}

// ─── main panel ──────────────────────────────────────────────────────────────

export default function SettingsDetailPanel({ darkMode, section }) {
  const dm = darkMode
  const { socket } = useSocket()
  const [profile, setProfile] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!section) return
    setProfile(null)
    getMyProfile().then((d) => setProfile(d.user)).catch(() => {})
  }, [section])

  // Real-time: a representation request of ours was approved/rejected, or our
  // rep status was revoked — refetch so website_representation_approved / rep_websites stay live.
  useEffect(() => {
    if (!socket) return
    function refreshProfile() {
      getMyProfile().then((d) => setProfile(d.user)).catch(() => {})
    }
    socket.on('rep-request-update', refreshProfile)
    return () => socket.off('rep-request-update', refreshProfile)
  }, [socket])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  if (!section) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center h-full gap-3 ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <svg className={`w-12 h-12 ${dm ? 'text-gray-700' : 'text-gray-200'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
        </svg>
        <p className={`text-sm ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Select a setting to get started</p>
      </div>
    )
  }

  const meta = META[section]

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-200 px-4 py-2 rounded-xl text-sm font-medium shadow-lg ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className={`flex items-center gap-3 px-6 py-4 border-b shrink-0 ${dm ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={meta.path} />
          </svg>
        </span>
        <h2 className={`text-base font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>{meta.title}</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!profile ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : section === 'website' ? (
          // Website Verification builds its own full-width card layout — no outer box.
          <div className="max-w-4xl mx-auto">
            <WebsiteVerificationSection darkMode={dm} profile={profile} />
          </div>
        ) : section === 'billing' ? (
          // Billing builds its own full-width card layout — no outer box.
          <div className="max-w-4xl mx-auto">
            <BillingSection darkMode={dm} />
          </div>
        ) : section === 'social' ? (
          // Social Profiles builds its own full-width card layout — no outer box.
          <div className="max-w-4xl mx-auto">
            <SocialLinksSection darkMode={dm} onToast={showToast} profile={profile} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className={`rounded-2xl p-6 shadow-sm ${dm ? 'bg-gray-900' : 'bg-white'}`}>
              {section === 'profile' && <ProfileInfoForm profile={profile} darkMode={dm} onSaved={() => showToast('Profile saved.')} />}
              {section === 'password' && <PasswordSection darkMode={dm} />}
              {section === 'twofa' && <TwoFactorSection darkMode={dm} />}
              {section === 'chat' && (
                <>
                  <p className={`text-xs mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                    Chat preferences: clear history on your device, and backup.
                  </p>
                  <ChatSection darkMode={dm} />
                </>
              )}
              {section === 'notifications' && <NotificationsSection darkMode={dm} />}
              {section === 'devices' && <DeviceSection darkMode={dm} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
