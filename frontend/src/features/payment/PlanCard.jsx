export default function PlanCard({ plan, selected, onSelect }) {
  const isYearly = plan === 'yearly'

  return (
    <button
      type="button"
      onClick={() => onSelect(plan)}
      className={`relative w-full rounded-2xl border-2 p-5 text-left transition-all duration-150 focus:outline-none
        ${selected
          ? 'border-violet-600 bg-violet-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-violet-300 hover:shadow-sm'
        }`}
    >
      {isYearly && (
        <span className="absolute -top-3 left-4 bg-green-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">
          2 Months Free
        </span>
      )}

      <div className="flex flex-col gap-1">
        <span className="font-bold text-gray-900 text-base">
          {isYearly ? 'Yearly' : 'Monthly'}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">
            {isYearly ? '€70.00' : '€6.99'}
          </span>
          <span className="text-sm text-gray-500">
            /{isYearly ? 'year' : 'month'}
          </span>
        </div>
        <span className="text-xs text-gray-400 mt-1">Auto-renewal. Cancel anytime.</span>
      </div>

      {selected && (
        <span className="absolute top-3 right-3 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </button>
  )
}
