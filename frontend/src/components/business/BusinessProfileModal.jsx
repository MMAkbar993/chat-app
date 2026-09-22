import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getPublicBusiness } from '../../api/businesses'
import { PENDING_DM_KEY } from '../../utils/pendingDm'
import BusinessProfileView from './BusinessProfileView'

// Inside the app, "View Business" opens the profile over the current screen rather than
// navigating away from a conversation. It's the same card the share link shows.
export default function BusinessProfileModal({ slug, onClose }) {
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
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-2 -right-2 z-10 w-9 h-9 rounded-full bg-white text-gray-600 hover:text-gray-900 shadow-lg flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {notFound ? (
          <div className="bg-white rounded-2xl p-10 text-center">
            <p className="font-bold text-gray-900">Business not found</p>
            <p className="mt-1 text-sm text-gray-500">This business profile is no longer available.</p>
          </div>
        ) : !data ? (
          <div className="bg-white rounded-2xl p-16 flex justify-center">
            <span className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <BusinessProfileView
            business={data.business}
            team={data.team}
            viewerId={authUser?.id}
            onMessage={messageMember}
            shareUrl={`${window.location.origin}/b/${data.business.slug}`}
          />
        )}
      </div>
    </div>
  )
}
