import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-lavender flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <img src="/full-logo.png" alt="Connect" className="h-8 mx-auto mb-8" />

        <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome, {user?.full_name?.split(' ')[0]}!</h2>
        <p className="text-gray-500 text-sm mb-2">@{user?.username}</p>
        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          Account Active
        </span>

        <p className="text-gray-500 text-sm mb-8">
          Your account is verified and your subscription is active. The full chat interface is coming soon.
        </p>

        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
