import { useState, useEffect } from 'react'
import { getMyProfile } from '../../api/users'
import client from '../../api/client'
import SocialIcon from '../ui/SocialIcon'

const PLATFORMS = [
  { key: 'facebook',          label: 'Facebook' },
  { key: 'twitter',           label: 'X (Twitter)' },
  { key: 'linkedin',          label: 'LinkedIn',          noVerify: true },
  { key: 'instagram',         label: 'Instagram' },
  { key: 'youtube',           label: 'YouTube' },
  { key: 'kick',              label: 'Kick' },
  { key: 'twitch',            label: 'Twitch' },
  { key: 'affiliate_roulette', label: 'Affiliate Roulette', urlOnly: true },
]

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

const META = {
  info: {
    title: 'Profile Info', color: 'bg-red-500',
    path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
}

export default function ProfileDetailPanel({ darkMode, section }) {
  const dm = darkMode
  const [profile, setProfile] = useState(null)
  const [connections, setConnections] = useState([])

  useEffect(() => {
    if (!section) return
    getMyProfile().then((d) => setProfile(d.user)).catch(() => {})
    client.get('/users/me/social').then(({ data }) => setConnections(data.connections)).catch(() => {})
  }, [section])

  if (!section) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center h-full gap-3 ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <svg className={`w-12 h-12 ${dm ? 'text-gray-700' : 'text-gray-200'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
          <circle cx="12" cy="10" r="3" strokeWidth={1.5} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20.662V19a2 2 0 012-2h6a2 2 0 012 2v1.662" />
        </svg>
        <p className={`text-sm ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Select a section to get started</p>
      </div>
    )
  }

  const meta = META[section]

  const verifiedWebsites = profile?.verified_websites || []
  const repWebsites = profile?.rep_websites || []
  const allWebsites = [
    ...verifiedWebsites.map((w) => ({ ...w, isOwner: true })),
    ...repWebsites.map((w) => ({ ...w, isOwner: false })),
  ]

  const infoRows = [
    { label: 'Name',          value: profile?.display_name || profile?.full_name },
    { label: 'Username',      value: profile?.username ? `@${profile.username}` : null },
    { label: 'Email',         value: profile?.email },
    { label: 'Role',          value: ROLE_LABELS[profile?.primary_role] || profile?.primary_role },
    { label: 'Job Title',     value: profile?.job_title },
    { label: 'Company',       value: profile?.company_name },
    { label: 'Phone',         value: profile?.phone },
    { label: 'Gender',        value: profile?.gender },
    { label: 'Date of Birth', value: profile?.date_of_birth
        ? new Date(profile.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : null },
    { label: 'Location',      value: profile?.location || profile?.country },
    { label: 'Join Date',     value: profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : null },
  ]

  const card = `rounded-2xl ${dm ? 'bg-gray-900' : 'bg-white'}`
  const divider = `divide-y ${dm ? 'divide-gray-700' : 'divide-gray-100'}`
  const lbl = `text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`
  const val = `text-sm font-medium ${dm ? 'text-white' : 'text-gray-800'}`

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
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
        ) : (
          <div className="max-w-2xl mx-auto">

            {section === 'info' && (
              <>
                <div className="flex flex-col items-center py-2 mb-4">
                  <div className="relative w-20 h-20 mb-3">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white text-2xl font-bold">
                          {((profile?.display_name || profile?.full_name || '?')[0]).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <p className={`font-bold text-base ${dm ? 'text-white' : 'text-gray-900'}`}>
                    {profile.display_name || profile.full_name}
                  </p>
                  <p className={`text-sm text-center mt-1 px-4 ${profile.bio ? (dm ? 'text-gray-400' : 'text-gray-500') : (dm ? 'text-gray-600' : 'text-gray-300')}`}>
                    {profile.bio || 'Write something about yourself…'}
                  </p>
                </div>

                <div className={`${card} overflow-hidden`}>
                  <div className={divider}>
                    {infoRows.map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0">
                          <p className={lbl}>{label}</p>
                          <p className={`${val} ${!value ? (dm ? 'text-gray-600' : 'text-gray-300') : ''}`}>
                            {value || '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className={`text-xs font-semibold uppercase tracking-wide mt-5 mb-2 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Websites</p>
                <div className={`${card} p-4`}>
                  {allWebsites.length === 0 ? (
                    <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                      No verified websites yet. Verify one from Settings to display it here.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {allWebsites.map((w, i) => (
                        <a
                          key={i}
                          href={w.url.startsWith('http') ? w.url : `https://${w.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm font-medium text-violet-500 hover:underline break-all"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            style={{ color: w.isOwner ? '#22c55e' : '#7C3AED' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {w.url.replace(/^https?:\/\//, '')}
                          {!w.isOwner && <span className={`text-xs ml-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>(rep)</span>}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <p className={`text-xs font-semibold uppercase tracking-wide mt-5 mb-2 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Social Media</p>
                <div className={`${card} p-4`}>
                  {connections.length === 0 ? (
                    <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                      No social accounts connected yet. Connect them in Settings to display verified links on your profile.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {PLATFORMS.map((p) => {
                        const conn = connections.find((c) => c.platform === p.key)
                        if (!conn) return null
                        return (
                          <div key={p.key} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${dm ? 'bg-gray-700' : 'bg-gray-50 border border-gray-100'}`}>
                            <SocialIcon platform={p.key} size={28} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className={`text-sm font-medium whitespace-nowrap ${dm ? 'text-white' : 'text-gray-800'}`}>{p.label}</p>
                                {p.urlOnly ? (
                                  <span className="text-xs bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 font-medium leading-none">
                                    Connected
                                  </span>
                                ) : p.noVerify ? (
                                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium leading-none ${dm ? 'bg-gray-600 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                    Unverified
                                  </span>
                                ) : (
                                  <span className="text-xs bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 font-medium leading-none">
                                    Verified
                                  </span>
                                )}
                              </div>
                              {conn.username && (
                                <p className={`text-xs truncate mt-0.5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>@{conn.username}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
