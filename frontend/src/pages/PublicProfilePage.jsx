import { useEffect, useRef, useState } from 'react'
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

const CHECK = 'M5 13l4 4L19 7'

const hostOf = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')
const hrefOf = (url) => (url.startsWith('http') ? url : `https://${url}`)

// About text up to this length fits on one line beside the social icons.
const SHORT_BIO = 55

export default function PublicProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: authUser, loading: authLoading } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [bioOpen, setBioOpen] = useState(false)
  // About text starts folded to 4 lines so one long bio cannot stretch the card. "Show more" only
  // appears when the text really is cut off at the current width: counting characters showed it
  // for bios that already fit, and clicking it changed nothing.
  const bioRef = useRef(null)
  const [bioCut, setBioCut] = useState(false)
  useEffect(() => {
    const el = bioRef.current
    if (!el || bioOpen) return
    const measure = () => setBioCut(el.scrollHeight > el.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [user?.bio, bioOpen])

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
  const subtitle = [role, user.country].filter(Boolean)
  const websites = user.verified_websites || []
  const repSites = user.rep_websites || []
  const socials = user.social_connections || []
  const hasLinks = websites.length > 0 || repSites.length > 0 || socials.length > 0
  // Short enough to sit on one line beside the icons (no websites to show, which need their own row).
  const inlineBio = Boolean(user.bio) && user.bio.length <= SHORT_BIO && !user.bio.includes('\n')
    && socials.length > 0 && websites.length === 0 && repSites.length === 0
  const socialIcons = socials.length > 0 && (
    <div className="flex items-center gap-2">
      {socials.map((sc) => {
        const meta = PLATFORM_META[sc.platform] || { label: sc.platform, color: '#6b7280', Icon: null }
        return (
          <a
            key={sc.platform}
            href={sc.profile_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            title={`${meta.label} (verified)`}
            aria-label={meta.label}
            className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:border-violet-300 flex items-center justify-center transition-colors"
          >
            {meta.img ? (
              <img src={meta.img} alt="" className="w-5 h-5 rounded object-cover" />
            ) : meta.Icon ? (
              <meta.Icon className="w-5 h-5" style={{ color: meta.color }} />
            ) : (
              <span className="w-5 h-5 rounded-full bg-gray-400" />
            )}
          </a>
        )
      })}
    </div>
  )

  const chip = 'inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-violet-300 hover:text-violet-700 transition-colors'

  return (
    <div className="min-h-screen bg-gray-50" style={SHARE_BG}>
      <header className="bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/">
            <img src="/full-logo.png" alt="Pulse" className="h-7" />
          </Link>
          {authUser
            ? <Link to="/chat" className="text-sm text-violet-600 hover:underline font-medium">Go to App</Link>
            : <Link to={`/login?next=/u/${username}`} className="text-sm text-violet-600 hover:underline font-medium">Sign In</Link>}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-8 sm:pt-12 pb-12">
        <div className="bg-white rounded-3xl shadow-xl shadow-violet-900/5 border border-gray-100 overflow-hidden">
          {/* Who they are. This alone is the whole card for someone who filled in nothing else,
              so it is laid out to stand on its own. */}
          <div className="relative px-6 pt-8 pb-7 text-center overflow-hidden bg-linear-to-b from-violet-100/70 via-violet-50/40 to-white">
            <div aria-hidden="true" className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-white/50" />
            <div aria-hidden="true" className="absolute -top-20 -right-24 w-80 h-80 rounded-full bg-violet-200/30" />

            <div className="relative mx-auto w-24 h-24">
              <div className={`w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg flex items-center justify-center text-white text-2xl font-bold ${user.avatar_url ? '' : 'bg-linear-to-br from-violet-500 to-fuchsia-500'}`}>
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={name} className="w-full h-full object-cover" />
                  : initials}
              </div>
              {user.is_verified && (
                <span title="Verified user" className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-violet-600 text-white ring-[3px] ring-white flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={CHECK} />
                  </svg>
                </span>
              )}
            </div>

            <h1 className="relative mt-3 text-2xl font-bold text-gray-900 tracking-tight">{name}</h1>
            <p className="relative text-sm text-gray-500">@{user.username}</p>
            {subtitle.length > 0 && (
              <p className="relative mt-1.5 text-[15px] font-medium text-violet-700">{subtitle.join(' · ')}</p>
            )}
            {user.status && <p className="relative mt-2 text-sm text-gray-500 italic">"{user.status}"</p>}

            {!isSelf && (
              <div className="relative mt-5">
                {/* Same gradient as the sign-in and registration buttons. */}
                <button
                  onClick={handleSendMessage}
                  disabled={authLoading}
                  className="inline-flex w-full sm:w-auto sm:min-w-72 items-center justify-center bg-linear-to-r from-sky-400 to-violet-600 hover:brightness-105 active:scale-[0.98] disabled:opacity-60 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                >
                  Send Message
                </button>
              </div>
            )}
          </div>

          {/* A one-line bio with only social icons: both on one row, so the card does not look
              empty. flex-wrap drops the icons underneath on a phone if they do not fit. */}
          {inlineBio && (
            <div className="px-6 sm:px-8 py-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
              <p className="text-[15px] leading-relaxed text-gray-700">{user.bio}</p>
              {socialIcons}
            </div>
          )}

          {/* Otherwise only what they filled in: a paragraph, then one row of links. */}
          {!inlineBio && (user.bio || hasLinks) && (
            <div className="px-6 sm:px-8 py-6 border-t border-gray-100 space-y-5">
              {user.bio && (
                <div>
                  <p ref={bioRef} className={`text-[15px] leading-relaxed text-gray-700 whitespace-pre-line ${bioOpen ? '' : 'line-clamp-4'}`}>
                    {user.bio}
                  </p>
                  {(bioCut || bioOpen) && (
                    <button onClick={() => setBioOpen((o) => !o)} className="mt-1 text-sm font-medium text-violet-600 hover:underline">
                      {bioOpen ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              )}

              {hasLinks && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Websites, then the social icons as one group: on a narrow screen the icons move to
                      the next line together instead of leaving one stranded. */}
                  {websites.map((w) => (
                    <a key={w.id} href={hrefOf(w.url)} target="_blank" rel="noopener noreferrer" title="Verified website" className={chip}>
                      <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={CHECK} />
                      </svg>
                      {hostOf(w.url)}
                    </a>
                  ))}
                  {repSites.map((w, i) => (
                    <a key={`rep-${i}`} href={hrefOf(w.url)} target="_blank" rel="noopener noreferrer" title="Verified representative" className={chip}>
                      <svg className="w-3.5 h-3.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={CHECK} />
                      </svg>
                      {hostOf(w.url)}
                      <span className="text-xs font-normal text-gray-400">Rep</span>
                    </a>
                  ))}
                  {socialIcons}
                </div>
              )}
            </div>
          )}

          {user.is_verified && (
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 text-center">
              <p className="text-sm text-gray-500 leading-relaxed">
                <span className="font-semibold text-gray-700">Your connections deserve confidence.</span>{' '}
                This member's identity has been verified through Pulse using a government-issued ID.
              </p>
            </div>
          )}
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
