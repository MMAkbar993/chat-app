const SECTIONS = [
  {
    key: 'info', label: 'Profile Info', color: 'bg-red-500',
    path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
]

function ListRow({ icon, color, label, active, onClick, darkMode }) {
  const dm = darkMode
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b transition-colors ${
        dm ? 'border-gray-700' : 'border-gray-100'
      } ${
        active
          ? (dm ? 'bg-gray-800' : 'bg-violet-50')
          : (dm ? 'hover:bg-gray-800' : 'hover:bg-gray-50')
      }`}
    >
      <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </span>
      <span className={`flex-1 text-sm font-medium ${dm ? 'text-white' : 'text-gray-900'}`}>{label}</span>
      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

export default function ProfileView({ darkMode, activeSection, onSelect }) {
  const dm = darkMode
  return (
    <div className={`w-96 flex flex-col border-r overflow-y-auto ${dm ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="px-4 pt-5 pb-2 shrink-0">
        <h2 className={`text-lg font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Profile</h2>
      </div>
      <div className="pb-8">
        {SECTIONS.map((s) => (
          <ListRow
            key={s.key}
            icon={s.path}
            color={s.color}
            label={s.label}
            active={activeSection === s.key}
            onClick={() => onSelect(s.key)}
            darkMode={dm}
          />
        ))}
      </div>
    </div>
  )
}
