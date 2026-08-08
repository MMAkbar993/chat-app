// White/bordered pill with a green checkmark — matches the public profile page's "Websites" list
// style rather than a filled color-per-type badge.
export default function VerifiedBadge({ dm, title, children }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 font-medium cursor-help border ${
        dm ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
      }`}
    >
      <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {children}
    </span>
  )
}
