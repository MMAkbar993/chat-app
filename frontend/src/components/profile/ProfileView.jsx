import { useState, useEffect } from 'react'
import { getMyProfile } from '../../api/users'

export default function ProfileView({ darkMode, onEdit }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    getMyProfile().then((d) => setProfile(d.user)).catch(() => {})
  }, [])

  if (!profile) return (
    <div className={`w-80 flex items-center justify-center border-r ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const rows = [
    { label: 'Name', value: profile.display_name || profile.full_name, icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    )},
    { label: 'Username', value: profile.username, icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    )},
    { label: 'Role', value: profile.primary_role, icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    )},
    { label: 'Phone', value: profile.phone, icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    )},
    { label: 'Country', value: profile.country, icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    )},
  ]

  return (
    <div className={`w-80 flex flex-col border-r ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="px-4 pt-5 pb-3">
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Profile</h2>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center py-6">
        <div className="relative w-20 h-20 mb-3">
          <div className="w-full h-full rounded-full overflow-hidden">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white text-2xl font-bold">{(profile.display_name || profile.full_name || '?')[0].toUpperCase()}</div>}
          </div>
          <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        </div>
        <p className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{profile.display_name || profile.full_name}</p>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{profile.primary_role || 'web'}</p>
      </div>

      <div className="px-4 pb-2">
        <h3 className={`text-sm font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Profile Info</h3>
        <div className={`rounded-2xl overflow-hidden divide-y ${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-gray-50 divide-gray-100'}`}>
          {rows.filter((r) => r.value).map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{row.label}</p>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{row.value}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {row.icon}
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
