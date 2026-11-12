import { Link } from 'react-router-dom'

// The decorations shared by every Christmas giveaway page and popup, so they all look the same.
// Purely visual: everything here is hidden from screen readers.

export const PULSE_LOGO = '/White Pulse Logo.png'
export const AR_LOGO = '/xmas-assets/ar-logo-santa.png'

// Snowflakes with random positions, made once when the page loads so they never jump.
const FLAKES = Array.from({ length: 42 }, (_, i) => ({
  id: i,
  style: {
    '--x': `${Math.random() * 100}%`,
    '--size': `${2 + Math.random() * 4}px`,
    '--dur': `${9 + Math.random() * 12}s`,
    '--delay': `${-Math.random() * 20}s`,
    '--drift': `${(Math.random() - 0.5) * 120}px`,
    opacity: 0.35 + Math.random() * 0.6,
  },
}))

export function Snow() {
  return <div className="xmas-snow" aria-hidden="true">{FLAKES.map((f) => <span key={f.id} className="xmas-flake" style={f.style} />)}</div>
}

// A string of warm lights along the bottom of the header.
export function Lights() {
  return <div className="xmas-lights" aria-hidden="true">{Array.from({ length: 30 }, (_, i) => <span key={i} className="xmas-bulb" />)}</div>
}

// A bauble hanging on a string and swinging gently.
export function Bauble({ className = '', tone = 'red', string = 'h-14', size = 'h-12 w-12', slow = false }) {
  return (
    <div className={`xmas-bauble pointer-events-none absolute top-0 flex flex-col items-center ${slow ? 'xmas-bauble-b' : ''} ${className}`} aria-hidden="true">
      <span className={`w-px bg-amber-200/70 ${string}`} />
      <span className="h-2 w-3 rounded-sm bg-linear-to-b from-amber-200 to-amber-500" />
      <span className={`xmas-ball-shadow relative rounded-full ${tone === 'gold' ? 'xmas-ball-gold' : 'xmas-ball-red'} ${size}`}>
        <span className="absolute left-[22%] top-[18%] h-[22%] w-[22%] rounded-full bg-white/60 blur-[1px]" />
      </span>
    </div>
  )
}

// The four baubles that hang from the top corners of every giveaway page.
export function CornerBaubles() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-56 overflow-hidden" aria-hidden="true">
      <Bauble className="left-[3%] hidden sm:flex" string="h-20" size="h-14 w-14" />
      <Bauble className="left-[11%] hidden md:flex" tone="gold" string="h-10" size="h-10 w-10" slow />
      <Bauble className="right-[3%] hidden sm:flex" tone="gold" string="h-16" size="h-14 w-14" slow />
      <Bauble className="right-[11%] hidden md:flex" string="h-28" size="h-10 w-10" />
      <Bauble className="left-[4%] flex sm:hidden" string="h-8" size="h-8 w-8" />
      <Bauble className="right-[4%] flex sm:hidden" tone="gold" string="h-12" size="h-8 w-8" slow />
    </div>
  )
}

// Snow lying along the top edge of a panel.
export function SnowCap({ className = '' }) {
  return (
    <svg className={`pointer-events-none absolute inset-x-0 top-0 h-7 w-full ${className}`} viewBox="0 0 400 28" preserveAspectRatio="none" aria-hidden="true">
      <path fill="#f8fafc" d="M0 0h400v10c-10 0-12 9-22 9s-12-6-22-6-10 12-22 12-12-9-24-9-10 6-22 6-12-8-22-8-12 11-24 11-10-7-22-7-12 5-22 5-10-9-22-9-12 12-24 12-12-8-22-8-10 6-22 6-12-10-24-10-10 8-22 8-12-5-22-5-10 9-22 9-12-7-24-7V0z" />
    </svg>
  )
}

// Snow drifts along the bottom of a popup or section.
export function SnowDrift({ className = '' }) {
  return (
    <svg className={`pointer-events-none absolute inset-x-0 bottom-0 w-full ${className}`} viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="xmas-drift" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe7f2" />
        </linearGradient>
      </defs>
      <path fill="url(#xmas-drift)" d="M0 22C40 6 80 8 120 20s70 14 110 4 70-18 110-8 50 14 60 10V40H0z" />
    </svg>
  )
}

// A wrapped present, optionally with a logo on the front.
export function GiftBox({ logo, alt = '', width = 180, className = '' }) {
  return (
    <div className={`xmas-gift ${className}`} style={{ '--w': `${width}px` }} aria-hidden={alt ? undefined : 'true'}>
      <div className="xmas-gift-bow" />
      <div className="xmas-gift-lid xmas-gift-snow" />
      <div className="xmas-gift-box">
        {logo && <img src={logo} alt={alt} className="max-h-[55%] max-w-[78%] object-contain opacity-95 drop-shadow" />}
      </div>
    </div>
  )
}

// "pulse × AFFILIATE ROULETTE", linking back to a page.
export function LogoLockup({ to = '/', label = 'Pulse home', compact = false }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded" aria-label={label}>
      <img src={PULSE_LOGO} alt="Pulse" className="h-7" />
      <span className="text-white/60" aria-hidden="true">×</span>
      <img src={AR_LOGO} alt="Affiliate Roulette" className="-mt-2 h-10 w-10" />
      {!compact && <span className="hidden text-xs font-bold uppercase tracking-[0.25em] text-white/90 md:inline">Affiliate Roulette</span>}
    </Link>
  )
}

// The page frame for the smaller giveaway pages (claim, terms): background, snow, baubles, header.
export function XmasShell({ children, back = '/christmas', backLabel = 'Back to the Christmas giveaway', right = null }) {
  return (
    <div className="xmas-page relative min-h-screen overflow-x-hidden text-white">
      <Snow />
      <header className="relative z-20 border-b border-amber-300/25">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <LogoLockup to={back} label={backLabel} />
          {right}
        </div>
        <Lights />
      </header>
      {/* The baubles hang from just under the header. */}
      <div className="relative">
        <CornerBaubles />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  )
}
