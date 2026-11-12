import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCopy, FiCheck, FiX } from 'react-icons/fi'
import { GiftBox, SnowDrift, AR_LOGO } from './XmasDecor'

// The wheel is only the show: the server has already decided the prize (see the backend's
// giveaway.service.js) before the wheel starts to turn, and the wheel lands on the slice that
// matches it. The slices are prize kinds, not single prizes, so the wheel stays readable.
// Clockwise from the top, as in the Affiliate Roulette design.
const SEGMENTS = [
  { kind: 'v10', label: '10% off', color: '#178a3c' },
  { kind: 'none', label: 'Try again', color: '#16294a' },
  { kind: 'promo', label: 'Free ads', color: '#c45a0e' },
  { kind: 'bigv', label: 'Big voucher', color: '#bd111b' },
  { kind: 'crypto', label: 'Crypto', color: '#0c7a8a' },
  { kind: 'mega', label: 'Mega prize', color: '#b8820c' },
  { kind: 'none', label: 'Try again', color: '#16294a' },
  { kind: 'v5', label: '5% off', color: '#c0141e' },
  { kind: 'pro', label: 'Pulse Pro', color: '#6a2bd6' },
]
const SLICE = 360 / SEGMENTS.length
// Slice i is centred on i * SLICE degrees (the first one straight up), with a thin gold line
// between slices.
const WHEEL_BG = `conic-gradient(from ${-SLICE / 2}deg, ${SEGMENTS.map((s, i) =>
  `${s.color} ${i * SLICE}deg ${(i + 1) * SLICE - 0.8}deg, #f5c451 ${(i + 1) * SLICE - 0.8}deg ${(i + 1) * SLICE}deg`).join(', ')})`
const RIM_BULBS = 18

export const CLAIM_PATH = '/claim'

function kindFor(result) {
  if (result.outcome !== 'prize' || !result.prize) return 'none'
  const { key, group } = result.prize
  if (group === 'mega') return 'mega'
  if (key === 'voucher_5') return 'v5'
  if (key === 'voucher_10') return 'v10'
  if (key.startsWith('voucher_')) return 'bigv'
  if (key.startsWith('pro_')) return 'pro'
  if (key.startsWith('eth_') || key.startsWith('btc_')) return 'crypto'
  return 'promo'
}

// A slice of that kind, picked at random when there are two (the "Try again" slices).
function sliceIndexFor(kind) {
  const matches = SEGMENTS.map((s, i) => (s.kind === kind ? i : -1)).filter((i) => i >= 0)
  return matches[Math.floor(Math.random() * matches.length)]
}

const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const SPIN_MS = REDUCED_MOTION ? 1300 : 5200

function Wheel({ rotation }) {
  return (
    <div className="relative mx-auto aspect-square w-[min(80vw,320px,40vh)] min-w-48">
      <div className="xmas-rim absolute inset-0 rounded-full" />
      <div className="absolute inset-[5%] overflow-hidden rounded-full shadow-[inset_0_0_18px_rgba(0,0,0,0.5)]">
        <div className="xmas-wheel absolute inset-0 rounded-full" style={{ background: WHEEL_BG, transform: `rotate(${rotation}deg)` }}>
          {/* Labels run along the slice and stay readable: from the centre out on the right half,
              from the rim in on the left half (as in the design). */}
          {SEGMENTS.map((s, i) => (
            <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * SLICE}deg)` }}>
              <span className={`absolute left-1/2 top-[6%] -translate-x-1/2 whitespace-nowrap text-[10px] font-extrabold uppercase text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] [writing-mode:vertical-rl] sm:text-[11px] ${i * SLICE < 180 ? 'rotate-180' : ''}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Bulbs around the rim; they twinkle but do not turn. */}
      {Array.from({ length: RIM_BULBS }, (_, i) => (
        <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * (360 / RIM_BULBS) + 10}deg)` }}>
          <span className={`xmas-rim-bulb absolute left-1/2 top-[0.8%] -translate-x-1/2 ${i % 2 ? 'xmas-rim-bulb-b' : ''}`} />
        </div>
      ))}
      <svg className="absolute left-1/2 -top-3 z-10 h-9 w-8 -translate-x-1/2 drop-shadow-[0_3px_3px_rgba(0,0,0,0.5)]" viewBox="0 0 32 36">
        <defs>
          <linearGradient id="xmas-pointer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff1b8" />
            <stop offset="1" stopColor="#d99a1b" />
          </linearGradient>
        </defs>
        <path d="M4 2h24a3 3 0 0 1 2.4 4.8L18.4 33a3 3 0 0 1-4.8 0L1.6 6.8A3 3 0 0 1 4 2z" fill="url(#xmas-pointer)" stroke="#8a5a06" strokeWidth="1" />
      </svg>
      <div className="xmas-hub absolute inset-[38%] flex items-center justify-center rounded-full text-2xl sm:text-3xl">🎄</div>
    </div>
  )
}

export default function SpinWheel({ day, onSpin, onClose, onDone }) {
  const [rotation, setRotation] = useState(0)
  const [phase, setPhase] = useState('ready') // ready | spinning | result | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && phase !== 'spinning') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, onClose])

  async function handleSpin() {
    setPhase('spinning')
    setError('')
    // Start turning at once so the tap feels instant; the answer arrives while it turns.
    setRotation((r) => r + 720)
    let res
    try {
      res = await onSpin()
    } catch (err) {
      setError(err.message)
      setPhase('error')
      return
    }
    const index = sliceIndexFor(kindFor(res))
    // Land somewhere inside the slice, not dead centre, so it does not look staged.
    const wobble = (Math.random() - 0.5) * SLICE * 0.6
    const target = 360 - (index * SLICE + wobble)
    setRotation((r) => {
      const base = r - (r % 360) + 360 * 5
      return base + target
    })
    timer.current = setTimeout(() => {
      setResult(res)
      setPhase('result')
      onDone?.(res)
    }, SPIN_MS)
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked: the code is on screen to copy by hand */ }
  }

  return (
    // The overlay scrolls, so on a short screen (a small laptop, a zoomed browser) the whole popup,
    // close button included, can still be reached. A click outside it closes it, except mid spin.
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Day ${day} spin`}>
      <div className="flex min-h-full items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget && phase !== 'spinning') onClose() }}>
        <div className="xmas-panel xmas-rays xmas-pop w-full max-w-md rounded-[1.75rem] px-5 pb-12 pt-6 sm:px-7">
          {phase !== 'spinning' && (
            <button type="button" onClick={onClose} aria-label="Close"
              className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/60 bg-black/25 text-white hover:bg-black/40">
              <FiX aria-hidden="true" />
            </button>
          )}
          <div className="relative z-10 text-center">
            <p className="xmas-eyebrow text-xs font-bold uppercase tracking-[0.25em] text-amber-300">Day {day} of 25</p>
            <h2 className="mt-1 text-3xl font-extrabold">Spin the Wheel</h2>

            {phase === 'result' && result ? (
              <ResultPanel result={result} copied={copied} onCopy={copyCode} onClose={onClose} />
            ) : (
              <>
                <div className="mt-6"><Wheel rotation={rotation} /></div>
                <div className="mt-6 min-h-16" aria-live="polite">
                  {phase === 'ready' && (
                    <button type="button" onClick={handleSpin} autoFocus
                      className="xmas-btn-gold w-full px-6 py-4 text-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200">
                      <span aria-hidden="true">🎁</span> Spin Now
                    </button>
                  )}
                  {phase === 'spinning' && <p className="pt-3 text-lg font-semibold text-amber-100">Good luck…</p>}
                  {phase === 'error' && (
                    <div>
                      <p className="text-amber-100">{error}</p>
                      <button type="button" onClick={onClose} className="xmas-btn-outline mt-4 px-6 py-2.5">Close</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <SnowDrift className="h-10" />
        </div>
      </div>
    </div>
  )
}

// "10% Off Voucher (Affiliate Roulette)" → the prize in gold, the note after it in white.
function PrizeName({ name }) {
  const cut = name.indexOf(' (')
  if (cut < 0) return <span className="xmas-gold-text">{name}</span>
  return <><span className="xmas-gold-text">{name.slice(0, cut)}</span>{name.slice(cut)}</>
}

function ResultPanel({ result, copied, onCopy, onClose }) {
  if (result.outcome === 'prize' && result.win) {
    return (
      <div className="xmas-pop">
        <div className="relative mx-auto mt-5 w-fit">
          <span className="absolute -left-6 top-2 text-xl" aria-hidden="true">✨</span>
          <span className="absolute -right-5 top-8 text-lg" aria-hidden="true">✨</span>
          <GiftBox width={150} />
        </div>
        <p className="mt-4 text-2xl font-extrabold leading-snug">You won <PrizeName name={result.prize.name} />!</p>
        <p className="mt-4 text-sm text-white/80">Your prize code</p>
        <button type="button" onClick={() => onCopy(result.win.code)} aria-label={`Copy prize code ${result.win.code}`}
          className="xmas-code-box mx-auto mt-1.5 flex items-center gap-3 rounded-xl px-5 py-2.5 font-mono text-xl font-bold tracking-widest text-amber-200 hover:bg-black/30">
          {result.win.code}
          {copied
            ? <span className="flex items-center gap-1 font-sans text-xs font-semibold tracking-normal text-emerald-300"><FiCheck aria-hidden="true" /> Copied</span>
            : <FiCopy className="text-white/80" aria-hidden="true" />}
        </button>
        <p className="mt-4 text-sm text-white/85">
          {result.finished
            ? 'Claim it on Pulse by 31 January 2027. That was your big prize, so your spins are done. Thanks for playing!'
            : 'Claim it on Pulse by 31 January 2027. Keep spinning every day for a bigger prize!'}
        </p>
        <Link to={`${CLAIM_PATH}?code=${encodeURIComponent(result.win.code)}`} className="xmas-btn-gold mt-5 w-full px-6 py-3.5 text-lg">
          <img src={AR_LOGO} alt="" className="-mt-1 h-7 w-7" /> Claim on Pulse
        </Link>
        <button type="button" onClick={onClose} className="xmas-btn-outline mt-3 w-full px-5 py-3 text-sm">
          Close (your code stays under My Prizes)
        </button>
      </div>
    )
  }
  const text = {
    duplicate: `You already have the ${result.prize?.name}, so today counts as no prize. Try again tomorrow!`,
    limit: `So close! ${result.prize?.name} has reached its limit for now. Try again tomorrow!`,
    none: 'No prize today. Come back tomorrow for another spin!',
  }[result.outcome] || 'No prize today. Come back tomorrow!'
  return (
    <div className="xmas-pop">
      <p className="mt-8 text-6xl" aria-hidden="true">❄️</p>
      <p className="mt-4 text-lg text-white/90">{text}</p>
      <button type="button" onClick={onClose} className="xmas-btn-outline mt-6 w-full px-5 py-3">Close</button>
    </div>
  )
}
