// Small pieces shared by the marketing mockups: icon, initials avatar, verified badge,
// desktop window frame. Illustration only: no data, no behaviour.
import { P } from './mockupIcons'

export function I({ d, className = 'w-4 h-4', stroke = 2 }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} d={d} />
    </svg>
  )
}

export function Avatar({ name, color, className = 'w-8 h-8 text-[11px]' }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('')
  return (
    <span className={`rounded-full shrink-0 flex items-center justify-center font-bold text-white bg-linear-to-br ${color} ${className}`}>
      {initials}
    </span>
  )
}

export function Tick({ className = 'w-3.5 h-3.5' }) {
  return (
    <span className={`rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 ${className}`}>
      <I d={P.check} className="w-2/3 h-2/3" stroke={3.5} />
    </span>
  )
}

export function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 night:border-gray-700 bg-white night:bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-gray-700 night:text-gray-200">
      <I d={P.check} className="w-2.5 h-2.5 text-green-500" stroke={3} />
      {children}
    </span>
  )
}

export function WindowFrame({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-gray-200 night:border-gray-700 bg-white night:bg-gray-900 shadow-2xl shadow-violet-900/10 overflow-hidden ${className}`}>
      <div className="h-8 flex items-center gap-1.5 px-4 bg-[#1B1533]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
      </div>
      {children}
    </div>
  )
}
