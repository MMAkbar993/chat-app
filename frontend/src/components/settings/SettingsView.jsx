import { useState, useEffect } from 'react'
import { deleteAccount, deactivateAccount } from '../../api/users'
import { useAuth } from '../../context/AuthContext'
import BlockedContactsModal from '../contacts/BlockedContactsModal'
import ConfirmDialog from '../ui/ConfirmDialog'
import {
  ensureSocialOAuthListeners,
  getPlatformLabel,
  subscribeSocialOAuthResults,
} from '../../utils/socialOAuth'

// ─── helpers ────────────────────────────────────────────────────────────────

function SectionLabel({ children, darkMode }) {
  return (
    <p className={`px-4 mt-5 mb-2 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      {children}
    </p>
  )
}

function DocModal({ title, content, darkMode, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className="font-bold text-base">{title}</h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={`flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {content.split('\n\n').map((para, i) => (
            <p key={i} className="mb-4">{para}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

// A flat, Telegram-style row: colored icon badge + label + chevron.
// Highlights when it's the active/selected section.
function ListRow({ icon, label, description, active, onClick, darkMode, danger = false, dataTour }) {
  const dm = darkMode
  return (
    <button
      onClick={onClick}
      data-tour={dataTour}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b transition-colors ${
        dm ? 'border-gray-700' : 'border-gray-100'
      } ${
        active
          ? (dm ? 'bg-gray-800' : 'bg-violet-50')
          : (dm ? 'hover:bg-gray-800' : 'hover:bg-gray-50')
      }`}
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? 'text-red-500' : (dm ? 'text-white' : 'text-gray-900')}`}>{label}</p>
        {description && <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{description}</p>}
      </div>
      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

// ─── main list ───────────────────────────────────────────────────────────────

const TERMS = `These Terms & Conditions govern your use of this platform. By using the service, you agree to comply with all applicable rules and policies. The platform reserves the right to modify, suspend, or terminate access for violations of these terms. All content shared on the platform remains the responsibility of the user who posted it. Disputes are subject to the jurisdiction of the platform's registered territory.`

const PRIVACY = `Your privacy is important to us. We collect only the information necessary to operate the service, including your name, email, and usage data. We do not sell your personal information to third parties. Data is stored securely and you may request deletion of your account and associated data at any time. Cookies may be used to improve your experience and are governed by our Cookie Policy.`

export default function SettingsView({ darkMode, activeSection, onSelect, mobileHidden, onStartTour }) {
  const { logout } = useAuth()
  const [showBlocked, setShowBlocked] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showDoc, setShowDoc] = useState(null) // 'terms' | 'privacy'
  const [deleting, setDeleting] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [toast, setToast] = useState(null)
  const dm = darkMode

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    ensureSocialOAuthListeners()
    return subscribeSocialOAuthResults((data) => {
      if (data.type === 'social-connect-success') {
        const label = getPlatformLabel(data.platform)
        showToast(`${label} account connected successfully.`, 'success')
      } else if (data.type === 'social-connect-error') {
        showToast(data.reason || 'Could not connect account. Please try again.', 'error')
      }
    })
  }, [])

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

  async function handleDeactivateAccount() {
    setShowDeactivateConfirm(false)
    setDeactivating(true)
    try {
      await deactivateAccount()
      logout()
    } catch {
      showToast('Could not deactivate account. Please try again.', 'error')
    }
    setDeactivating(false)
  }

  // Icon helper — colored rounded-square badge (Telegram-style)
  const icon = (path, color = 'bg-violet-500') => (
    <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
      </svg>
    </span>
  )

  return (
    <div className={`w-full md:w-96 shrink-0 ${mobileHidden ? 'hidden md:flex' : 'flex'} flex-col border-r overflow-y-auto ${dm ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>

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

      <div className="pb-8">

        {/* ── ACCOUNT ── */}
        <SectionLabel darkMode={dm}>Account</SectionLabel>

        <ListRow
          darkMode={dm}
          active={activeSection === 'profile'}
          onClick={() => onSelect('profile')}
          icon={icon('M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', 'bg-red-500')}
          label="Profile Info"
        />

        <ListRow
          darkMode={dm}
          active={activeSection === 'website'}
          onClick={() => onSelect('website')}
          dataTour="settings-website"
          icon={icon('M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 'bg-blue-500')}
          label="Website Verification"
        />

        <ListRow
          darkMode={dm}
          active={activeSection === 'social'}
          onClick={() => onSelect('social')}
          dataTour="settings-social"
          icon={icon('M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', 'bg-pink-500')}
          label="Social Profiles"
        />

        {/* ── BILLING ── */}
        <SectionLabel darkMode={dm}>Billing</SectionLabel>
        <ListRow
          darkMode={dm}
          active={activeSection === 'billing'}
          onClick={() => onSelect('billing')}
          icon={icon('M3 10h18M7 15h1m4 0h1M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', 'bg-cyan-600')}
          label="Billing"
          description="Plan, payment method, invoices"
        />

        {/* ── SECURITY ── */}
        <SectionLabel darkMode={dm}>Security</SectionLabel>

        <ListRow
          darkMode={dm}
          active={activeSection === 'password'}
          onClick={() => onSelect('password')}
          icon={icon('M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', 'bg-slate-500')}
          label="Password"
        />

        <ListRow
          darkMode={dm}
          active={activeSection === 'twofa'}
          onClick={() => onSelect('twofa')}
          icon={icon('M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', 'bg-indigo-500')}
          label="Two-Factor Authentication"
        />

        {/* ── CHAT ── */}
        <SectionLabel darkMode={dm}>Chat</SectionLabel>
        <ListRow
          darkMode={dm}
          active={activeSection === 'chat'}
          onClick={() => onSelect('chat')}
          icon={icon('M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', 'bg-green-500')}
          label="Chat"
          description="Clear history, backup"
        />

        {/* ── NOTIFICATIONS ── */}
        <SectionLabel darkMode={dm}>Notifications</SectionLabel>
        <ListRow
          darkMode={dm}
          active={activeSection === 'notifications'}
          onClick={() => onSelect('notifications')}
          icon={icon('M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', 'bg-orange-500')}
          label="Notifications"
        />

        {/* ── MANAGE DEVICE ── */}
        <SectionLabel darkMode={dm}>Manage Device</SectionLabel>

        <ListRow
          darkMode={dm}
          active={activeSection === 'devices'}
          onClick={() => onSelect('devices')}
          icon={icon('M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', 'bg-amber-500')}
          label="Device History"
        />

        {/* ── OTHERS ── */}
        <SectionLabel darkMode={dm}>Other</SectionLabel>

        <ListRow
          darkMode={dm}
          icon={icon('M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 'bg-blue-500')}
          label="Terms & Conditions"
          onClick={() => setShowDoc('terms')}
        />

        <ListRow
          darkMode={dm}
          icon={icon('M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', 'bg-green-500')}
          label="Privacy Policy"
          onClick={() => setShowDoc('privacy')}
        />

        <ListRow
          darkMode={dm}
          active={activeSection === 'feedback'}
          onClick={() => onSelect('feedback')}
          icon={icon('M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', 'bg-violet-500')}
          label="Feedback & Support"
          description="Report an issue or request a feature"
        />

        {onStartTour && (
          <ListRow
            darkMode={dm}
            onClick={onStartTour}
            icon={icon('M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 'bg-teal-500')}
            label="Take a Tour"
            description="Replay the guided walkthrough"
          />
        )}

        <ListRow
          darkMode={dm}
          icon={icon('M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', 'bg-orange-500')}
          label="Blocked Users"
          description="Manage blocked contacts"
          onClick={() => setShowBlocked(true)}
        />

        <ListRow
          darkMode={dm}
          icon={icon('M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 'bg-orange-500')}
          label="Deactivate Account"
          description="Temporarily hide your profile from others"
          onClick={() => setShowDeactivateConfirm(true)}
        />

        <ListRow
          darkMode={dm}
          danger
          icon={icon('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', 'bg-red-500')}
          label="Delete Account"
          description="Permanently remove your account"
          onClick={() => setShowDeleteConfirm(true)}
        />

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
            dm ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
          }`}
        >
          {icon('M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1', 'bg-gray-500')}
          <div className="flex-1">
            <p className={`text-sm font-medium ${dm ? 'text-white' : 'text-gray-900'}`}>Logout</p>
            <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Sign out from this device</p>
          </div>
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

      </div>

      {/* Blocked contacts modal */}
      {showBlocked && <BlockedContactsModal darkMode={dm} onClose={() => setShowBlocked(false)} />}

      {/* Terms & Conditions / Privacy Policy modals */}
      {showDoc === 'terms' && (
        <DocModal title="Terms & Conditions" content={TERMS} darkMode={dm} onClose={() => setShowDoc(null)} />
      )}
      {showDoc === 'privacy' && (
        <DocModal title="Privacy Policy" content={PRIVACY} darkMode={dm} onClose={() => setShowDoc(null)} />
      )}

      {/* Deactivate account confirmation */}
      <ConfirmDialog
        open={showDeactivateConfirm}
        darkMode={dm}
        title="Deactivate Account?"
        message="You will be signed out and your profile will no longer appear to others. You can reactivate by logging back in."
        confirmLabel={deactivating ? 'Deactivating…' : 'Deactivate Account'}
        variant="warning"
        onConfirm={handleDeactivateAccount}
        onCancel={() => setShowDeactivateConfirm(false)}
      />

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
