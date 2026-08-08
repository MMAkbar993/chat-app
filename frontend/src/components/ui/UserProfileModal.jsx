import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getUserById, getMyProfile } from '../../api/users'
import client from '../../api/client'
import SocialIcon from './SocialIcon'
import VerifiedBadge from './VerifiedBadge'

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

const SOCIAL_PLATFORMS = [
  { name: 'Facebook',  key: 'facebook' },
  { name: 'Twitter',   key: 'twitter' },
  { name: 'Instagram', key: 'instagram' },
  { name: 'LinkedIn',  key: 'linkedin' },
  { name: 'YouTube',   key: 'youtube' },
  { name: 'Kick',      key: 'kick' },
  { name: 'Twitch',    key: 'twitch' },
  { name: 'Affiliate Roulette', key: 'affiliate_roulette' },
]
const OAUTH_KEYS = ['facebook', 'twitter', 'instagram', 'youtube', 'kick', 'twitch']

function getTagline(profile) {
  if (!profile) return null
  const industryRole = ROLE_LABELS[profile.primary_role] || profile.primary_role || null
  const hasCompanyAccess = profile.website_verified || profile.website_representation_approved
  if (hasCompanyAccess) {
    return profile.job_title || profile.company_name || industryRole
  }
  return industryRole
}

function InfoCell({ darkMode, label, value, full }) {
  if (!value) return null
  const labelCls = `text-[10px] uppercase tracking-wide font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`
  const valueCls = `text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`
  return (
    <div className={`min-w-0 ${full ? 'col-span-2' : ''}`}>
      <p className={labelCls}>{label}</p>
      <p className={`${valueCls} ${full ? 'break-words' : 'truncate'}`}>{value}</p>
    </div>
  )
}

export default function UserProfileModal({ userId, isSelf, isOnline, darkMode, onClose, onCallStart, onEditProfile }) {
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
  const tagline = getTagline(profile)
  const cardBg = dm ? 'bg-gray-800' : 'bg-gray-50'
  const lbl = `text-[10px] uppercase tracking-wide font-semibold ${dm ? 'text-gray-500' : 'text-gray-400'}`

  const location = profile?.location || profile?.country
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null
  const dob = profile?.date_of_birth
    ? new Date(profile.date_of_birth).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const verifiedWebsites = profile?.verified_websites || []
  const repWebsites = profile?.rep_websites || []
  const allWebsites = [
    ...verifiedWebsites.map((w) => ({ ...w, isOwner: true })),
    ...repWebsites.map((w) => ({ ...w, isOwner: false })),
  ]

  // Same social data, normalized whether we're looking at our own connections or another user's public columns.
  const socials = isSelf
    ? SOCIAL_PLATFORMS.map((s) => {
        const c = selfSocials.find((conn) => conn.platform === s.key)
        return { ...s, url: c?.profile_url || (c?.username ? `https://${s.key}.com/${c.username}` : null) }
      })
    : SOCIAL_PLATFORMS.map((s) => ({ ...s, url: profile?.[`${s.key}_url`] }))
  const oauthSocials = socials.filter((s) => OAUTH_KEYS.includes(s.key))

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === backdropRef.current) onClose() }}
    >
      <div className={`relative w-[440px] max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden ${dm ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>

        {/* Close */}
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="max-h-[85vh] overflow-y-auto">
        {/* Banner + avatar */}
        <div className={`h-16 ${dm ? 'bg-gradient-to-r from-violet-900 to-violet-700' : 'bg-gradient-to-r from-violet-500 to-violet-400'}`} />
        <div className="px-5 pb-5">
          <div className="-mt-10 mb-3 flex items-start justify-between">
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
              <div className="flex gap-2 mt-12">
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
            {isSelf && onEditProfile && (
              <button
                onClick={() => { onEditProfile(); onClose() }}
                className={`mt-12 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${dm ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Name + tagline */}
          <p className="font-bold text-lg leading-tight">{name}</p>
          {profile?.username && (
            <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>@{profile.username}</p>
          )}
          {tagline && <p className={`text-sm mb-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`} title={tagline}>{tagline}</p>}
          {isSelf
            ? <p className="text-xs text-green-500 mb-1">Online</p>
            : <p className={`text-xs mb-1 ${isOnline ? 'text-green-500' : dm ? 'text-gray-500' : 'text-gray-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </p>
          }
          {profile?.bio && (
            <p className={`text-sm mt-2 ${dm ? 'text-gray-300' : 'text-gray-600'}`}>{profile.bio}</p>
          )}

          {/* Verification badges */}
          {profile && (profile.kyc_status === 'verified' || profile.website_verified || profile.website_representation_approved || oauthSocials.some((s) => s.url)) && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.kyc_status === 'verified' && (
                <VerifiedBadge dm={dm} title="This user has completed identity verification before joining Pulse.">KYC Verified</VerifiedBadge>
              )}
              {profile.website_verified && (
                <VerifiedBadge dm={dm} title="This website was verified through a meta tag or approved company representation.">Website Verified</VerifiedBadge>
              )}
              {profile.website_representation_approved && (
                <VerifiedBadge dm={dm} title="This user has been approved to represent this company on Pulse.">Approved Rep</VerifiedBadge>
              )}
              {oauthSocials.some((s) => s.url) && (
                <VerifiedBadge dm={dm} title="This social profile was verified through secure OAuth login.">Socials Verified</VerifiedBadge>
              )}
            </div>
          )}

          {/* Personal Information — no email or username, ever */}
          <div className={`rounded-xl p-4 mt-3 mb-3 ${cardBg}`}>
            <p className={`${lbl} mb-3`}>Personal Information</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <InfoCell darkMode={dm} label="Local Time" value={localTime} />
              <InfoCell darkMode={dm} label="Company" value={profile?.company_name} />
              <InfoCell darkMode={dm} label="Job Title" value={profile?.job_title} />
              <InfoCell darkMode={dm} label="Location" value={location} />
              <InfoCell darkMode={dm} label="Date of Birth" value={dob} />
              <InfoCell darkMode={dm} label="Join Date" value={joinDate} />
            </div>
          </div>

          {/* Websites */}
          {allWebsites.length > 0 && (
            <div className={`rounded-xl p-4 mb-3 ${cardBg}`}>
              <p className={`${lbl} mb-2`}>Websites</p>
              <div className="space-y-1">
                {allWebsites.map((w, i) => (
                  <a
                    key={i}
                    href={w.url.startsWith('http') ? w.url : `https://${w.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-violet-500 hover:underline break-all"
                  >
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      style={{ color: w.isOwner ? '#22c55e' : '#7C3AED' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {w.url.replace(/^https?:\/\//, '')}
                    {!w.isOwner && <span className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>(rep)</span>}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Social profiles — icon-only row, only render if at least one link exists */}
          {socials.some((s) => s.url) && (
            <div className={`rounded-xl p-4 ${cardBg}`}>
              <p className={`${lbl} mb-2`}>Social</p>
              <div className="flex flex-wrap gap-2">
                {socials.filter((s) => s.url).map((s) => (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.name}
                    className="hover:scale-105 transition-transform"
                  >
                    <SocialIcon platform={s.key} size={40} />
                  </a>
                ))}
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
    </div>
  )
}
