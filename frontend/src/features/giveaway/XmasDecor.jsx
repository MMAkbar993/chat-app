import { Link } from 'react-router-dom'

// The decorations shared by every Christmas giveaway page and popup, so they all look the same.
// Purely visual: everything here is hidden from screen readers. The artwork (gift boxes, pine
// branches, snow bank) is Affiliate Roulette's, in public/xmas-assets.

export const PULSE_LOGO = '/White Pulse Logo.png'
export const AR_LOGO = '/xmas-assets/ar-logo-santa.png'
export const GIFT_PULSE = '/xmas-assets/gift-pulse.webp'
export const GIFT_AR = '/xmas-assets/gift-ar.webp'
const PINE_LEFT = '/xmas-assets/pine-left.webp'
const PINE_RIGHT = '/xmas-assets/pine-right.webp'
const SNOW_BANK = '/xmas-assets/snow-strip.webp'

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

// Snowy pine branches with lights in the two top corners, swaying a little.
export function PineCorners() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-0" aria-hidden="true">
      <img src={PINE_LEFT} alt="" className="xmas-pine xmas-pine-l absolute -left-3 -top-4 w-[clamp(120px,24vw,360px)]" />
      <img src={PINE_RIGHT} alt="" className="xmas-pine xmas-pine-r absolute -right-3 -top-4 w-[clamp(120px,24vw,360px)]" />
    </div>
  )
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

// Swinging baubles just inside the pine branches (the branches carry their own baubles too).
export function CornerBaubles() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-56 overflow-hidden" aria-hidden="true">
      <Bauble className="left-[24%] hidden lg:flex" tone="gold" string="h-12" size="h-10 w-10" slow />
      <Bauble className="right-[24%] hidden lg:flex" string="h-20" size="h-10 w-10" />
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

// Snow drifts along the bottom of a popup.
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

// The snow bank the calendar sits in, the full width of the screen. Its flat bottom edge fades out.
export function SnowBank({ className = '' }) {
  return (
    <div className={`pointer-events-none absolute left-1/2 w-screen -translate-x-1/2 ${className}`} aria-hidden="true">
      <img src={SNOW_BANK} alt="" className="block h-20 w-full object-cover object-top mask-[linear-gradient(to_bottom,#000_55%,transparent)] sm:h-28 lg:h-32" />
    </div>
  )
}

// The present for a prize: the Pulse box for Pulse Pro, the Affiliate Roulette box for the rest.
export function PrizeGift({ prizeKey = '', className = '' }) {
  const pulse = prizeKey.startsWith('pro_')
  return <img src={pulse ? GIFT_PULSE : GIFT_AR} alt="" aria-hidden="true" className={`xmas-gift-img ${className}`} />
}

// The Pulse logo × the Affiliate Roulette logo, linking back to a page.
export function LogoLockup({ to = '/', label = 'Pulse home' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" aria-label={label}>
      <img src={PULSE_LOGO} alt="Pulse" className="h-7" />
      <span className="text-white/70" aria-hidden="true">×</span>
      <img src={AR_LOGO} alt="Affiliate Roulette" className="-mt-2 h-10 w-10" />
    </Link>
  )
}

// The page header: logos, buttons on the right, pine branches in the corners, lights underneath.
export function XmasHeader({ logoTo, logoLabel, right }) {
  return (
    <header className="relative z-20 border-b border-amber-300/25">
      <PineCorners />
      <div className="relative z-10 mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-4">
        <LogoLockup to={logoTo} label={logoLabel} />
        {right}
      </div>
      <Lights />
    </header>
  )
}

// The page frame for the smaller giveaway pages (claim, terms): background, snow, header, baubles.
export function XmasShell({ children, back = '/christmas', backLabel = 'Back to the Christmas giveaway', right = null }) {
  return (
    <div className="xmas-page relative min-h-screen overflow-x-hidden text-white">
      <Snow />
      <XmasHeader logoTo={back} logoLabel={backLabel} right={right} />
      {/* The baubles hang from just under the header. */}
      <div className="relative">
        <CornerBaubles />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  )
}
