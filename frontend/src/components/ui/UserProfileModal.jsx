import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getUserById, getMyProfile } from '../../api/users'
import client from '../../api/client'

const SOCIALS = [
  { key: 'facebook_url',  label: 'Facebook',  color: 'text-blue-600',  svg: <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /> },
  { key: 'twitter_url',   label: 'Twitter',   color: 'text-sky-500',   svg: <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" /> },
  { key: 'instagram_url', label: 'Instagram', color: 'text-pink-500',  svg: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></> },
  { key: 'linkedin_url',  label: 'LinkedIn',  color: 'text-blue-700',  svg: <><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></> },
  { key: 'youtube_url',   label: 'YouTube',   color: 'text-red-600',   svg: <><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></> },
]

export default function UserProfileModal({ userId, isSelf, isOnline, darkMode, onClose, onCallStart, onNav }) {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [selfSocials, setSelfSocials] = useState([])
  const backdropRef = useRef(null)

  useEffect(() => {
    if (isSelf) {
      getMyProfile().then((d) => setProfile(d.user)).catch(() => {})
      client.get('/users/me/social').then(({ data }) => setSelfSocials(data.connections || [])).catch(() => {})
    } else if (userId) {
      getUserById(userId).then((d) => setProfile(d.user || d)).catch(() => {})
    }
  }, [userId, isSelf])

  const dm = darkMode
  const name = profile?.display_name || profile?.full_name || profile?.username || authUser?.username || '?'
  const avatar = profile?.avatar_url

  const infoRows = [
    { label: 'Username',  value: profile?.username ? `@${profile.username}` : null },
    { label: 'Location',  value: profile?.location || profile?.country },
    { label: 'Bio',       value: profile?.bio },
    { label: 'Joined',    value: profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : null },
  ].filter((r) => r.value)

  const visibleSocials = isSelf
    ? SOCIALS.filter(({ key }) => selfSocials.some((c) => c.platform === key.replace('_url', '') && (c.profile_url || c.username)))
    : SOCIALS.filter(({ key }) => profile?.[key])

  function getSocialUrl(s) {
    if (isSelf) {
      const c = selfSocials.find((c) => c.platform === s.key.replace('_url', ''))
      return c?.profile_url || (c?.username ? `https://${c.platform}.com/${c.username}` : null)
    }
    return profile?.[s.key]
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === backdropRef.current) onClose() }}
    >
      <div className={`relative w-80 rounded-3xl shadow-2xl overflow-hidden ${dm ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>

        {/* Close */}
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Banner + avatar */}
        <div className={`h-20 ${dm ? 'bg-gradient-to-r from-violet-900 to-violet-700' : 'bg-gradient-to-r from-violet-500 to-violet-400'}`} />
        <div className="px-5 pb-4">
          <div className="-mt-10 mb-3 flex items-end justify-between">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 bg-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {avatar
                  ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                  : (name || '?')[0].toUpperCase()}
              </div>
              <span className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 ${dm ? 'border-gray-900' : 'border-white'} ${isOnline || (isSelf) ? 'bg-green-500' : 'bg-gray-400'}`} />
            </div>

            {/* Action buttons */}
            {!isSelf && onCallStart && (
              <div className="flex gap-2 mb-1">
                <button
                  onClick={() => { onCallStart('audio'); onClose() }}
                  className="w-9 h-9 rounded-full bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center transition-colors shadow"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button
                  onClick={() => { onCallStart('video'); onClose() }}
                  className="w-9 h-9 rounded-full bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center transition-colors shadow"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}
            {isSelf && onNav && (
              <button
                onClick={() => { onNav('profile'); onClose() }}
                className={`mb-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${dm ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Name + status */}
          <p className="font-bold text-lg leading-tight">{name}</p>
          {isSelf
            ? <p className="text-xs text-green-500 mb-3">Online</p>
            : <p className={`text-xs mb-3 ${isOnline ? 'text-green-500' : dm ? 'text-gray-500' : 'text-gray-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </p>
          }

          {/* Info rows */}
          {infoRows.length > 0 && (
            <div className={`rounded-2xl px-4 py-3 mb-3 space-y-2 ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
              {infoRows.map(({ label, value }) => (
                <div key={label}>
                  <p className={`text-[10px] uppercase tracking-wide font-semibold ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
                  <p className={`text-sm ${dm ? 'text-gray-200' : 'text-gray-800'}`}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Social profiles */}
          {visibleSocials.length > 0 && (
            <div className={`rounded-2xl px-4 py-3 ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p className={`text-[10px] uppercase tracking-wide font-semibold mb-2 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Social</p>
              <div className="flex flex-wrap gap-2">
                {visibleSocials.map((s) => {
                  const url = getSocialUrl(s)
                  return url ? (
                    <a
                      key={s.key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={s.label}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm hover:opacity-75 transition-opacity ${dm ? 'bg-gray-700' : 'bg-white'} ${s.color}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{s.svg}</svg>
                    </a>
                  ) : null
                })}
              </div>
            </div>
          )}

          {!profile && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
