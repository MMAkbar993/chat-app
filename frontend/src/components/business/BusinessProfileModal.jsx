import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getPublicBusiness } from '../../api/businesses'
import { PENDING_DM_KEY } from '../../utils/pendingDm'
import BusinessProfileView from './BusinessProfileView'

// Inside the app, "View Business" opens the profile over the current screen rather than
// navigating away from a conversation. It's the same card the share link shows.
export default function BusinessProfileModal({ slug, onClose, darkMode }) {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [data, setData] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    getPublicBusiness(slug)
      .then(setData)
      .catch((err) => { if (err.response?.status === 404) setNotFound(true) })
  }, [slug])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function messageMember(member) {
    localStorage.setItem(PENDING_DM_KEY, member.username)
    onClose()
    navigate('/chat')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="relative w-full max-w-2xl my-auto" onClick={(e) => e.stopPropagation()}>
        {notFound ? (
          <div className={`rounded-2xl p-10 text-center ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Business not found</p>
            <p className="mt-1 text-sm text-gray-500">This business profile is no longer available.</p>
          </div>
        ) : !data ? (
          <div className={`rounded-2xl p-16 flex justify-center ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <span className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <BusinessProfileView
            business={data.business}
            team={data.team}
            viewerId={authUser?.id}
            onMessage={messageMember}
            onBack={onClose}
            darkMode={darkMode}
            shareUrl={`${window.location.origin}/b/${data.business.slug}`}
          />
        )}
      </div>
    </div>
  )
}
