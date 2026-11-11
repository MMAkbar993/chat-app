import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// The wheel is only the show: the server has already decided the prize (see the backend's
// giveaway.service.js) before the wheel starts to turn, and the wheel lands on the slice that
// matches it. The slices are prize kinds, not single prizes, so the wheel stays readable.
const SEGMENTS = [
  { kind: 'none', label: 'Try again', color: '#16304f' },
  { kind: 'v5', label: '5% off', color: '#b91c1c' },
  { kind: 'pro', label: 'Pulse Pro', color: '#6d28d9' },
  { kind: 'v10', label: '10% off', color: '#15803d' },
  { kind: 'none', label: 'Try again', color: '#16304f' },
  { kind: 'promo', label: 'Free ads', color: '#b45309' },
  { kind: 'bigv', label: 'Big voucher', color: '#be123c' },
  { kind: 'crypto', label: 'Crypto', color: '#0e7490' },
  { kind: 'mega', label: 'Mega prize', color: '#a16207' },
]
const SLICE = 360 / SEGMENTS.length
const WHEEL_BG = `conic-gradient(${SEGMENTS.map((s, i) => `${s.color} ${i * SLICE}deg ${(i + 1) * SLICE}deg`).join(', ')})`

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
    const target = 360 - (index * SLICE + SLICE / 2 + wobble)
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Day ${day} spin`}>
      <div className="flex min-h-full items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget && phase !== 'spinning') onClose() }}>
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0d2138] p-5 sm:p-6 text-white shadow-2xl xmas-pop">
        {phase !== 'spinning' && (
          <button type="button" onClick={onClose} aria-label="Close"
            className="absolute right-4 top-4 h-9 w-9 rounded-full bg-white/10 text-lg leading-none hover:bg-white/20">×</button>
        )}
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Day {day} of 25</p>
        <h2 className="mt-1 text-center text-2xl font-bold">Spin the wheel</h2>

        <div className="relative mx-auto mt-4 sm:mt-6 aspect-square w-[min(78vw,300px,38vh)] min-w-44">
          {/* pointer */}
          <div className="absolute left-1/2 -top-1 z-10 -translate-x-1/2 h-0 w-0 border-x-[14px] border-t-[24px] border-x-transparent border-t-amber-300 drop-shadow" aria-hidden="true" />
          <div
            className="xmas-wheel absolute inset-0 rounded-full border-[6px] border-amber-300/90 shadow-[0_0_40px_rgba(250,204,21,0.35)]"
            style={{ background: WHEEL_BG, transform: `rotate(${rotation}deg)` }}
            aria-hidden="true"
          >
            {SEGMENTS.map((s, i) => (
              <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * SLICE + SLICE / 2}deg)` }}>
                <span className="absolute left-1/2 top-[9%] -translate-x-1/2 whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-white drop-shadow [writing-mode:vertical-rl]">
                  {s.label}
                </span>
              </div>
            ))}
            <div className="absolute inset-[38%] rounded-full bg-[#0d2138] border-4 border-amber-300 flex items-center justify-center text-2xl">🎄</div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 min-h-28 text-center" aria-live="polite">
          {phase === 'ready' && (
            <button type="button" onClick={handleSpin} autoFocus
              className="w-full rounded-2xl bg-linear-to-r from-red-600 to-amber-500 px-6 py-4 text-lg font-bold shadow-lg hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">
              Spin now
            </button>
          )}
          {phase === 'spinning' && <p className="pt-4 text-white/70">Good luck…</p>}
          {phase === 'error' && (
            <div>
              <p className="text-red-300">{error}</p>
              <button type="button" onClick={onClose} className="mt-4 rounded-xl bg-white/10 px-5 py-2.5 font-semibold hover:bg-white/20">Close</button>
            </div>
          )}
          {phase === 'result' && result && <ResultPanel result={result} copied={copied} onCopy={copyCode} onClose={onClose} />}
        </div>
      </div>
      </div>
    </div>
  )
}

function ResultPanel({ result, copied, onCopy, onClose }) {
  if (result.outcome === 'prize' && result.win) {
    return (
      <div className="xmas-pop">
        <p className="text-3xl">🎉</p>
        <p className="mt-1 text-xl font-bold">You won {result.prize.name}!</p>
        <p className="mt-3 text-sm text-white/70">Your prize code</p>
        <button type="button" onClick={() => onCopy(result.win.code)}
          className="mt-1 inline-flex items-center gap-2 rounded-xl border border-dashed border-amber-300/70 bg-white/5 px-4 py-2 font-mono text-lg font-bold tracking-widest text-amber-200 hover:bg-white/10">
          {result.win.code}
          <span className="text-xs font-sans font-semibold tracking-normal text-white/70">{copied ? 'Copied' : 'Copy'}</span>
        </button>
        <p className="mt-3 text-sm text-white/70">
          {result.finished
            ? 'Claim it on Pulse by 31 January 2027. That was your big prize, so your spins are done. Thanks for playing!'
            : 'Claim it on Pulse by 31 January 2027. Keep spinning every day for a bigger prize!'}
        </p>
        <Link to={`${CLAIM_PATH}?code=${encodeURIComponent(result.win.code)}`}
          className="mt-4 block rounded-2xl bg-linear-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-bold hover:brightness-110">
          Claim on Pulse
        </Link>
        <button type="button" onClick={onClose} className="mt-2 w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
          Close (your code stays under My prizes)
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
      <p className="text-3xl">❄️</p>
      <p className="mt-2 text-white/85">{text}</p>
      <button type="button" onClick={onClose} className="mt-4 rounded-xl bg-white/10 px-5 py-2.5 font-semibold hover:bg-white/20">Close</button>
    </div>
  )
}
