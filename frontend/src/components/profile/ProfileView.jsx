import { useState, useEffect } from 'react'
import { getMyProfile, deactivateAccount } from '../../api/users'
import { useAuth } from '../../context/AuthContext'
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

function Toggle({ on, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${on ? 'bg-violet-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
        on ? 'translate-x-5' : 'translate-x-0.5'
      }`} />
    </button>
  )
}

export default function ProfileView({ darkMode }) {
  const { logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [connections, setConnections] = useState([])
  const [deactivating, setDeactivating] = useState(false)

  const dm = darkMode

  useEffect(() => {
    getMyProfile().then((d) => setProfile(d.user)).catch(() => {})
    client.get('/users/me/social').then(({ data }) => setConnections(data.connections)).catch(() => {})
  }, [])

  async function handleDeactivate() {
    if (!window.confirm('Deactivate your account? You will be signed out and your profile will no longer appear to others.')) return
    setDeactivating(true)
    try {
      await deactivateAccount()
      logout()
    } catch {
      setDeactivating(false)
    }
  }

  const hasVerified = connections.some((c) => c.platform !== 'linkedin' && c.platform !== 'affiliate_roulette')

  const infoRows = [
    { label: 'Name',      value: profile?.display_name || profile?.full_name },
    { label: 'Username',  value: profile?.username ? `@${profile.username}` : null },
    { label: 'Role',      value: profile?.primary_role },
    { label: 'Phone',     value: profile?.phone },
    { label: 'Gender',    value: profile?.gender },
    { label: 'Bio',       value: profile?.bio },
    { label: 'Location',  value: profile?.location || profile?.country },
    { label: 'Join Date', value: profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : null },
  ]

  const card = `rounded-2xl mb-3 ${dm ? 'bg-gray-800' : 'bg-gray-50'}`
  const divider = `divide-y ${dm ? 'divide-gray-700' : 'divide-gray-100'}`
  const lbl = `text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`
  const val = `text-sm font-medium ${dm ? 'text-white' : 'text-gray-800'}`
  const head = `text-sm font-bold mb-2 ${dm ? 'text-white' : 'text-gray-900'}`

  return (
    <div className={`w-80 flex flex-col border-r overflow-y-auto ${dm ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      {/* Title */}
      <div className="px-4 pt-5 pb-3 shrink-0">
        <h2 className={`text-lg font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Profile</h2>
      </div>

      {/* Avatar + name card */}
      <div className="flex flex-col items-center py-5 px-4 shrink-0">
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
          {profile ? (profile.display_name || profile.full_name) : 'Loading…'}
        </p>
        <p className={`text-sm text-center mt-1 px-4 ${profile?.bio ? (dm ? 'text-gray-400' : 'text-gray-500') : (dm ? 'text-gray-600' : 'text-gray-300')}`}>
          {profile?.bio || 'Write something about yourself…'}
        </p>
      </div>

      <div className="px-4 pb-6">
        {/* Profile Info */}
        <h3 className={head}>Profile Info</h3>
        <div className={`${card} overflow-hidden`}>
          <div className={divider}>
            {infoRows.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className={lbl}>{label}</p>
                  <p className={`${val} ${!value && profile ? (dm ? 'text-gray-600' : 'text-gray-300') : ''}`}>
                    {profile ? (value || '—') : 'Loading…'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Media — only show connected/verified accounts */}
        <h3 className={head}>Social Media</h3>
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
                  <div key={p.key} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${dm ? 'bg-gray-700' : 'bg-white border border-gray-100'}`}>
                    <SocialIcon platform={p.key} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-medium ${dm ? 'text-white' : 'text-gray-800'}`}>{p.label}</p>
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

        {/* Authorized Users */}
        <h3 className={head}>Authorized Users</h3>
        <div className={`${card} p-4`}>
          <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage representation requests for your verified websites.
          </p>
        </div>

        {/* Deactivate */}
        <h3 className={head}>Deactivate</h3>
        <div className={`${card} overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className={val}>Deactivate Account</p>
              <p className={lbl}>Deactivate your Account.</p>
            </div>
            <Toggle on={false} onClick={handleDeactivate} disabled={deactivating} />
          </div>
        </div>

        {/* Logout */}
        <h3 className={head}>Logout</h3>
        <div className={`${card} overflow-hidden`}>
          <button
            onClick={logout}
            className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
              dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <div>
              <p className={val}>Logout</p>
              <p className={lbl}>Sign out from this Device.</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
