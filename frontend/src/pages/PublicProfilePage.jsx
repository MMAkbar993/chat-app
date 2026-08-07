import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { FaFacebook, FaLinkedin, FaYoutube, FaInstagram, FaTwitch } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { SiKick } from 'react-icons/si'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { PENDING_DM_KEY } from '../utils/pendingDm'

const PLATFORM_META = {
  linkedin:           { label: 'LinkedIn',          color: '#0A66C2', Icon: FaLinkedin },
  youtube:            { label: 'YouTube',            color: '#FF0000', Icon: FaYoutube },
  facebook:           { label: 'Facebook',           color: '#1877F2', Icon: FaFacebook },
  instagram:          { label: 'Instagram',          color: '#E1306C', Icon: FaInstagram },
  twitter:            { label: 'X (Twitter)',        color: '#000000', Icon: FaXTwitter },
  twitch:             { label: 'Twitch',             color: '#9147FF', Icon: FaTwitch },
  kick:               { label: 'Kick',               color: '#53FC18', Icon: SiKick },
  affiliate_roulette: { label: 'Affiliate Roulette', color: '#7C3AED', img: '/affiliate-roulette-icon.png' },
}

const ROLE_LABELS = {
  affiliate_publisher:   'Affiliate Publisher',
  casino_operator:       'Casino Operator',
  affiliate_manager:     'Affiliate Manager',
  game_provider:         'Game Provider',
  payment_provider:      'Payment Provider',
  platform_provider:     'Platform Provider',
  media_seo_agency:      'Media / SEO Agency',
  event_organizer:       'Event Organizer',
  influencer_streamer:   'Influencer / Streamer',
  investor_advisor:      'Investor / Advisor',
  compliance_legal:      'Compliance & Legal',
  kyc_aml_provider:      'KYC / AML Provider',
  other:                 'Other',
}

export default function PublicProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: authUser, loading: authLoading } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    client.get(`/users/profile/${username}`)
      .then(({ data }) => setUser(data.user))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [username])

  function handleSendMessage() {
    localStorage.setItem(PENDING_DM_KEY, username)
    navigate(authUser ? '/chat' : '/login?next=/chat')
  }

  const isSelf = authUser && user && authUser.id === user.id

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <img src="/full-logo.png" alt="Pulse" className="h-8 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Profile not found</h1>
        <p className="text-gray-500">The user @{username} doesn't exist or their profile is private.</p>
        <Link to="/login" className="text-violet-600 hover:underline text-sm font-medium">Go to Sign In</Link>
      </div>
    )
  }

  const initials = (user.display_name || user.full_name || '?')[0]?.toUpperCase()
  const joinYear = user.joined ? new Date(user.joined).getFullYear() : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <img src="/full-logo.png" alt="Pulse" className="h-8" />
          </Link>
          {authUser
            ? <Link to="/chat" className="text-sm text-violet-600 hover:underline font-medium">Go to App</Link>
            : <Link to={`/login?next=/u/${username}`} className="text-sm text-violet-600 hover:underline font-medium">Sign In</Link>
          }
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-violet-600 to-violet-800" />

          {/* Avatar + name */}
          <div className="px-6 pb-6">
            <div className="flex items-end gap-5 -mt-12 mb-4">
              <div className="w-20 h-20 rounded-2xl border-4 border-white overflow-hidden shadow-md flex-shrink-0 bg-violet-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  : initials}
              </div>
              <div className="pb-1 mt-8">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    {user.display_name || user.full_name}
                  </h1>
                  {user.is_verified && (
                    <span title="KYC Verified" className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">@{user.username}</p>
              </div>
            </div>

            {/* Role + location */}
            <div className="flex flex-wrap gap-2 mb-4">
              {user.primary_role && (
                <span className="bg-violet-50 text-violet-700 rounded-full px-3 py-1 text-xs font-medium">
                  {ROLE_LABELS[user.primary_role] || user.primary_role}
                </span>
              )}
              {user.country && (
                <span className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-xs font-medium">
                  📍 {user.country}
                </span>
              )}
              {joinYear && (
                <span className="bg-gray-100 text-gray-500 rounded-full px-3 py-1 text-xs">
                  Member since {joinYear}
                </span>
              )}
              {user.is_verified && (
                <span title="This user has completed identity verification." className="inline-flex items-center gap-1 bg-green-50 text-green-700 rounded-full px-3 py-1 text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  KYC Verified
                </span>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-gray-600 text-sm leading-relaxed mb-5">{user.bio}</p>
            )}

            {/* Websites (owned + represented) */}
            {(user.verified_websites?.length > 0 || user.rep_websites?.length > 0) && (
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Websites</h2>
                <div className="flex flex-wrap gap-2">
                  {(user.verified_websites || []).map((w) => (
                    <a key={w.id} href={w.url.startsWith('http') ? w.url : `https://${w.url}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-violet-300 transition-colors text-sm text-gray-700 hover:text-gray-900"
                    >
                      <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{w.url.replace(/^https?:\/\//, '')}</span>
                    </a>
                  ))}
                  {(user.rep_websites || []).map((w, i) => (
                    <a key={`rep-${i}`} href={w.url.startsWith('http') ? w.url : `https://${w.url}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-violet-100 hover:border-violet-300 transition-colors text-sm text-gray-700 hover:text-gray-900"
                    >
                      <svg className="w-4 h-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{w.url.replace(/^https?:\/\//, '')}</span>
                      <span className="text-xs text-gray-400">(rep)</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Social connections */}
            {user.social_connections?.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Verified Accounts</h2>
                <div className="flex flex-wrap gap-2">
                  {user.social_connections.map((sc) => {
                    const meta = PLATFORM_META[sc.platform] || { label: sc.platform, color: '#6b7280', Icon: null }
                    return (
                      <a
                        key={sc.platform}
                        href={sc.profile_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-violet-300 transition-colors text-sm text-gray-700 hover:text-gray-900"
                      >
                        {meta.img ? (
                          <img src={meta.img} alt="" className="w-5 h-5 rounded object-cover" />
                        ) : meta.Icon ? (
                          <meta.Icon className="w-5 h-5 shrink-0" style={{ color: meta.color }} />
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-gray-400 shrink-0" />
                        )}
                        <span className="font-medium">{meta.label}</span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Connect CTA */}
        <div className="mt-6 flex flex-col items-center gap-3">
          {!isSelf && (
            <>
              <button
                onClick={handleSendMessage}
                disabled={authLoading}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Send Message
              </button>
              {!authUser && (
                <p className="text-xs text-gray-400">
                  New here? <Link to="/signup" onClick={() => localStorage.setItem(PENDING_DM_KEY, username)} className="text-violet-600 hover:underline">Create a free account</Link>
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
