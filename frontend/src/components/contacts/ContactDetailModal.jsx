import { useState, useEffect, useRef } from 'react'
import { getUserById, blockUser, unblockUser } from '../../api/users'
import ConfirmDialog from '../ui/ConfirmDialog'
import SocialIcon from '../ui/SocialIcon'

const ROLE_LABELS = {
  affiliate_publisher:  'Affiliate Publisher',
  casino_operator:      'Casino Operator',
  affiliate_manager:    'Affiliate Manager',
  game_provider:        'Game Provider',
  payment_provider:     'Payment Provider',
  platform_provider:    'Platform Provider',
  media_seo_agency:     'Media / SEO Agency',
  event_organizer:      'Event Organizer',
  influencer_streamer:  'Influencer / Streamer',
  investor_advisor:     'Investor / Advisor',
  compliance_legal:     'Compliance & Legal',
  kyc_aml_provider:     'KYC / AML Provider',
  other:                'Other',
}

function getTagline(profile) {
  if (!profile) return null
  const industryRole = ROLE_LABELS[profile.primary_role] || profile.primary_role || null
  const hasCompanyAccess = profile.website_verified || profile.website_representation_approved
  if (hasCompanyAccess && profile.job_title) {
    return profile.company_name
      ? `${profile.job_title} at ${profile.company_name}`
      : profile.job_title
  }
  return industryRole
}

export default function ContactDetailModal({
  contact,
  darkMode,
  onClose,
  onChat,
  onCall,
  onDelete,
  onEdit,
  onBlockToggle,
}) {
  const [profile, setProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirm, setConfirm] = useState(null) // { type: 'block'|'unblock'|'delete' }
  const [blocked, setBlocked] = useState(false)
  const [toast, setToast] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!contact?.id) return
    getUserById(contact.id).then((data) => {
      const u = data.user || data
      setProfile(u)
      if (u.is_blocked_by_me) setBlocked(true)
    }).catch(() => {})
  }, [contact?.id])

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  if (!contact) return null

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleConfirm() {
    const type = confirm?.type
    setConfirm(null)
    if (type === 'delete') {
      onDelete?.(contact)
      onClose()
    } else if (type === 'block') {
      try {
        await blockUser(contact.id)
        setBlocked(true)
        showToast(`${displayName} has been blocked.`)
        onBlockToggle?.(contact, true)
      } catch {
        showToast('Could not block user.', 'error')
      }
    } else if (type === 'unblock') {
      try {
        await unblockUser(contact.id)
        setBlocked(false)
        showToast(`${displayName} has been unblocked.`)
        onBlockToggle?.(contact, false)
      } catch {
        showToast('Could not unblock user.', 'error')
      }
    }
  }

  const displayName = contact.custom_first_name
    ? `${contact.custom_first_name} ${contact.custom_last_name || ''}`.trim()
    : contact.display_name || contact.full_name || contact.username || 'Unknown'
  const avatar   = contact.avatar_url || profile?.avatar_url
  const tagline  = getTagline(profile || contact)
  const website  = contact.website || profile?.website
  const bio      = contact.bio || profile?.bio
  const location = profile?.location || profile?.country
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null
  const dob = profile?.date_of_birth
    ? new Date(profile.date_of_birth).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const overlay   = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50'
  const modal     = `w-[440px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`
  const sectionBg = darkMode ? 'bg-gray-800' : 'bg-gray-50'
  const labelCls  = `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`
  const valueCls  = `text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`
  const noteCls   = `text-xs italic mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`

  function Row({ icon, label, value, link }) {
    if (!value) return null
    return (
      <div className="flex items-start gap-3 py-2">
        <span className="mt-0.5 text-gray-400">{icon}</span>
        <div>
          <p className={labelCls}>{label}</p>
          {link
            ? <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-violet-500 hover:underline break-all">{value}</a>
            : <p className={valueCls}>{value}</p>}
        </div>
      </div>
    )
  }

  const socials = [
    { name: 'Facebook',  key: 'facebook',  url: profile?.facebook_url },
    { name: 'Twitter',   key: 'twitter',   url: profile?.twitter_url },
    { name: 'Instagram', key: 'instagram', url: profile?.instagram_url },
    { name: 'LinkedIn',  key: 'linkedin',  url: profile?.linkedin_url, linkedinWarning: true },
    { name: 'YouTube',   key: 'youtube',   url: profile?.youtube_url },
    { name: 'Kick',      key: 'kick',      url: profile?.kick_url },
    { name: 'Twitch',    key: 'twitch',    url: profile?.twitch_url },
  ]

  const confirmMessages = {
    block: {
      title: 'Block User',
      message: 'Blocked contacts will no longer be able to call you or send you messages.',
      label: 'Block',
    },
    unblock: {
      title: 'Unblock User',
      message: 'Are you sure you want to unblock this user?',
      label: 'Unblock',
    },
    delete: {
      title: 'Delete Contact',
      message: 'Are you sure to delete the contact.',
      label: 'Delete',
      icon: true,
    },
  }

  return (
    <div className={overlay} onClick={onClose}>
      <div className={modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className="font-semibold text-base">Contact Detail</h2>
          <div className="flex items-center gap-1">
            {/* Three-dot menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>
              {menuOpen && (
                <div className={`absolute right-0 top-8 w-44 rounded-xl shadow-lg z-10 py-1 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                  <button
                    onClick={() => { setMenuOpen(false); onEdit?.(contact) }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Contact
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setConfirm({ type: blocked ? 'unblock' : 'block' }) }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left ${blocked ? 'text-green-500' : 'text-orange-500'} ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth={2} />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.93 4.93l14.14 14.14" />
                    </svg>
                    {blocked ? 'Unblock' : 'Block'}
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setConfirm({ type: 'delete' }) }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left text-red-500 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
            {/* Close */}
            <button onClick={onClose} className={`p-1 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">

          {/* Toast */}
          {toast && (
            <div className={`px-3 py-2 rounded-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {toast.msg}
            </div>
          )}

          {/* Contact card */}
          <div className={`rounded-xl p-4 ${sectionBg}`}>
            <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-violet-500 flex items-center justify-center text-white font-bold text-xl">
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                : displayName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base truncate">{displayName}</p>
              {tagline && <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} title={tagline}>{tagline}</p>}
              {blocked && <span className="text-xs text-orange-500 font-medium">Blocked</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={onChat} title="Chat"
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} shadow-sm text-violet-500 transition-colors`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button onClick={() => onCall?.('audio')} title="Voice call"
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} shadow-sm text-violet-500 transition-colors`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button onClick={() => onCall?.('video')} title="Video call"
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} shadow-sm text-violet-500 transition-colors`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            </div>

            {/* Verification badges — dedicated row below the header */}
            {profile && (profile.kyc_status === 'verified' || profile.website_verified || profile.website_representation_approved || socials.some((s) => s.url)) && (
              <div className={`flex flex-wrap gap-1.5 mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                {profile.kyc_status === 'verified' && (
                  <span title="This user has completed identity verification before joining Connect." className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium cursor-help">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    KYC Verified
                  </span>
                )}
                {profile.website_verified && (
                  <span title="This website was verified through a meta tag or approved company representation." className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium cursor-help">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Website Verified
                  </span>
                )}
                {profile.website_representation_approved && (
                  <span title="This user has been approved to represent this company on Connect." className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 font-medium cursor-help">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    Approved Rep
                  </span>
                )}
                {socials.some((s) => s.url) && (
                  <span title="This social profile was verified through secure OAuth login." className="inline-flex items-center gap-1 text-xs bg-pink-100 text-pink-700 rounded-full px-2 py-0.5 font-medium cursor-help">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    Social Verified
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className={`rounded-xl p-4 ${sectionBg}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Personal Information</p>
            <p className={noteCls}>This profile includes information verified through KYC, website verification, approved company representation, and connected social accounts.</p>
            <Row label="Local Time" value={localTime}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" /></svg>}
            />
            <Row label="Date of Birth" value={dob}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" /></svg>}
            />
            <Row label="Website" value={website} link={website ? (website.startsWith('http') ? website : `https://${website}`) : null}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
            />
            <Row label="Bio" value={bio}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            />
            <Row label="Location" value={location}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <Row label="Join Date" value={joinDate}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            />
          </div>

          {/* Social Information — only render if contact has at least one link */}
          {socials.some((s) => s.url) && (
          <div className={`rounded-xl p-4 ${sectionBg}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Social Information</p>
            <p className={noteCls}>Each social profile was verified through secure OAuth login on that platform.</p>
            <div className="space-y-3">
              {socials.filter((s) => s.url).map(({ name: sname, key, url, linkedinWarning }) => (
                <div key={sname} className="flex items-center gap-3">
                  <SocialIcon platform={key} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className={labelCls}>{sname}</p>
                      {linkedinWarning && (
                        <div className="relative group">
                          <svg className="w-3 h-3 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth={2} />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4M12 8h.01" />
                          </svg>
                          <div className="absolute left-4 bottom-4 w-52 bg-gray-900 text-white text-xs rounded-lg px-2 py-1.5 opacity-0 group-hover:opacity-100 pointer-events-none z-20 leading-tight">
                            LinkedIn does not allow full profile verification through third-party apps.
                          </div>
                        </div>
                      )}
                    </div>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-500 hover:underline break-all">{url}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Confirmation dialogs */}
      {confirm && (
        <ConfirmDialog
          open
          darkMode={darkMode}
          title={confirmMessages[confirm.type]?.title}
          message={
            confirm.type === 'delete' ? (
              <span className="flex flex-col items-center gap-2 text-center">
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {confirmMessages[confirm.type]?.message}
              </span>
            ) : confirmMessages[confirm.type]?.message
          }
          confirmLabel={confirmMessages[confirm.type]?.label}
          variant={confirm.type === 'unblock' ? 'warning' : 'danger'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
