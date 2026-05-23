import { useAuth } from '../../context/AuthContext'

export default function WelcomeScreen({ darkMode }) {
  const { user } = useAuth()
  return (
    <div className={`flex-1 flex flex-col items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
      style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' }}
    >
      <div className={`rounded-2xl shadow-lg px-6 py-4 flex items-center gap-3 mb-4 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}>
        <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-bold">
          {(user?.full_name || user?.username || '?')[0].toUpperCase()}
        </div>
        <span className="font-semibold">Welcome! {user?.display_name || user?.full_name || user?.username}</span>
        <span>😊</span>
      </div>
      <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Choose a person or group to start chat with them.
      </p>
    </div>
  )
}
