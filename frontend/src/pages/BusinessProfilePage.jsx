import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPublicBusiness } from '../api/businesses'
import { PENDING_DM_KEY } from '../utils/pendingDm'
import BusinessProfileView from '../components/business/BusinessProfileView'

// Same dotted background as the public profile and group-invite pages.
const SHARE_BG = {
  backgroundImage: 'radial-gradient(rgba(109,40,217,0.08) 1px, transparent 1px), radial-gradient(circle at 15% 10%, rgba(139,92,246,0.10), transparent 45%), radial-gradient(circle at 85% 90%, rgba(139,92,246,0.08), transparent 45%)',
  backgroundSize: '18px 18px, auto, auto',
}

export default function BusinessProfilePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [data, setData] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getPublicBusiness(slug)
      .then(setData)
      .catch((err) => { if (err.response?.status === 404) setNotFound(true) })
  }, [slug])

  useEffect(() => {
    if (!data?.business) return undefined
    const prev = document.title
    document.title = `${data.business.name} | Pulse`
    return () => { document.title = prev }
  }, [data?.business])

  // Same hand-off the personal profile page uses: remember who to open a chat with, then go
  // to /chat — through sign-in first if needed — where it's picked up once.
  function messageMember(member) {
    localStorage.setItem(PENDING_DM_KEY, member.username)
    navigate(authUser ? '/chat' : '/login?next=/chat')
  }

  // Matches the public profile page's header: same logo size, padding and link styling.
  const header = (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/how-it-works"><img src="/full-logo.png" alt="Pulse" className="h-8" /></Link>
        {authUser
          ? <Link to="/chat" className="text-sm text-violet-600 hover:underline font-medium">Go to App</Link>
          : <Link to={`/login?next=/b/${slug}`} className="text-sm text-violet-600 hover:underline font-medium">Sign In</Link>}
      </div>
    </header>
  )

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50" style={SHARE_BG}>
        {header}
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <h1 className="text-xl font-bold text-gray-900">Business not found</h1>
          <p className="mt-2 text-sm text-gray-500">This business profile doesn't exist or is no longer available.</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={SHARE_BG}>
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" style={SHARE_BG}>
      {header}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <BusinessProfileView
          business={data.business}
          team={data.team}
          viewerId={authUser?.id}
          onMessage={messageMember}
        />

        {!authUser && (
          <p className="mt-6 text-center text-sm text-gray-500">
            New here? <Link to="/signup" className="text-violet-600 font-medium hover:underline">Create a free account</Link>
          </p>
        )}
      </main>
    </div>
  )
}
