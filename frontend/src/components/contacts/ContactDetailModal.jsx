import { useState, useEffect, useRef } from 'react'
import { getUserById, blockUser, unblockUser } from '../../api/users'
import ConfirmDialog from '../ui/ConfirmDialog'
import SocialIcon from '../ui/SocialIcon'
import { useSocket } from '../../context/SocketContext'

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
  const { socket } = useSocket()
  const [profile, setProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirm, setConfirm] = useState(null) // { type: 'block'|'unblock'|'delete' }
  const [blocked, setBlocked] = useState(false)
  const [toast, setToast] = useState(null)
  const menuRef = useRef(null)

  function refreshProfile(id) {
    getUserById(id).then((data) => {
      const u = data.user || data
      setProfile(u)
      if (u.is_blocked_by_me) setBlocked(true)
    }).catch(() => {})
  }

  useEffect(() => {
    if (!contact?.id) return
    refreshProfile(contact.id)
  }, [contact?.id])

  // Re-fetch profile when this contact's rep status is revoked (owner-initiated or self-initiated)
  useEffect(() => {
    if (!contact?.id) return
    function onRepStatusChanged({ detail: { userId } }) {
      if (userId === contact.id) refreshProfile(contact.id)
    }
    window.addEventListener('rep-status-changed', onRepStatusChanged)
    return () => window.removeEventListener('rep-status-changed', onRepStatusChanged)
  }, [contact?.id])

  useEffect(() => {
    if (!socket || !contact?.id) return
    function onRepRevoked({ requesterId }) {
      if (requesterId === contact.id) refreshProfile(contact.id)
    }
    socket.on('rep-revoked', onRepRevoked)
    return () => socket.off('rep-revoked', onRepRevoked)
  }, [socket, contact?.id])

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
  const verifiedWebsites = profile?.verified_websites || []
  const repWebsites = profile?.rep_websites || []
  const allWebsites = [
    ...verifiedWebsites.map((w) => ({ ...w, isOwner: true })),
    ...repWebsites.map((w) => ({ ...w, isOwner: false })),
  ]
  const bio      = contact.bio || profile?.bio
  const location = profile?.location || profile?.country
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  // Same field set/labels as the self-view profile popup (UserProfileModal), so the two never drift apart.
  const infoRows = [
    { label: 'Location', value: location },
    { label: 'Bio',      value: bio },
    { label: 'Joined',   value: joinDate },
  ].filter((r) => r.value)

  const overlay   = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50'
  const modal     = `relative w-[440px] max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`
  const sectionBg = darkMode ? 'bg-gray-800' : 'bg-gray-50'
  const lbl = `text-[10px] uppercase tracking-wide font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`
  const val = `text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`

  const socials = [
    { name: 'Facebook',          key: 'facebook',          url: profile?.facebook_url },
    { name: 'Twitter',           key: 'twitter',           url: profile?.twitter_url },
    { name: 'Instagram',         key: 'instagram',         url: profile?.instagram_url },
    { name: 'LinkedIn',          key: 'linkedin',          url: profile?.linkedin_url, linkedinWarning: true },
    { name: 'YouTube',           key: 'youtube',           url: profile?.youtube_url },
    { name: 'Kick',              key: 'kick',              url: profile?.kick_url },
    { name: 'Twitch',            key: 'twitch',            url: profile?.twitch_url },
    { name: 'Affiliate Roulette', key: 'affiliate_roulette', url: profile?.affiliate_roulette_url, urlOnly: true },
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

        {/* Menu + close — floating over the banner */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div className={`absolute right-0 top-10 w-44 rounded-xl shadow-lg z-10 py-1 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
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
          <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[90vh] overflow-y-auto">

          {/* Banner + avatar */}
          <div className={`h-16 ${darkMode ? 'bg-gradient-to-r from-violet-900 to-violet-700' : 'bg-gradient-to-r from-violet-500 to-violet-400'}`} />
          <div className="px-5 pb-5">
            <div className="-mt-10 mb-3 flex items-start justify-between">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 bg-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {avatar
                  ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                  : displayName[0].toUpperCase()}
              </div>
              <div className="flex items-center gap-2 mt-12">
                <button onClick={onChat} title="Chat"
                  className="w-9 h-9 rounded-full bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center transition-colors shadow">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
                <button onClick={() => onCall?.('audio')} title="Voice call"
                  className="w-9 h-9 rounded-full bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center transition-colors shadow">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button onClick={() => onCall?.('video')} title="Video call"
                  className="w-9 h-9 rounded-full bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center transition-colors shadow">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Name */}
            <p className="font-bold text-lg leading-tight">{displayName}</p>
            {blocked && <span className="text-xs text-orange-500 font-medium">Blocked</span>}

            <div className="mt-4 space-y-4">
              {/* Toast */}
              {toast && (
                <div className={`px-3 py-2 rounded-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {toast.msg}
                </div>
              )}

              {/* Info — same field set/labels as the self-view profile popup */}
              {infoRows.length > 0 && (
                <div className={`rounded-xl p-4 ${sectionBg}`}>
                  <div className="space-y-2">
                    {infoRows.map(({ label, value }) => (
                      <div key={label} className="min-w-0">
                        <p className={lbl}>{label}</p>
                        <p className={`${val} ${label === 'Bio' ? 'line-clamp-2' : 'truncate'}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Websites */}
              {allWebsites.length > 0 && (
                <div className={`rounded-xl p-4 ${sectionBg}`}>
                  <p className={`${lbl} mb-2`}>Websites</p>
                  <div className="space-y-1">
                    {allWebsites.map((w, i) => (
                      <a key={i} href={w.url.startsWith('http') ? w.url : `https://${w.url}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm font-medium text-violet-500 hover:underline break-all">
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          style={{ color: w.isOwner ? '#22c55e' : '#7C3AED' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {w.url.replace(/^https?:\/\//, '')}
                        {!w.isOwner && <span className={`text-xs ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(rep)</span>}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Social — icon-only row, only render if contact has at least one link */}
              {socials.some((s) => s.url) && (
              <div className={`rounded-xl p-4 ${sectionBg}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Social</p>
                <div className="flex flex-wrap gap-2">
                  {socials.filter((s) => s.url).map(({ name: sname, key, url, linkedinWarning }) => (
                    <a
                      key={sname}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={linkedinWarning ? 'LinkedIn does not allow full profile verification through third-party apps.' : sname}
                      className="hover:scale-105 transition-transform"
                    >
                      <SocialIcon platform={key} size={40} />
                    </a>
                  ))}
                </div>
              </div>
              )}
            </div>
          </div>
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
