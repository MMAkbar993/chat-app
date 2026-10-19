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
  twitter:            { label: 'X',                  color: '#000000', Icon: FaXTwitter },
  twitch:             { label: 'Twitch',             color: '#9147FF', Icon: FaTwitch },
  kick:               { label: 'Kick',               color: '#53FC18', Icon: SiKick },
  affiliate_roulette: { label: 'Affiliate Roulette', color: '#7C3AED', img: '/affiliate-roulette-icon.png' },
}

const ROLE_LABELS = {
  affiliate_publisher:          'Affiliate (Publisher)',
  affiliate_manager:            'Affiliate Manager',
  affiliate_network:            'Affiliate Network',
  business_development_sales:   'Business Development / Sales',
  casino_operator:               'Casino / Operator',
  compliance_legal:              'Compliance / Legal',
  data_odds_provider:            'Data / Odds Provider',
  entrepreneur:                  'Entrepreneur',
  event_organizer:               'Event Organizer',
  fraud_risk_provider:           'Fraud / Risk Provider',
  game_provider:                 'Game Provider',
  influencer_streamer:           'Influencer / Streamer',
  investor_advisor:              'Investor / Advisor',
  kyc_aml_provider:              'KYC / AML Provider',
  marketing_crm:                 'Marketing / CRM',
  media_seo_agency:              'Media / SEO Agency',
  payment_provider:              'Payment Provider',
  platform_provider:             'Platform Provider (White Label / Turnkey)',
  recruitment_talent:            'Recruitment / Talent',
  regulator_licensing:           'Regulator / Licensing',
  sportsbook_betting_provider:   'Sportsbook / Betting Provider',
  technology_software_provider:  'Technology / Software Provider',
}

// The same soft violet wash + dot texture as the group invite share page.
const SHARE_BG = {
  backgroundImage: 'radial-gradient(rgba(109,40,217,0.08) 1px, transparent 1px), radial-gradient(circle at 15% 10%, rgba(139,92,246,0.10), transparent 45%), radial-gradient(circle at 85% 90%, rgba(139,92,246,0.08), transparent 45%)',
  backgroundSize: '18px 18px, auto, auto',
}

const ICON = {
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  pin: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5 0 4.5-4 4.5-9S14.5 3 12 3 7.5 7 7.5 12s2 9 4.5 9zM3.5 9h17M3.5 15h17',
  building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  chat: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  shield: 'M9 12.75l1.5 1.5 3.75-3.75M12 3l7 3v5c0 4.5-3 8.25-7 9.5-4-1.25-7-5-7-9.5V6l7-3z',
}

function Icon({ d, className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  )
}

const hostOf = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')
const hrefOf = (url) => (url.startsWith('http') ? url : `https://${url}`)

// One fact everyone has, shown in the strip under the Send Message button. These three carry a
// profile that has nothing else filled in, so a new member's page still looks complete.
function Fact({ d, value, label, tone = 'text-violet-600 bg-violet-50' }) {
  return (
    <div className="flex flex-col items-center text-center gap-1.5 px-1">
      <span className={`w-10 h-10 rounded-full flex items-center justify-center ${tone}`}>
        <Icon d={d} className="w-5 h-5" />
      </span>
      <p className="text-sm font-semibold text-gray-900 leading-tight">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
    </div>
  )
}

// A Telegram-style info row: icon, the value, a small label under it. Rows only render when the
// member has filled the thing in, so a sparse profile has no empty headings.
function InfoRow({ d, children, label, href }) {
  const body = (
    <>
      <span className="w-9 h-9 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
        <Icon d={d} className="w-[18px] h-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] text-gray-900 break-words">{children}</div>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </>
  )
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3.5 px-5 py-3 hover:bg-gray-50 transition-colors">
      {body}
    </a>
  ) : (
    <div className="flex items-start gap-3.5 px-5 py-3">{body}</div>
  )
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={SHARE_BG}>
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-6 text-center" style={SHARE_BG}>
        <img src="/full-logo.png" alt="Pulse" className="h-8 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Profile not found</h1>
        <p className="text-gray-500">The user @{username} doesn't exist or their profile is private.</p>
        <Link to="/login" className="text-violet-600 hover:underline text-sm font-medium">Go to Sign In</Link>
      </div>
    )
  }

  const name = user.display_name || user.full_name
  const initials = (name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const role = user.primary_role
    ? ((user.primary_role === 'other' ? user.primary_role_other : ROLE_LABELS[user.primary_role]) || user.primary_role)
    : null
  const joined = user.joined ? new Date(user.joined).toLocaleDateString([], { month: 'short', year: 'numeric' }) : null
  const websites = user.verified_websites || []
  const repSites = user.rep_websites || []
  const socials = user.social_connections || []

  return (
    <div className="min-h-screen bg-gray-50" style={SHARE_BG}>
      <header className="bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/">
            <img src="/full-logo.png" alt="Pulse" className="h-7" />
          </Link>
          {authUser
            ? <Link to="/chat" className="text-sm text-violet-600 hover:underline font-medium">Go to App</Link>
            : <Link to={`/login?next=/u/${username}`} className="text-sm text-violet-600 hover:underline font-medium">Sign In</Link>}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-8 pb-12">
        <div className="bg-white rounded-3xl shadow-xl shadow-violet-900/5 border border-gray-100 overflow-hidden">
          {/* Identity: the round photo carries the page whatever else is filled in. */}
          <div className="relative pt-10 pb-6 px-6 text-center">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-violet-100/80 to-transparent" />
            <div className="relative mx-auto w-28 h-28">
              <div className={`w-28 h-28 rounded-full overflow-hidden ring-4 ring-white shadow-lg flex items-center justify-center text-white text-3xl font-bold ${user.avatar_url ? '' : 'bg-linear-to-br from-violet-500 to-fuchsia-500'}`}>
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={name} className="w-full h-full object-cover" />
                  : initials}
              </div>
              {user.is_verified && (
                <span title="ID verified" className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-violet-600 text-white ring-4 ring-white flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </div>

            <h1 className="relative mt-4 text-2xl font-bold text-gray-900 tracking-tight">{name}</h1>
            <p className="relative text-sm text-gray-500">@{user.username}</p>
            {role && <p className="relative mt-2 text-[15px] font-medium text-violet-700">{role}</p>}
            {user.status && <p className="relative mt-1 text-sm text-gray-500 italic">"{user.status}"</p>}

            {!isSelf && (
              <button
                onClick={handleSendMessage}
                disabled={authLoading}
                className="relative mt-5 w-full inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold py-3 rounded-2xl transition-colors shadow-lg shadow-violet-600/20"
              >
                <Icon d={ICON.chat} className="w-5 h-5" />
                Send Message
              </button>
            )}
          </div>

          {/* What every member has: verified, joined, where. */}
          <div className="grid grid-cols-3 gap-2 px-4 py-5 border-t border-gray-100">
            {user.is_verified
              ? <Fact d={ICON.check} value="Verified" label="Identity" tone="text-green-600 bg-green-50" />
              : <Fact d={ICON.info} value="Pending" label="Identity" tone="text-gray-400 bg-gray-50" />}
            {joined && <Fact d={ICON.calendar} value={joined} label="Joined" />}
            {user.country && <Fact d={ICON.pin} value={user.country} label="Country" />}
          </div>

          {/* Only what the member filled in. */}
          {(user.bio || websites.length > 0 || repSites.length > 0) && (
            <div className="border-t border-gray-100 py-2">
              {user.bio && (
                <InfoRow d={ICON.info} label="About">
                  <span className="whitespace-pre-line">{user.bio}</span>
                </InfoRow>
              )}
              {websites.map((w) => (
                <InfoRow key={w.id} d={ICON.globe} label="Verified website" href={hrefOf(w.url)}>
                  <span className="text-violet-700 font-medium">{hostOf(w.url)}</span>
                </InfoRow>
              ))}
              {repSites.map((w, i) => (
                <InfoRow key={`rep-${i}`} d={ICON.building} label="Verified representative of" href={hrefOf(w.url)}>
                  <span className="text-violet-700 font-medium">{hostOf(w.url)}</span>
                </InfoRow>
              ))}
            </div>
          )}

          {socials.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Verified accounts</p>
              <div className="flex flex-wrap gap-3">
                {socials.map((sc) => {
                  const meta = PLATFORM_META[sc.platform] || { label: sc.platform, color: '#6b7280', Icon: null }
                  return (
                    <a
                      key={sc.platform}
                      href={sc.profile_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={meta.label}
                      className="group flex flex-col items-center gap-1.5 w-16"
                    >
                      <span className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-gray-100 border border-gray-100 flex items-center justify-center transition-colors">
                        {meta.img ? (
                          <img src={meta.img} alt="" className="w-6 h-6 rounded object-cover" />
                        ) : meta.Icon ? (
                          <meta.Icon className="w-6 h-6" style={{ color: meta.color }} />
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-gray-400" />
                        )}
                      </span>
                      <span className="text-[11px] text-gray-500 truncate max-w-full">{meta.label}</span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* What "verified" means, for someone who arrived from a shared link. */}
          <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <Icon d={ICON.shield} className="w-4 h-4" />
            </span>
            <p className="text-xs text-gray-500 leading-relaxed">
              {user.is_verified
                ? <>Everyone on Pulse checks their identity with a government ID. The name above comes from {name.split(' ')[0]}'s ID.</>
                : <>Everyone on Pulse checks their identity with a government ID before they can message.</>}
            </p>
          </div>
        </div>

        {!isSelf && !authUser && (
          <p className="mt-5 text-center text-xs text-gray-400">
            New here? <Link to="/signup" onClick={() => localStorage.setItem(PENDING_DM_KEY, username)} className="text-violet-600 hover:underline">Create a free account</Link>
          </p>
        )}
      </main>
    </div>
  )
}
