import { useState, useEffect } from 'react'
import { getUserById } from '../../api/users'

export default function ContactDetailModal({ contact, darkMode, onClose, onChat, onCall }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!contact?.id) return
    getUserById(contact.id).then((data) => setProfile(data.user || data)).catch(() => {})
  }, [contact?.id])

  if (!contact) return null

  const name = contact.display_name || contact.full_name || contact.username || 'Unknown'
  const avatar = contact.avatar_url || profile?.avatar_url
  const role = contact.primary_role || profile?.primary_role || ''
  const phone = contact.phone || profile?.phone
  const email = contact.email || profile?.email
  const website = contact.website || profile?.website
  const localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const overlay = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50'
  const modal = `w-[420px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`
  const sectionBg = darkMode ? 'bg-gray-800' : 'bg-gray-50'
  const labelCls = `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`
  const valueCls = `text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`

  function Row({ icon, label, value }) {
    if (!value) return null
    return (
      <div className="flex items-start gap-3 py-2">
        <span className={`mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>{icon}</span>
        <div>
          <p className={labelCls}>{label}</p>
          <p className={valueCls}>{value}</p>
        </div>
      </div>
    )
  }

  const socials = [
    { name: 'Facebook',  color: 'text-blue-600',  url: profile?.facebook_url,  svg: <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /> },
    { name: 'Twitter',   color: 'text-sky-500',   url: profile?.twitter_url,   svg: <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" /> },
    { name: 'Instagram', color: 'text-pink-500',  url: profile?.instagram_url, svg: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></> },
    { name: 'LinkedIn',  color: 'text-blue-700',  url: profile?.linkedin_url,  svg: <><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></> },
    { name: 'YouTube',   color: 'text-red-600',   url: profile?.youtube_url,   svg: <><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></> },
  ]

  return (
    <div className={overlay} onClick={onClose}>
      <div className={modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className="font-semibold text-base">Contact Detail</h2>
          <button onClick={onClose} className={`p-1 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Contact card */}
          <div className={`rounded-xl p-4 flex items-center gap-4 ${sectionBg}`}>
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-violet-500 flex items-center justify-center text-white font-bold text-xl">
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                : name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base truncate">{name}</p>
              {role && <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{role}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onChat}
                title="Chat"
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} shadow-sm text-violet-500 transition-colors`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button
                onClick={() => onCall?.('audio')}
                title="Audio call"
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} shadow-sm text-violet-500 transition-colors`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button
                onClick={() => onCall?.('video')}
                title="Video call"
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} shadow-sm text-violet-500 transition-colors`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Personal Information */}
          <div className={`rounded-xl p-4 ${sectionBg}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Personal Information</p>
            <Row
              label="Local Time"
              value={localTime}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" /></svg>}
            />
            {profile?.date_of_birth && (
              <Row
                label="Date of Birth"
                value={new Date(profile.date_of_birth).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" /></svg>}
              />
            )}
            <Row
              label="Phone Number"
              value={phone}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
            />
            <Row
              label="Email"
              value={email}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            />
            {website && (
              <div className="flex items-start gap-3 py-2">
                <span className={`mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </span>
                <div>
                  <p className={labelCls}>Website Address</p>
                  <a
                    href={website.startsWith('http') ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-violet-500 hover:underline break-all"
                  >
                    {website}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Social Information */}
          <div className={`rounded-xl p-4 ${sectionBg}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Social Information</p>
            <div className="space-y-3">
              {socials.map(({ name: sname, color, url, svg }) => (
                <div key={sname} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-sm ${color} flex-shrink-0`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{svg}</svg>
                  </div>
                  <div>
                    <p className={labelCls}>{sname}</p>
                    {url
                      ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-500 hover:underline break-all">{url}</a>
                      : <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Not connected</p>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
