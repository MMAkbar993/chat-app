import { useState, useEffect, useRef } from 'react'
import { getMyProfile, updateProfile, uploadAvatar, deleteAccount } from '../../api/users'
import { useAuth } from '../../context/AuthContext'
import TwoFactorSection from './TwoFactorSection'
import SocialLinksSection from './SocialLinksSection'
import PasswordSection from './PasswordSection'
import WebsiteVerificationSection from './WebsiteVerificationSection'
import ChatSection from './ChatSection'
import NotificationsSection from './NotificationsSection'
import DeviceSection from './DeviceSection'
import BlockedContactsModal from '../contacts/BlockedContactsModal'
import ConfirmDialog from '../ui/ConfirmDialog'

const PRIMARY_ROLES = ['Developer', 'Designer', 'Product Manager', 'Marketing', 'Sales', 'Support', 'Executive', 'Content Creator', 'Other']

// ─── helpers ────────────────────────────────────────────────────────────────

function SectionLabel({ children, darkMode }) {
  return (
    <p className={`px-1 mt-5 mb-2 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      {children}
    </p>
  )
}

function CollapsibleBox({ title, icon, children, darkMode, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const dm = darkMode
  return (
    <div className={`rounded-2xl mb-3 overflow-hidden ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 px-4 py-3.5 text-left transition-colors ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
      >
        {icon}
        <span className={`flex-1 text-sm font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>{title}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className={`border-t px-4 py-4 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
          {children}
        </div>
      )}
    </div>
  )
}

function OthersBox({ title, icon, children, darkMode }) {
  const [open, setOpen] = useState(false)
  const dm = darkMode
  return (
    <div className={`border-b ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
      >
        <span className={dm ? 'text-gray-400' : 'text-gray-500'}>{icon}</span>
        <span className={`flex-1 text-sm font-medium ${dm ? 'text-white' : 'text-gray-900'}`}>{title}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className={`px-4 pb-4 text-sm leading-relaxed ${dm ? 'text-gray-300' : 'text-gray-600'}`}>
          <p className={`text-xs mb-2 italic ${dm ? 'text-gray-500' : 'text-gray-400'}`}>For your reference. Set by the site administrator.</p>
          {children}
        </div>
      )}
    </div>
  )
}

function ArrowRow({ icon, label, description, onClick, darkMode, danger = false }) {
  const dm = darkMode
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b transition-colors ${
        dm ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
      }`}
    >
      <span className={danger ? 'text-red-500' : (dm ? 'text-gray-400' : 'text-gray-500')}>{icon}</span>
      <div className="flex-1">
        <p className={`text-sm font-medium ${danger ? 'text-red-500' : (dm ? 'text-white' : 'text-gray-900')}`}>{label}</p>
        {description && <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{description}</p>}
      </div>
      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

// ─── profile form ────────────────────────────────────────────────────────────

function ProfileInfoForm({ profile, darkMode, onSaved }) {
  const { setUser } = useAuth()
  const fileRef = useRef(null)
  const [form, setForm] = useState({
    display_name:  profile.display_name || '',
    bio:           profile.bio || '',
    gender:        profile.gender || '',
    phone:         profile.phone || '',
    website:       profile.website || '',
    location:      profile.location || '',
    country:       profile.country || '',
    primary_role:  profile.primary_role || '',
    date_of_birth: profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
    custom_role:   '',
  })
  const [displayMode, setDisplayMode] = useState(() => {
    return profile.display_name === profile.username ? 'username' : 'fullname'
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState({})

  const isOtherRole = !PRIMARY_ROLES.slice(0, -1).includes(form.primary_role) && form.primary_role !== ''
  const kycLocked   = profile.kyc_status === 'verified'

  const inp = `w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${
    darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
  } focus:ring-2 focus:ring-violet-400 transition-colors`
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'

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
        primary_role:  isOtherRole ? form.custom_role || form.primary_role : form.primary_role,
        date_of_birth: form.date_of_birth || undefined,
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
        <label className={`text-xs mb-1 block ${sub}`}>First Name</label>
        <input value={profile.full_name} disabled className={`${inp} opacity-60 cursor-not-allowed`} />
        {kycLocked && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${sub}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Name cannot be changed after KYC verification.
          </p>
        )}
      </div>

      {/* Last Name (locked placeholder) */}
      <div>
        <label className={`text-xs mb-1 block ${sub}`}>Last Name</label>
        <input value="" disabled placeholder="Last Name" className={`${inp} opacity-60 cursor-not-allowed`} />
        {kycLocked && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${sub}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Name cannot be changed after KYC verification.
          </p>
        )}
      </div>

      {/* Username */}
      <div>
        <label className={`text-xs mb-1 block ${sub}`}>Username</label>
        <div className={`flex items-center rounded-xl border px-4 py-2.5 gap-2 ${
          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          <span className={`text-sm ${sub}`}>@</span>
          <input
            value={profile.username}
            disabled
            className={`flex-1 bg-transparent outline-none text-sm opacity-60 cursor-not-allowed ${darkMode ? 'text-white' : ''}`}
          />
        </div>
      </div>

      {/* Display name mode */}
      <div>
        <label className={`text-xs mb-1 block ${sub}`}>Display name in chat and profile</label>
        <p className={`text-xs mb-1 ${sub}`}>This name is shown to others in chat lists, headers, and messages.</p>
        <select
          value={displayMode}
          onChange={(e) => setDisplayMode(e.target.value)}
          className={inp}
        >
          <option value="fullname">Full name</option>
          <option value="username">Username</option>
        </select>
      </div>

      {/* Gender */}
      <div>
        <label className={`text-xs mb-1 block ${sub}`}>Gender</label>
        <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className={inp}>
          <option value="">Prefer not to say</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Others">Others</option>
        </select>
      </div>

      {/* Mobile */}
      <div>
        <label className={`text-xs mb-1 block ${sub}`}>Mobile Number</label>
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+1 555 000 0000"
          className={inp}
        />
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
      </div>

      {/* Email (read-only) */}
      <div>
        <label className={`text-xs mb-1 block ${sub}`}>Email</label>
        <input value={profile.email || ''} disabled className={`${inp} opacity-60 cursor-not-allowed`} />
      </div>

      {/* Date of birth */}
      <div>
        <label className={`text-xs mb-1 block ${sub}`}>Date of Birth</label>
        <input
          type="date"
          value={form.date_of_birth}
          onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
          className={inp}
        />
      </div>

      {/* Country */}
      <div>
        <label className={`text-xs mb-1 block ${sub}`}>Country</label>
        <input
          value={form.country}
          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          placeholder="Country"
          className={inp}
        />
      </div>

      {/* About */}
      <div>
        <label className={`text-xs mb-1 block ${sub}`}>About</label>
        <textarea
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          rows={3}
          placeholder="Tell people about yourself…"
          className={`${inp} resize-none`}
        />
      </div>

      {/* Primary role */}
      <div>
        <label className={`text-xs mb-1 block ${sub}`}>Primary Role</label>
        <select
          value={isOtherRole ? 'Other' : form.primary_role}
          onChange={(e) => setForm((f) => ({ ...f, primary_role: e.target.value, custom_role: '' }))}
          className={inp}
        >
          <option value="">Select a role</option>
          {PRIMARY_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {(form.primary_role === 'Other' || isOtherRole) && (
          <input
            value={form.custom_role || (isOtherRole ? form.primary_role : '')}
            onChange={(e) => setForm((f) => ({ ...f, custom_role: e.target.value }))}
            placeholder="Describe your role…"
            className={`${inp} mt-2`}
          />
        )}
      </div>

      <button type="submit" disabled={saving}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50 transition-colors">
        {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}

// ─── main view ───────────────────────────────────────────────────────────────

const TERMS = `These Terms & Conditions govern your use of this platform. By using the service, you agree to comply with all applicable rules and policies. The platform reserves the right to modify, suspend, or terminate access for violations of these terms. All content shared on the platform remains the responsibility of the user who posted it. Disputes are subject to the jurisdiction of the platform's registered territory.`

const PRIVACY = `Your privacy is important to us. We collect only the information necessary to operate the service, including your name, email, and usage data. We do not sell your personal information to third parties. Data is stored securely and you may request deletion of your account and associated data at any time. Cookies may be used to improve your experience and are governed by our Cookie Policy.`

export default function SettingsView({ darkMode }) {
  const { logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [showBlocked, setShowBlocked] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)
  const dm = darkMode

  useEffect(() => {
    getMyProfile().then((d) => setProfile(d.user)).catch(() => {})
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleDeleteAccount() {
    setShowDeleteConfirm(false)
    setDeleting(true)
    try {
      await deleteAccount()
      logout()
    } catch {
      showToast('Could not delete account. Please try again.', 'error')
    }
    setDeleting(false)
  }

  if (!profile) return (
    <div className={`w-80 flex items-center justify-center border-r ${dm ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Icon helpers
  const icon = (path, extra = '') => (
    <svg className={`w-4 h-4 text-violet-500 shrink-0 ${extra}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  )

  return (
    <div className={`w-80 flex flex-col border-r overflow-y-auto ${dm ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-200 px-4 py-2 rounded-xl text-sm font-medium shadow-lg ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="px-4 pt-5 pb-2 shrink-0">
        <h2 className={`text-lg font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
      </div>

      <div className="px-4 pb-8">

        {/* ── ACCOUNT ── */}
        <SectionLabel darkMode={dm}>Account</SectionLabel>

        <CollapsibleBox
          title="Profile Info"
          darkMode={dm}
          icon={icon('M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z')}
          defaultOpen
        >
          <ProfileInfoForm profile={profile} darkMode={dm} onSaved={() => showToast('Profile saved.')} />
        </CollapsibleBox>

        <CollapsibleBox
          title="Website Verification"
          darkMode={dm}
          icon={icon('M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z')}
        >
          <WebsiteVerificationSection darkMode={dm} profile={profile} />
        </CollapsibleBox>

        <CollapsibleBox
          title="Social Profiles"
          darkMode={dm}
          icon={icon('M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1')}
        >
          <SocialLinksSection darkMode={dm} />
        </CollapsibleBox>

        {/* ── SECURITY ── */}
        <SectionLabel darkMode={dm}>Security</SectionLabel>

        <CollapsibleBox
          title="Password"
          darkMode={dm}
          icon={icon('M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z')}
        >
          <PasswordSection darkMode={dm} />
        </CollapsibleBox>

        <CollapsibleBox
          title="Two-Factor Authentication"
          darkMode={dm}
          icon={icon('M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z')}
        >
          <TwoFactorSection darkMode={dm} />
        </CollapsibleBox>

        {/* ── CHAT ── */}
        <SectionLabel darkMode={dm}>Chat</SectionLabel>
        <p className={`text-xs px-1 mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
          Chat preferences: clear or delete all conversations, and backup.
        </p>
        <div className={`rounded-2xl overflow-hidden mb-3 ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="px-4">
            <ChatSection darkMode={dm} />
          </div>
        </div>

        {/* ── NOTIFICATIONS ── */}
        <SectionLabel darkMode={dm}>Notifications</SectionLabel>
        <div className={`rounded-2xl overflow-hidden mb-3 ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="px-4">
            <NotificationsSection darkMode={dm} />
          </div>
        </div>

        {/* ── MANAGE DEVICE ── */}
        <SectionLabel darkMode={dm}>Manage Device</SectionLabel>

        <CollapsibleBox
          title="Device History"
          darkMode={dm}
          icon={icon('M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z')}
        >
          <DeviceSection darkMode={dm} />
        </CollapsibleBox>

        {/* ── OTHERS ── */}
        <SectionLabel darkMode={dm}>Others</SectionLabel>
        <div className={`rounded-2xl overflow-hidden mb-3 ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>

          <OthersBox
            darkMode={dm}
            title="Terms & Conditions"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            {TERMS}
          </OthersBox>

          <OthersBox
            darkMode={dm}
            title="Privacy Policy"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          >
            {PRIVACY}
          </OthersBox>

          <ArrowRow
            darkMode={dm}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            }
            label="Blocked Users"
            description="Manage blocked contacts"
            onClick={() => setShowBlocked(true)}
          />

          <ArrowRow
            darkMode={dm}
            danger
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
            label="Delete Account"
            description="Permanently remove your account"
            onClick={() => setShowDeleteConfirm(true)}
          />

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
              dm ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}
          >
            <svg className={`w-4 h-4 shrink-0 ${dm ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <div className="flex-1">
              <p className={`text-sm font-medium ${dm ? 'text-white' : 'text-gray-900'}`}>Logout</p>
              <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Sign out from this device</p>
            </div>
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </div>

      {/* Blocked contacts modal */}
      {showBlocked && <BlockedContactsModal darkMode={dm} onClose={() => setShowBlocked(false)} />}

      {/* Delete account confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        darkMode={dm}
        title="Delete Account?"
        message="This will permanently delete your account and all associated data. This action cannot be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete Account'}
        variant="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Logout confirmation */}
      <ConfirmDialog
        open={showLogoutConfirm}
        darkMode={dm}
        title="Log Out?"
        message="You will be signed out of this device."
        confirmLabel="Log Out"
        variant="warning"
        onConfirm={() => { setShowLogoutConfirm(false); logout() }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  )
}
