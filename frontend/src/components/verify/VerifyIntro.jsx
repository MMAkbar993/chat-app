import { Link } from 'react-router-dom'
import { displayNameOptions } from '../../utils/displayName'

const CHECK = 'M5 13l4 4L19 7'

// The three things people worry about before handing over an ID, answered in order: who sees it,
// what others will see, and what is kept. Every line matches the code: Didit runs the check,
// kyc.service.js deletes it once verified, only the name and a tick are public, and the display
// name is chosen from parts of the ID name (utils/displayName.js).
const STEPS = [
  {
    title: 'Scan your ID and take a selfie',
    body: 'The check is done by Didit, our verification partner. Pulse never stores your ID.',
  },
  {
    title: 'You get a verified tick',
    body: 'Your name is taken from your ID, so people know they are talking to the real you.',
  },
  {
    title: 'Your ID is deleted',
    body: 'Once you are verified, your ID documents, selfie and verification data are permanently deleted.',
  },
]

function Tick({ className = 'w-4 h-4' }) {
  return (
    <span className={`rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 ${className}`}>
      <svg className="w-2/3 h-2/3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d={CHECK} />
      </svg>
    </span>
  )
}

// What other members will see once verified, drawn with the member's own name, and the ways
// they can choose to show it.
function WhatOthersSee({ name, username }) {
  const options = displayNameOptions(name).slice(0, 4)
  const shown = options[0] || 'Your name'
  const initials = shown.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">What other members see</p>
      <div className="mt-3 flex items-center gap-3 rounded-xl bg-white border border-gray-100 px-3 py-2.5">
        <span className="relative w-10 h-10 shrink-0 rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-bold flex items-center justify-center">
          {initials}
          <Tick className="absolute -bottom-0.5 -right-0.5 w-4 h-4 ring-2 ring-white" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{shown}</p>
          {username && <p className="text-xs text-gray-500 truncate">@{username}</p>}
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">That is all. Never your ID, its photo, your date of birth or your ID number.</p>

      {options.length > 1 && (
        <>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">You choose how your name appears</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {options.map((o, i) => (
              <span key={o} className={`rounded-full px-2.5 py-1 text-xs font-medium ${i === 0 ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {o}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">Pick any part of the name on your ID, such as just your first name, and change it any time in Settings.</p>
        </>
      )}
    </div>
  )
}

// The first screen of the identity check (pages/VerifyPage.jsx), before the member is sent to
// Didit. `user` is the signed-in member, for the name preview; `onStart` opens the check.
export default function VerifyIntro({ user, onStart }) {
  return (
    <>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Verify your identity</h2>
      <p className="text-gray-500 text-sm mb-6">
        Everyone on Pulse is verified, so you always know who you are talking to. It takes about 2 minutes.
      </p>

      <ol className="space-y-4 text-left mb-6">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="w-7 h-7 shrink-0 rounded-full bg-violet-50 text-violet-700 text-sm font-bold flex items-center justify-center">{i + 1}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{s.title}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <WhatOthersSee name={user?.full_name || user?.display_name} username={user?.username} />

      <p className="mt-5 text-xs text-gray-500">You will need a valid government-issued ID and a camera.</p>

      <button
        onClick={onStart}
        className="mt-3 w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
      >
        Start verification
      </button>
      <p className="mt-3 text-xs text-gray-400">
        Read our{' '}
        <Link to="/kyc-policy" target="_blank" className="text-violet-600 hover:underline">ID Verification Policy</Link>
        {' '}and{' '}
        <Link to="/privacy" target="_blank" className="text-violet-600 hover:underline">Privacy Policy</Link>
      </p>
    </>
  )
}
