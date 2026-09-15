import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getInvitePreview, joinGroupByInvite } from '../api/groups'
import { PENDING_JOIN_KEY } from '../utils/pendingJoin'

// The landing page for a shared group link. Deliberately not wrapped in ProtectedRoute: a link
// is usually opened by someone who isn't signed in — often not even a member yet — and a bare
// redirect to /login would drop the code and leave them on a generic login screen with no idea
// what they were invited to. This shows what they're joining first, and carries the code
// through signup/login/KYC on the other side.
export default function JoinGroupPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [group, setGroup] = useState(null)
  const [alreadyMember, setAlreadyMember] = useState(false)
  const [error, setError] = useState('')
  const [fetched, setFetched] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    // Public endpoint — fetched regardless of sign-in state, so a signed-out visitor sees the
    // group's name/logo/member count too instead of a bare "you've been invited" with nothing
    // to show what it actually is.
    let cancelled = false
    getInvitePreview(code)
      .then((d) => {
        if (cancelled) return
        setGroup(d.group)
        setAlreadyMember(d.alreadyMember)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || 'This invite link is no longer valid.')
      })
      .finally(() => { if (!cancelled) setFetched(true) })
    return () => { cancelled = true }
  }, [code])

  const loading = authLoading || !fetched

  async function handleJoin() {
    setJoining(true)
    try {
      const { conversationId } = await joinGroupByInvite(code)
      // Landing in the group itself is the point of following the link.
      navigate(`/chat?conversation=${conversationId}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not join this group.')
      setJoining(false)
    }
  }

  function goSignIn(path) {
    try {
      localStorage.setItem(PENDING_JOIN_KEY, code)
    } catch {
      // Private mode — they'll just land in the app and can reopen the link.
    }
    navigate(path)
  }

  const groupAvatar = group && (
    <div className="w-16 h-16 rounded-2xl bg-violet-600 text-white flex items-center justify-center text-2xl font-bold overflow-hidden mx-auto mb-4 shrink-0">
      {group.avatarUrl
        ? <img src={group.avatarUrl} alt="" className="w-full h-full object-cover" />
        : (group.name || '?')[0].toUpperCase()}
    </div>
  )

  return (
    // A flat bg-gray-50 read as an unfinished/placeholder page for something meant to make a
    // first impression on someone who has never seen Pulse — the same soft violet wash + dot
    // texture used for the sponsored-ad card elsewhere in the app, kept subtle since this is
    // still a verification-adjacent business tool, not a marketing page.
    <div
      className="min-h-dvh flex flex-col bg-gray-50"
      style={{
        backgroundImage: 'radial-gradient(rgba(109,40,217,0.08) 1px, transparent 1px), radial-gradient(circle at 15% 10%, rgba(139,92,246,0.10), transparent 45%), radial-gradient(circle at 85% 90%, rgba(139,92,246,0.08), transparent 45%)',
        backgroundSize: '18px 18px, auto, auto',
      }}
    >
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <img src="/full-logo.png" alt="Pulse" className="h-8" />
          </Link>
          {user
            ? <Link to="/chat" className="text-sm text-violet-600 hover:underline font-medium">Go to App</Link>
            : <Link to={`/login?next=/join/${code}`} className="text-sm text-violet-600 hover:underline font-medium">Sign In</Link>
          }
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white shadow-xl p-8 text-center">
          {loading && (
            <div className="flex justify-center py-6">
              <div className="w-7 h-7 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && !user && !error && (
            <>
              {groupAvatar}
              <h1 className="text-lg font-bold text-gray-900">
                {group ? `You've been invited to join ${group.name}` : "You've been invited to a group"}
              </h1>
              {group && (
                <p className="text-sm text-gray-500 mt-1">
                  {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                  {group.adminsOnlyMessaging ? ' · Announcements' : ''}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Sign in to see the group and join. Pulse verifies every member&apos;s identity, so
                you&apos;ll need an account first.
              </p>
              <button
                onClick={() => goSignIn('/login')}
                className="w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
              >
                Sign in to join
              </button>
              <p className="text-xs text-gray-400 mt-3">
                New here?{' '}
                <button onClick={() => goSignIn('/signup')} className="text-violet-600 hover:underline">
                  Create a free account
                </button>
              </p>
            </>
          )}

          {!loading && error && (
            <>
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-gray-900">Invite link not valid</h1>
              <p className="text-sm text-gray-500 mt-2">{error}</p>
              <p className="text-xs text-gray-400 mt-2">
                The group admin may have revoked it. Ask them for a new one.
              </p>
              <Link
                to={user ? '/chat' : '/login'}
                className="inline-block w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
              >
                Go to Pulse
              </Link>
            </>
          )}

          {!loading && user && group && !error && (
            <>
              {groupAvatar}
              <h1 className="text-lg font-bold text-gray-900">{group.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                {group.adminsOnlyMessaging ? ' · Announcements' : ''}
              </p>
              {group.adminsOnlyMessaging && (
                <p className="text-xs text-gray-400 mt-2">
                  Only admins post in this group. You&apos;ll be able to read everything.
                </p>
              )}

              {alreadyMember ? (
                <Link
                  to={`/chat?conversation=${group.id}`}
                  className="inline-block w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
                >
                  You&apos;re already in — open it
                </Link>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full mt-6 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
                >
                  {joining ? 'Joining…' : 'Join group'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
