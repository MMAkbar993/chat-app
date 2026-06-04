import { useState, useEffect } from 'react'
import { useChat } from '../../context/ChatContext'
import { useToast } from '../../context/ToastContext'
import { getUserById, blockUser, unblockUser, reportUser } from '../../api/users'
import ConfirmDialog from '../ui/ConfirmDialog'

function Section({ title, children, darkMode }) {
  return (
    <div className="mb-4">
      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
      {children}
    </div>
  )
}

function InfoRow({ label, value, darkMode }) {
  if (!value) return null
  return (
    <div className="mb-3">
      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{value}</p>
    </div>
  )
}

export default function ContactInfoPanel({ conversation, darkMode, onClose, onCallStart, isBlocked: isBlockedProp, onBlockChange, onSearch, isOnline }) {
  const { messages, toggleConversationFlag, removeConversation, conversations } = useChat()
  const { showToast } = useToast()
  const [profile, setProfile] = useState(null)
  const [localBlocked, setLocalBlocked] = useState(false)
  const [mediaTab, setMediaTab] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [lightboxUrl, setLightboxUrl] = useState(null)

  const isBlocked = isBlockedProp !== undefined ? isBlockedProp : localBlocked
  function setIsBlocked(val) {
    setLocalBlocked(val)
    onBlockChange?.(val)
  }
  const [showReportPrompt, setShowReportPrompt] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const convData = conversations.find((c) => c.id === conversation.id) || conversation
  const isFavorite = convData.is_favorite
  const isMuted = convData.is_muted
  const otherUserId = conversation.other_user_id

  useEffect(() => {
    if (!otherUserId) return
    getUserById(otherUserId).then((data) => setProfile(data.user || data)).catch(() => {})
  }, [otherUserId])

  const photos = messages.filter((m) => m.message_type === 'image' && m.media_url && !m.is_deleted)
  const videos = messages.filter((m) => m.message_type === 'video' && m.media_url && !m.is_deleted)
  const docs   = messages.filter((m) => m.message_type === 'file'  && m.media_url && !m.is_deleted)

  async function handleBlock() {
    if (!otherUserId) return
    try {
      if (isBlocked) {
        await unblockUser(otherUserId)
        setIsBlocked(false)
        showToast('User unblocked', 'success')
      } else {
        await blockUser(otherUserId)
        setIsBlocked(true)
        showToast('User blocked', 'warning')
      }
    } catch {}
  }

  async function handleReport() {
    if (!otherUserId) return
    try {
      await reportUser(otherUserId, reportReason)
      setShowReportPrompt(false)
      setReportReason('')
      showToast('Report submitted', 'success')
    } catch {}
  }

  const name = conversation.other_user_display_name || conversation.other_user_name || profile?.display_name || profile?.full_name || 'Unknown'
  const avatar = conversation.other_user_avatar || profile?.avatar_url

  const SOCIAL_DEFS = [
    { name: 'Facebook',  key: 'facebook_url',  color: 'text-blue-600',  svg: <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /> },
    { name: 'Twitter',   key: 'twitter_url',   color: 'text-sky-500',   svg: <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" /> },
    { name: 'Instagram', key: 'instagram_url', color: 'text-pink-500',  svg: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></> },
    { name: 'LinkedIn',  key: 'linkedin_url',  color: 'text-blue-700',  svg: <><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></> },
    { name: 'YouTube',   key: 'youtube_url',   color: 'text-red-600',   svg: <><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></> },
  ]
  const filteredSocials = profile ? SOCIAL_DEFS.filter(({ key }) => profile[key]) : []

  const panelBg = darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900'
  const cardBg  = darkMode ? 'bg-gray-800' : 'bg-gray-50'

  return (
    <div className={`w-72 border-l flex flex-col h-full overflow-y-auto ${panelBg}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} sticky top-0 z-10 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <span className="font-semibold text-sm">Contact Info</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 px-4 py-4">
        {/* Avatar + name */}
        <div className="flex flex-col items-center mb-5">
          <div className="relative w-20 h-20 mb-2">
            <div className="w-full h-full rounded-full overflow-hidden bg-violet-500 flex items-center justify-center text-white text-2xl font-bold">
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                : (name || '?')[0].toUpperCase()}
            </div>
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <p className="font-semibold text-base">{name}</p>
          {isOnline
            ? <p className="text-xs text-green-500">Online</p>
            : <p className="text-xs text-gray-400">Offline</p>
          }
        </div>

        {/* Action buttons */}
        <div className={`grid grid-cols-4 gap-2 mb-5 p-3 rounded-xl ${cardBg}`}>
          {[
            { label: 'Audio', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />, action: () => onCallStart?.('audio') },
            { label: 'Video', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />, action: () => onCallStart?.('video') },
            { label: 'Chat', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />, action: onClose },
            { label: 'Search', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />, action: () => { onSearch?.(); onClose() } },
          ].map(({ label, icon, action }) => (
            <button key={label} onClick={action} className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-sm`}>
                <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
              </div>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
            </button>
          ))}
        </div>

        {/* Profile Info */}
        <div className={`rounded-xl p-3 mb-4 ${cardBg}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Profile Info</p>
          <InfoRow label="Name"     value={name}                                        darkMode={darkMode} />
          <InfoRow label="Location" value={profile?.location || profile?.country}        darkMode={darkMode} />
          <InfoRow label="Join Date" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} darkMode={darkMode} />
          <InfoRow label="Bio"      value={profile?.bio}                                darkMode={darkMode} />
          {profile?.website && (
            <div className="mb-3">
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Website</p>
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm text-violet-500 hover:underline break-all`}
              >
                {profile.website}
              </a>
            </div>
          )}
        </div>

        {/* Social Profiles — only shown when the user has at least one connected account */}
        {filteredSocials.length > 0 && (
          <div className={`rounded-xl p-3 mb-4 ${cardBg}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Social Profiles</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {filteredSocials.map(({ name: sname, key, color, svg }) => (
                <a
                  key={sname}
                  href={profile[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={sname}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-sm ${color} hover:opacity-80 transition-opacity`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{svg}</svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Media Details */}
        <div className={`rounded-xl mb-4 overflow-hidden ${cardBg}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide px-3 pt-3 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Media Details</p>
          {[
            { key: 'photos',    label: 'Photos',    count: photos.length },
            { key: 'videos',    label: 'Videos',    count: videos.length },
            { key: 'links',     label: 'Links',     count: 0 },
            { key: 'documents', label: 'Documents', count: docs.length },
          ].map(({ key, label, count }) => (
            <div key={key}>
              <button
                onClick={() => setMediaTab(mediaTab === key ? null : key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm border-t transition-colors ${
                  darkMode ? 'border-gray-700 text-gray-200 hover:bg-gray-700' : 'border-gray-100 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{label}</span>
                <div className="flex items-center gap-1">
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{count}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${mediaTab === key ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              {mediaTab === key && key === 'photos' && photos.length > 0 && (
                <div className="grid grid-cols-3 gap-1 p-2">
                  {photos.slice(0, 9).map((m) => (
                    <button key={m.id} onClick={() => setLightboxUrl(m.media_url)} className="w-full h-16 overflow-hidden rounded focus:outline-none">
                      <img src={m.media_url} alt="" className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
              {mediaTab === key && key === 'documents' && docs.length > 0 && (
                <div className="px-3 pb-2 space-y-1">
                  {docs.map((m) => (
                    <a key={m.id} href={m.media_url} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-xs underline ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {m.media_url.split('/').pop()}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Others */}
        <div className={`rounded-xl overflow-hidden ${cardBg}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide px-3 pt-3 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Others</p>
          {[
            {
              label: isFavorite ? 'Remove Favourite' : 'Favourites',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
              action: () => {
                toggleConversationFlag(conversation.id, 'is_favorite')
                showToast(isFavorite ? 'Removed from favourites' : 'Added to favourites', 'success')
              },
              color: isFavorite ? 'text-red-500' : '',
            },
            {
              label: isMuted ? 'Unmute Notifications' : 'Mute Notifications',
              icon: isMuted
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
              action: () => toggleConversationFlag(conversation.id, 'is_muted'),
            },
            {
              label: isBlocked ? 'Unblock User' : 'Block User',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />,
              action: () => setConfirm({
                title: isBlocked ? 'Unblock User' : 'Block User',
                message: isBlocked
                  ? 'You will be able to receive messages from this user again.'
                  : 'This user will no longer be able to send you messages.',
                confirmLabel: isBlocked ? 'Unblock' : 'Block',
                variant: isBlocked ? 'warning' : 'danger',
                onConfirm: handleBlock,
              }),
              color: isBlocked ? 'text-orange-500' : '',
            },
            {
              label: 'Report User',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />,
              action: () => setShowReportPrompt(true),
            },
            {
              label: 'Delete Chat',
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
              action: () => setConfirm({
                title: 'Delete Chat',
                message: 'This will permanently delete this chat and all its messages.',
                confirmLabel: 'Delete',
                onConfirm: () => {
                  removeConversation(conversation.id)
                  showToast('Chat deleted', 'info')
                },
              }),
              color: 'text-red-500',
            },
          ].map(({ label, icon, action, color }) => (
            <button
              key={label}
              onClick={action}
              className={`w-full flex items-center justify-between px-3 py-3 text-sm border-t transition-colors ${
                darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-100'
              } ${color || (darkMode ? 'text-gray-200' : 'text-gray-700')}`}
            >
              <span>{label}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
            </button>
          ))}
        </div>
      </div>

      {/* Photo lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightboxUrl(null)}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Report prompt */}
      {showReportPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`w-72 rounded-2xl shadow-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Report User</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              className={`w-full rounded-xl px-3 py-2 text-sm outline-none resize-none mb-3 ${
                darkMode ? 'bg-gray-700 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-800 placeholder-gray-400'
              }`}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowReportPrompt(false)}
                className={`flex-1 py-2 rounded-xl text-sm ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                Cancel
              </button>
              <button onClick={handleReport}
                className="flex-1 py-2 rounded-xl text-sm bg-red-500 text-white hover:bg-red-600">
                Report
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant}
        onConfirm={() => { confirm?.onConfirm(); setConfirm(null) }}
        onCancel={() => setConfirm(null)}
        darkMode={darkMode}
      />
    </div>
  )
}
