// Display pieces of the website verification screen (WebsiteVerificationSection). No state and
// no API calls: everything they show arrives as props.
import { SUPPORT_MAILTO } from '../../config/site'

export function Illustration({ darkMode, badge, badgeColor, lockColor }) {
  return (
    <div className="relative w-36 h-28 shrink-0 hidden sm:block">
      <span className="absolute -top-2 left-2 w-2 h-2 rounded-full bg-pink-300" />
      <span className="absolute top-1 right-0 w-1.5 h-1.5 rounded-full bg-blue-300" />
      <span className="absolute bottom-4 -left-1 w-1.5 h-1.5 rounded-full bg-green-300" />
      <div className={`absolute left-2 top-4 w-32 h-20 rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100 shadow-md'}`}>
        <div className={`flex items-center gap-1 px-2 py-1.5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>
        <div className="p-2.5 space-y-1.5">
          <div className={`h-1.5 rounded w-3/4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
          <div className={`h-1.5 rounded w-1/2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
          <div className={`h-1.5 rounded w-2/3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
        </div>
      </div>
      <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${badgeColor}`}>
        {badge}
      </div>
      {lockColor && (
        <span className={`absolute bottom-1 right-1 w-7 h-7 rounded-full flex items-center justify-center border-[3px] ${darkMode ? 'border-gray-800' : 'border-white'} ${lockColor}`}>
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
      )}
    </div>
  )
}

// Section headings are what turn a stack of sibling cards into a page with an argument:
// what you own, who represents it, how it works. Same treatment as the Social Profiles
// group labels so the two settings pages feel like one product.
export function SectionLabel({ darkMode, children }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-wide pt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
      {children}
    </p>
  )
}

export function MethodCard({ darkMode, method, selected, onSelect }) {
  const admin = method.grant === 'admin'
  return (
    <button
      type="button"
      onClick={() => onSelect(method.key)}
      className={`flex-1 min-w-60 flex flex-col text-left rounded-2xl border p-4 transition-colors ${
        selected
          ? 'border-violet-500 ring-2 ring-violet-200'
          : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-violet-300'
      } ${darkMode ? 'bg-gray-800' : admin ? 'bg-violet-50/40' : 'bg-green-50/40'}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${
          admin
            ? darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-600'
            : darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-600'
        }`}>
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={method.icon} />
          </svg>
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-1 ${
          admin ? 'bg-violet-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {admin ? 'Admin Access' : 'Representative'}
        </span>
      </div>
      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{method.title}</p>
      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{method.blurb}</p>
      <ul className="mt-3 mb-4 space-y-1.5">
        {method.points.map((p) => (
          <li key={p} className={`flex gap-2 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <svg className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${admin ? 'text-violet-500' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {p}
          </li>
        ))}
      </ul>
      <span className={`mt-auto block w-full rounded-xl py-2.5 text-center text-sm font-semibold ${
        selected ? 'bg-violet-600 text-white' : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700 border border-gray-200'
      }`}>
        {method.action}
      </span>
    </button>
  )
}

export function WebsiteCard({ darkMode, url, verified, busy, onRemove, onContinue, onCancel }) {
  const host = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const card = `rounded-2xl border p-4 flex flex-col ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`
  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          verified
            ? darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'
            : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
        }`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${
          verified
            ? darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'
            : darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700'
        }`}>
          {verified ? (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {verified ? 'Verified' : 'Pending'}
        </span>
      </div>

      <p className={`text-base font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`} title={host}>{host}</p>
      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {verified ? 'Showing on your public profile' : 'Waiting for the tag to go live'}
      </p>

      <div className="mt-auto pt-3">
        {verified ? (
          <>
            <a
              href={url.startsWith('http') ? url : `https://${url}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100'
              }`}
            >
              Visit site
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <button
              onClick={onRemove}
              disabled={busy}
              className={`mt-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              {busy ? 'Checking…' : 'Remove website'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onContinue}
              className="w-full rounded-xl py-2.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
            >
              Continue setup
            </button>
            <button
              onClick={onCancel}
              disabled={busy}
              className={`mt-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              {busy ? 'Cancelling…' : 'Cancel verification'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
export function HelpCard({ darkMode }) {
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const card = `rounded-2xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`
  return (
    <div className={`${card} p-5 flex items-center justify-between gap-4 flex-wrap`}>
      <div>
        <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Need help?</p>
        <p className={`text-xs mt-0.5 ${sub}`}>If you believe this is an error or have any questions, contact our support team.</p>
      </div>
      <a
        href={SUPPORT_MAILTO}
        className={`text-xs font-semibold border rounded-xl px-4 py-2 transition-colors shrink-0 ${
          darkMode
            ? 'bg-violet-600 border-violet-600 text-white hover:bg-violet-500'
            : 'text-violet-600 border-violet-200 hover:bg-violet-50'
        }`}
      >
        Contact Support
      </a>
    </div>
  )
}
