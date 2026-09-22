import { Link } from 'react-router-dom'

// The small card that points to a business profile: shown in business-name search results and
// on the owner's personal profile. "View Business" opens the same page a share link does.
export default function BusinessCard({ business, darkMode, onNavigate }) {
  const dm = darkMode
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-3 ${
      dm ? 'border-violet-500/30 bg-violet-500/10' : 'border-violet-100 bg-violet-50/60'
    }`}>
      <span className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-lg font-extrabold ${
        business.logo_url ? '' : dm ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-900 shadow-sm'
      }`}>
        {business.logo_url
          ? <img src={business.logo_url} alt="" className="w-full h-full object-cover" />
          : (business.name || '?')[0].toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{business.name}</p>
        <p className={`text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{business.domain}</p>
      </div>
      <Link
        to={`/b/${business.slug}`}
        onClick={onNavigate}
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
          dm ? 'border-violet-400/50 text-violet-300 hover:bg-violet-500/20' : 'border-violet-300 text-violet-700 bg-white hover:bg-violet-50'
        }`}
      >
        View Business
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  )
}
