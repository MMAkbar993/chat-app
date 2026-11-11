import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './giveaway.css'
import { fetchState, spin, getToken, setToken, errorMessage, setPreviewDay, resetPreview } from './giveawayApi'
import { useGiveawayMusic } from './useGiveawayMusic'
import SpinWheel, { CLAIM_PATH } from './SpinWheel'
import JoinModal from './JoinModal'
import { GIVEAWAY_FAQ, HOW_IT_WORKS } from './giveawayContent'

// The Affiliate Roulette x Pulse Christmas giveaway: an advent calendar of 25 doors, one spin a
// day. Everything that matters (dates, odds, stock, who may spin) comes from /api/giveaway/state;
// this page only shows it.

const META = {
  title: '25 Days of Christmas | Affiliate Roulette × Pulse',
  description: 'Spin every day from 1 to 25 December to win Pulse Pro, free advertising, vouchers, crypto, gift cards and more.',
}

function usePageTitle() {
  useEffect(() => {
    const prev = document.title
    document.title = META.title
    return () => { document.title = prev }
  }, [])
}

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

function Snow() {
  return <div className="xmas-snow" aria-hidden="true">{FLAKES.map((f) => <span key={f.id} className="xmas-flake" style={f.style} />)}</div>
}

// A string of lights along the bottom of the header.
function Lights() {
  return <div className="xmas-lights" aria-hidden="true">{Array.from({ length: 26 }, (_, i) => <span key={i} className="xmas-bulb" />)}</div>
}

// A bauble hanging on a string, for the hero banner's corners.
function Bauble({ className, color, string = 'h-14' }) {
  return (
    <div className={`xmas-bauble pointer-events-none absolute top-0 flex flex-col items-center ${className}`} aria-hidden="true">
      <span className={`w-px bg-amber-100/60 ${string}`} />
      <span className="h-2 w-3 rounded-sm bg-amber-300" />
      <span className={`relative h-11 w-11 rounded-full shadow-lg ${color}`}>
        <span className="absolute left-2 top-2 h-3 w-3 rounded-full bg-white/50 blur-[1px]" />
      </span>
    </div>
  )
}

// Snow lying along the top edge of the hero banner.
function SnowCap() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 top-0 h-7 w-full" viewBox="0 0 400 28" preserveAspectRatio="none" aria-hidden="true">
      <path fill="#f8fafc" d="M0 0h400v10c-10 0-12 9-22 9s-12-6-22-6-10 12-22 12-12-9-24-9-10 6-22 6-12-8-22-8-12 11-24 11-10-7-22-7-12 5-22 5-10-9-22-9-12 12-24 12-12-8-22-8-10 6-22 6-12-10-24-10-10 8-22 8-12-5-22-5-10 9-22 9-12-7-24-7V0z" />
    </svg>
  )
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

function Countdown({ to, label }) {
  const now = useNow()
  const ms = Math.max(0, new Date(to).getTime() - now)
  const parts = [
    ['days', Math.floor(ms / 86400000)],
    ['hrs', Math.floor(ms / 3600000) % 24],
    ['min', Math.floor(ms / 60000) % 60],
    ['sec', Math.floor(ms / 1000) % 60],
  ].filter(([unit, v]) => unit !== 'days' || v > 0)
  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">{label}</p>
      <div className="mt-2 flex justify-center gap-2" role="timer" aria-live="off">
        {parts.map(([unit, v]) => (
          <div key={unit} className="min-w-16 rounded-xl border border-white/20 bg-black/25 px-3 py-2">
            <div className="font-mono text-2xl font-bold tabular-nums">{String(v).padStart(2, '0')}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Every day from start to end as YYYY-MM-DD (UTC).
function daysBetween(start, end) {
  const out = []
  for (let d = new Date(`${start}T00:00:00Z`); d <= new Date(`${end}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

const prettyDay = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })

function Door({ day, index, state, onOpen }) {
  const { today, phase, me } = state
  const spinOnDay = me?.spins.find((s) => s.day === day)
  const won = spinOnDay?.outcome === 'prize'
  const isToday = day === today && phase === 'open'
  const canSpin = isToday && !(me?.finished) && !(me?.spunToday) && !(me?.blocked)
  const past = day < today
  const future = day > today

  let face, cls, label
  if (spinOnDay) {
    face = won ? '🎁' : '❄️'
    cls = won ? 'bg-linear-to-br from-amber-400/30 to-red-500/20 border-amber-300/60' : 'bg-white/5 border-white/10'
    label = `Day ${index + 1}: ${won ? 'you won a prize' : 'no prize'}`
  } else if (canSpin) {
    face = '✨'
    cls = 'xmas-door-today bg-linear-to-br from-red-600 to-red-800 border-amber-300'
    label = `Day ${index + 1}: open today's door`
  } else if (future) {
    face = '🔒'
    cls = 'bg-linear-to-br from-emerald-800/60 to-emerald-950/60 border-emerald-500/20'
    label = `Day ${index + 1}: opens on ${prettyDay(day)}`
  } else {
    face = past ? '·' : '🎄'
    cls = 'bg-white/[0.03] border-white/5 opacity-60'
    label = `Day ${index + 1}${past ? ': missed' : ''}`
  }

  return (
    <button type="button" onClick={() => onOpen(day, { canSpin, isToday, future })} aria-label={label}
      className={`relative aspect-square rounded-2xl border text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${cls}`}>
      <span className="absolute left-2 top-1.5 text-xs font-bold text-white/80 sm:text-sm">{index + 1}</span>
      <span className="text-2xl sm:text-3xl" aria-hidden="true">{face}</span>
    </button>
  )
}

function PrizeRow({ p }) {
  const gone = p.stock === 'limit_reached' || p.stock === 'unavailable'
  const outToday = p.stock === 'limit_reached_today'
  return (
    <li className={`flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 ${gone ? 'opacity-50' : ''}`}>
      <span className={`text-sm font-medium ${gone ? 'line-through' : ''}`}>{p.name}</span>
      <span className="flex shrink-0 items-center gap-2">
        {gone && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-semibold text-red-200">Limit Reached</span>}
        {outToday && <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-200">Gone for today</span>}
        <span className="font-mono text-xs text-white/60">{p.chance.toFixed(p.chance < 0.1 ? 3 : 2)}%</span>
      </span>
    </li>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
      {GIVEAWAY_FAQ.map((f, i) => (
        <div key={f.q}>
          <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold">
            {f.q}
            <span className={`text-amber-300 transition-transform ${open === i ? 'rotate-45' : ''}`} aria-hidden="true">+</span>
          </button>
          {open === i && <p className="px-5 pb-4 text-sm leading-relaxed text-white/75">{f.a}</p>}
        </div>
      ))}
    </div>
  )
}

// Shown only to preview testers (GIVEAWAY_PREVIEW_EMAILS on the server): pick any December day to
// play, and wipe your test spins to start again. Test prizes never touch real prize stock.
function PreviewBar({ days, today, onDay, onReset }) {
  const [busy, setBusy] = useState(false)
  async function reset() {
    if (!window.confirm('Delete all your test spins and test prizes?')) return
    setBusy(true)
    try { await onReset() } finally { setBusy(false) }
  }
  return (
    <div className="relative z-20 border-b border-amber-300/40 bg-amber-300 text-[#0b1d33]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
        <span className="font-bold">🧪 Preview mode</span>
        <span className="hidden sm:inline">Only testers see this. Test prizes do not use real stock.</span>
        <label className="ml-auto flex items-center gap-2 font-semibold">
          Day
          <select value={today} onChange={(e) => onDay(e.target.value)}
            className="rounded-lg border border-[#0b1d33]/30 bg-white px-2 py-1 font-semibold">
            {days.map((d, i) => <option key={d} value={d}>{i + 1} December</option>)}
          </select>
        </label>
        <button type="button" onClick={reset} disabled={busy}
          className="rounded-lg bg-[#0b1d33] px-3 py-1.5 font-semibold text-white hover:bg-[#16304f] disabled:opacity-50">
          {busy ? 'Resetting…' : 'Reset my test spins'}
        </button>
      </div>
    </div>
  )
}

export default function GiveawayPage() {
  usePageTitle()
  const music = useGiveawayMusic()
  const [state, setState] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [joinOpen, setJoinOpen] = useState(false)
  const [spinDay, setSpinDay] = useState(null)
  const [hint, setHint] = useState('')

  const load = useCallback(() => fetchState()
    .then((data) => {
      // A saved token that no longer works (expired, entry removed): forget it.
      if (!data.me && getToken()) setToken(null)
      setState(data)
      setLoadError('')
    })
    .catch((err) => setLoadError(errorMessage(err, 'The giveaway could not load. Please refresh the page.'))), [])

  useEffect(() => {
    load()
  }, [load])

  // Reload when a new day starts, so tomorrow's door opens without a refresh.
  useEffect(() => {
    if (!state?.nextResetAt) return
    const ms = new Date(state.nextResetAt).getTime() - Date.now() + 1500
    if (ms <= 0 || ms > 2 ** 31 - 1) return
    const t = setTimeout(load, ms)
    return () => clearTimeout(t)
  }, [state?.nextResetAt, load])

  const days = useMemo(() => (state ? daysBetween(state.start, state.end) : []), [state])
  const me = state?.me

  function openDoor(day, { canSpin, isToday, future }) {
    setHint('')
    if (future) { setHint(`Door ${days.indexOf(day) + 1} opens on ${prettyDay(day)}. Come back then!`); return }
    if (!isToday) return
    if (!me) { setJoinOpen(true); return }
    if (me.finished) { setHint('You have already won your big prize. Thanks for playing!'); return }
    if (me.spunToday) { setHint('You have spun today. Come back tomorrow for the next door!'); return }
    if (canSpin) setSpinDay(day)
  }

  async function doSpin() {
    try {
      return await spin()
    } catch (err) {
      throw new Error(errorMessage(err), { cause: err })
    }
  }

  function pickPreviewDay(day) {
    setPreviewDay(day)
    setHint('')
    load()
  }

  async function doPreviewReset() {
    await resetPreview()
    setHint('Your test spins and prizes were deleted.')
    load()
  }

  function signOut() {
    setToken(null)
    load()
  }

  const standard = state?.prizes.filter((p) => p.group !== 'mega') || []
  const mega = state?.prizes.filter((p) => p.group === 'mega') || []
  const canSpinToday = state?.phase === 'open' && me && !me.finished && !me.spunToday && !me.blocked

  return (
    <div className="xmas-page relative min-h-screen overflow-x-hidden text-white">
      <Snow />
      {state?.preview && <PreviewBar days={days} today={state.today} onDay={pickPreviewDay} onReset={doPreviewReset} />}

      <header className="xmas-header relative z-10">
       <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5 rounded" aria-label="Pulse home">
          <img src="/White Pulse Logo.png" alt="Pulse" className="h-7" />
          <span className="text-white/60" aria-hidden="true">×</span>
          <img src="/xmas-assets/ar-logo-santa.png" alt="Affiliate Roulette" className="h-10 w-10 -mt-2" />
        </Link>
        <div className="flex items-center gap-2">
          {music.available && (
            <button type="button" onClick={music.toggle} aria-label={music.muted ? 'Turn music on' : 'Mute music'}
              className="h-10 w-10 rounded-full border border-white/25 bg-white/10 text-lg hover:bg-white/20">
              {music.muted || !music.playing ? '🔇' : '🔊'}
            </button>
          )}
          {me ? (
            <>
              <a href="#my-prizes" className="hidden rounded-full border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10 sm:inline-block">My prizes</a>
              <button type="button" onClick={signOut} className="rounded-full px-3 py-2 text-sm text-white/80 hover:text-white" title={me.email}>Sign out</button>
            </>
          ) : (
            <button type="button" onClick={() => setJoinOpen(true)} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-amber-100">
              Join free
            </button>
          )}
        </div>
       </div>
       <Lights />
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-20">
        <section className="xmas-hero relative mt-10 overflow-hidden rounded-[2rem] px-5 pb-10 pt-12 text-center sm:mt-12 sm:px-10 sm:pb-12 sm:pt-14">
          <SnowCap />
          <Bauble className="left-[6%] hidden sm:flex" color="bg-linear-to-br from-amber-200 to-amber-500" string="h-16" />
          <Bauble className="left-[16%] hidden md:flex xmas-bauble-b" color="bg-linear-to-br from-emerald-300 to-emerald-700" string="h-8" />
          <Bauble className="right-[6%] hidden sm:flex xmas-bauble-b" color="bg-linear-to-br from-sky-200 to-sky-600" string="h-12" />
          <Bauble className="right-[16%] hidden md:flex" color="bg-linear-to-br from-amber-200 to-amber-500" string="h-20" />
          <img src="/xmas-assets/ar-logo-santa.png" alt="" className="xmas-logo-glow relative mx-auto h-20 w-20 sm:h-24 sm:w-24" />
          <p className="relative mt-3 text-xs font-bold uppercase tracking-[0.25em] text-amber-200">Affiliate Roulette × Pulse</p>
          <h1 className="relative mt-2 text-4xl font-extrabold leading-tight drop-shadow sm:text-6xl">
            25 Days of <span className="bg-linear-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">Christmas</span>
          </h1>
          <p className="relative mx-auto mt-4 max-w-xl text-white/90 sm:text-lg">
            25 days of chances to win! Pulse Pro, free advertising, vouchers, crypto, gift cards and more.
          </p>
          <p className="relative mt-2 text-sm font-semibold text-white/75">1 to 25 December 2026 · Spin daily. Win big.</p>

          <div className="relative mx-auto mt-8 max-w-md">
            {!state && !loadError && <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-transparent" />}
            {loadError && <p className="text-red-300">{loadError}</p>}
            {state?.phase === 'before' && <Countdown to={`${state.start}T00:00:00Z`} label="The first door opens in" />}
            {state?.phase === 'open' && (me?.spunToday || me?.finished)
              ? (me.finished
                ? <p className="rounded-2xl border border-amber-200/50 bg-black/20 px-5 py-4 font-semibold">You won your big prize! Claim it on Pulse below.</p>
                : state.preview
                  ? <p className="rounded-2xl border border-amber-200/50 bg-black/20 px-5 py-4">You have spun on this day. Pick another day in the preview bar.</p>
                  : <Countdown to={state.nextResetAt} label="Your next spin unlocks in" />)
              : null}
            {state?.phase === 'open' && !me && (
              <button type="button" onClick={() => setJoinOpen(true)}
                className="w-full rounded-2xl bg-linear-to-r from-amber-300 to-yellow-400 px-6 py-4 text-lg font-extrabold text-red-800 shadow-lg shadow-black/20 hover:brightness-105">
                Join free and spin today
              </button>
            )}
            {canSpinToday && (
              <button type="button" onClick={() => setSpinDay(state.today)}
                className="w-full rounded-2xl bg-linear-to-r from-amber-300 to-yellow-400 px-6 py-4 text-lg font-extrabold text-red-800 shadow-lg shadow-black/20 hover:brightness-105">
                Open today's door
              </button>
            )}
            {state?.phase === 'ended' && (
              <p className="rounded-2xl border border-white/20 bg-black/20 px-5 py-4">
                The giveaway has ended. Thank you for playing! Winners can claim their prize on Pulse until {prettyDay(state.claimDeadline)} 2027.
              </p>
            )}
            {state?.phase === 'before' && !me && (
              <button type="button" onClick={() => setJoinOpen(true)} className="mt-5 w-full rounded-2xl border border-white/40 bg-white/10 px-6 py-3 font-semibold hover:bg-white/20">
                Join now so you are ready on 1 December
              </button>
            )}
          </div>
        </section>

        {state && (
          <section className="mt-12" aria-labelledby="xmas-cal">
            <h2 id="xmas-cal" className="sr-only">Advent calendar</h2>
            <div className="mx-auto grid max-w-2xl grid-cols-5 gap-2 sm:gap-3">
              {days.map((d, i) => <Door key={d} day={d} index={i} state={state} onOpen={openDoor} />)}
            </div>
            <p className="mt-4 min-h-6 text-center text-sm text-amber-200" aria-live="polite">{hint}</p>
            <p className="text-center text-xs text-white/45">A new door opens every day at midnight UTC.</p>
          </section>
        )}

        {me && me.wins.length > 0 && (
          <section id="my-prizes" className="mt-14 scroll-mt-6">
            <h2 className="text-2xl font-bold">My prizes</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {me.wins.map((w) => (
                <li key={w.code} className="rounded-2xl border border-amber-300/30 bg-linear-to-br from-amber-300/10 to-red-500/10 p-5">
                  <p className="font-semibold">{w.name}</p>
                  <p className="mt-1 text-xs text-white/60">Won on {prettyDay(w.day)}</p>
                  <p className="mt-3 font-mono text-lg font-bold tracking-widest text-amber-200 select-all">{w.code}</p>
                  {w.claimed
                    ? <p className="mt-3 text-sm font-semibold text-emerald-300">Claimed ✓</p>
                    : <Link to={`${CLAIM_PATH}?code=${encodeURIComponent(w.code)}`} className="mt-3 inline-block rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold hover:bg-violet-500">Claim on Pulse</Link>}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-white/50">Claim your prizes on Pulse by {state ? prettyDay(state.claimDeadline) : '31 January'} 2027.</p>
          </section>
        )}
        {me && me.wins.length === 0 && <div id="my-prizes" />}

        {state && (
          <section className="mt-14" aria-labelledby="xmas-prizes">
            <h2 id="xmas-prizes" className="text-2xl font-bold">Prizes and chances</h2>
            <p className="mt-1 text-sm text-white/60">The chance of each prize on every spin. When a prize runs out it shows Limit Reached, and its chance becomes no prize.</p>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-amber-300">Mega prizes</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">{mega.map((p) => <PrizeRow key={p.key} p={p} />)}</ul>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-white/70">Prizes</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">{standard.map((p) => <PrizeRow key={p.key} p={p} />)}</ul>
            <p className="mt-3 text-xs text-white/50">No prize: {state.noPrizeChance.toFixed(2)}%. Vouchers are for Affiliate Roulette.</p>
          </section>
        )}

        <section className="mt-14" aria-labelledby="xmas-how">
          <h2 id="xmas-how" className="text-2xl font-bold">How it works</h2>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 font-bold">{i + 1}</span>
                <p className="mt-3 font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-white/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14" aria-labelledby="xmas-faq">
          <h2 id="xmas-faq" className="text-2xl font-bold">Questions</h2>
          <div className="mt-5"><Faq /></div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-sm text-white/50">
        <p>18+ only. No purchase necessary. <Link to="/christmas/terms" className="underline hover:text-white">Giveaway terms</Link> · <Link to="/privacy" className="underline hover:text-white">Privacy</Link></p>
        <p className="mt-2">Affiliate Roulette × Pulse</p>
      </footer>

      {joinOpen && <JoinModal onClose={() => setJoinOpen(false)} onJoined={() => { setJoinOpen(false); load() }} />}
      {spinDay && <SpinWheel day={days.indexOf(spinDay) + 1} onSpin={doSpin} onDone={load} onClose={() => setSpinDay(null)} />}
    </div>
  )
}
