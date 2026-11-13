import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCalendar, FiGift, FiZap, FiShield, FiLock, FiArrowRight, FiVolume2, FiVolumeX, FiMessageCircle } from 'react-icons/fi'
import './giveaway.css'
import { fetchState, spin, getToken, setToken, errorMessage, setPreviewDay, resetPreview } from './giveawayApi'
import { useGiveawayMusic } from './useGiveawayMusic'
import SpinWheel, { CLAIM_PATH } from './SpinWheel'
import JoinModal from './JoinModal'
import { GIVEAWAY_FAQ, HOW_IT_WORKS } from './giveawayContent'
import { Snow, Lights, CornerBaubles, SnowCap, SnowDrift, GiftBox, LogoLockup, PULSE_LOGO, AR_LOGO } from './XmasDecor'

// The Affiliate Roulette x Pulse Christmas giveaway: an advent calendar of 25 doors, one spin a
// day. Everything that matters (dates, odds, stock, who may spin) comes from /api/giveaway/state;
// this page only shows it.

const META = {
  title: '25 Days of Christmas | Affiliate Roulette × Pulse',
  description: 'Spin every day from 1 to 25 December to win Pulse Pro, free advertising, vouchers, crypto, gift cards and more.',
}

const FEATURES = [
  { icon: FiCalendar, label: '25 Daily Spins' },
  { icon: FiGift, label: 'Exclusive Prizes' },
  { icon: FiZap, label: 'Claim on Pulse' },
  { icon: FiShield, label: 'Verified & Secure' },
]

function usePageTitle() {
  useEffect(() => {
    const prev = document.title
    document.title = META.title
    return () => { document.title = prev }
  }, [])
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
      <p className="xmas-eyebrow text-xs font-bold uppercase tracking-[0.2em] text-amber-200">{label}</p>
      <div className="mt-3 flex justify-center gap-2" role="timer" aria-live="off">
        {parts.map(([unit, v]) => (
          <div key={unit} className="xmas-card min-w-16 rounded-xl px-3 py-2">
            <div className="xmas-gold-text font-mono text-3xl font-bold tabular-nums">{String(v).padStart(2, '0')}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">{unit}</div>
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
    face = <span className="text-2xl sm:text-4xl">{won ? '🎁' : '❄️'}</span>
    cls = won ? 'xmas-tile xmas-tile-won' : 'xmas-tile xmas-tile-done'
    label = `Day ${index + 1}: ${won ? 'you won a prize' : 'no prize'}`
  } else if (isToday && (canSpin || !me)) {
    face = <span className="text-3xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] sm:text-5xl">🎁</span>
    cls = 'xmas-tile xmas-tile-today'
    label = `Day ${index + 1}: open today's door`
  } else if (future) {
    face = <FiLock className="text-xl text-rose-100/80 sm:text-3xl" />
    cls = 'xmas-tile'
    label = `Day ${index + 1}: opens on ${prettyDay(day)}`
  } else {
    face = <span className="text-2xl text-white/50 sm:text-3xl">{past ? '·' : '🎄'}</span>
    cls = 'xmas-tile xmas-tile-done'
    label = `Day ${index + 1}${past ? ': missed' : ''}`
  }

  return (
    <button type="button" onClick={() => onOpen(day, { canSpin, isToday, future })} aria-label={label}
      className={`relative flex aspect-[1.25] items-center justify-center rounded-xl text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 sm:rounded-2xl ${cls}`}>
      <span className="absolute left-1.5 top-1 text-xs font-bold text-white/90 sm:left-3 sm:top-2 sm:text-base">{index + 1}</span>
      <span aria-hidden="true">{face}</span>
    </button>
  )
}

function PrizeRow({ p }) {
  const gone = p.stock === 'limit_reached' || p.stock === 'unavailable'
  const outToday = p.stock === 'limit_reached_today'
  return (
    <li className={`xmas-card flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${gone ? 'opacity-50' : ''}`}>
      <span className={`text-sm font-medium ${gone ? 'line-through' : ''}`}>{p.name}</span>
      <span className="flex shrink-0 items-center gap-2">
        {gone && <span className="rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-semibold text-rose-100">Limit Reached</span>}
        {outToday && <span className="rounded-full bg-amber-300/20 px-2 py-0.5 text-[11px] font-semibold text-amber-100">Gone for today</span>}
        <span className="font-mono text-xs font-semibold text-amber-200">{p.chance.toFixed(p.chance < 0.1 ? 3 : 2)}%</span>
      </span>
    </li>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <div className="xmas-card divide-y divide-amber-200/15 rounded-2xl">
      {GIVEAWAY_FAQ.map((f, i) => (
        <div key={f.q}>
          <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold">
            {f.q}
            <span className={`text-xl text-amber-300 transition-transform ${open === i ? 'rotate-45' : ''}`} aria-hidden="true">+</span>
          </button>
          {open === i && <p className="px-5 pb-4 text-sm leading-relaxed text-white/80">{f.a}</p>}
        </div>
      ))}
    </div>
  )
}

// For visitors who have not heard of Pulse: prizes are claimed there, so say what it is.
const PULSE_POINTS = [
  { icon: FiShield, title: 'Real people only', body: 'Every member verifies their ID, so you always know who you are talking to.' },
  { icon: FiMessageCircle, title: 'Made for iGaming', body: 'Chat with affiliates, operators and managers, one to one or in groups.' },
  { icon: FiGift, title: 'Where you claim prizes', body: 'Win here, then claim your prize on Pulse with a free account.' },
]

function WhatIsPulse() {
  return (
    <section className="xmas-card mt-14 rounded-[1.75rem] p-6 sm:p-9" aria-labelledby="xmas-pulse">
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <img src={PULSE_LOGO} alt="" className="h-8 shrink-0" />
        <div className="sm:ml-2 sm:border-l sm:border-amber-300/30 sm:pl-5">
          <h2 id="xmas-pulse" className="text-2xl font-extrabold"><span className="xmas-gold-text">What is Pulse?</span></h2>
          <p className="mt-1 text-white/85">Pulse is a messaging app built for the iGaming industry, where every member is ID verified.</p>
        </div>
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {PULSE_POINTS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="rounded-2xl bg-black/20 p-4">
            <Icon className="text-2xl text-amber-300" aria-hidden="true" />
            <p className="mt-2 font-semibold">{title}</p>
            <p className="mt-1 text-sm text-white/75">{body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6 text-center">
        <Link to="/how-it-works" target="_blank" className="xmas-btn-outline px-6 py-2.5 text-sm">See how Pulse works</Link>
      </div>
    </section>
  )
}

function SectionTitle({ id, children }) {
  return <h2 id={id} className="text-center text-3xl font-extrabold"><span className="xmas-gold-text">{children}</span></h2>
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
    <div className="relative z-30 border-b border-amber-500 bg-amber-300 text-[#4a0a0a]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
        <span className="font-bold">🧪 Preview mode</span>
        <span className="hidden sm:inline">Only testers see this. Test prizes do not use real stock.</span>
        <label className="ml-auto flex items-center gap-2 font-semibold">
          Day
          <select value={today} onChange={(e) => onDay(e.target.value)}
            className="rounded-lg border border-[#4a0a0a]/30 bg-white px-2 py-1 font-semibold">
            {days.map((d, i) => <option key={d} value={d}>{i + 1} December</option>)}
          </select>
        </label>
        <button type="button" onClick={reset} disabled={busy}
          className="rounded-lg bg-[#7d0b12] px-3 py-1.5 font-semibold text-white hover:bg-[#9a0f18] disabled:opacity-50">
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
  const BIG_CTA = 'xmas-btn-gold w-full px-6 py-4 text-lg sm:text-xl'

  return (
    <div className="xmas-page relative min-h-screen overflow-x-hidden text-white">
      <Snow />
      {state?.preview && <PreviewBar days={days} today={state.today} onDay={pickPreviewDay} onReset={doPreviewReset} />}

      <header className="relative z-20 border-b border-amber-300/25">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <LogoLockup />
          <div className="flex items-center gap-2">
            {music.available && (
              <button type="button" onClick={music.toggle} aria-label={music.muted ? 'Turn music on' : 'Mute music'}
                className="xmas-btn-outline h-10 w-10 text-lg">
                {music.muted || !music.playing ? <FiVolumeX aria-hidden="true" /> : <FiVolume2 aria-hidden="true" />}
              </button>
            )}
            {me ? (
              <>
                <a href="#my-prizes" className="xmas-btn-outline hidden px-5 py-2 text-sm sm:inline-flex">My Prizes</a>
                <button type="button" onClick={signOut} className="xmas-btn-gold px-5 py-2 text-sm" title={me.email}>Sign Out</button>
              </>
            ) : (
              <button type="button" onClick={() => setJoinOpen(true)} className="xmas-btn-gold px-5 py-2 text-sm">Join free</button>
            )}
          </div>
        </div>
        <Lights />
      </header>

      <div className="relative">
        <CornerBaubles />

        <main className="relative z-10 mx-auto max-w-5xl px-4 pb-20">
          <section className="relative pb-4 pt-12 text-center sm:pt-14">
            <GiftBox logo={PULSE_LOGO} width={190} className="absolute -left-10 top-44 hidden -rotate-8 xl:block" />
            <GiftBox logo={AR_LOGO} width={190} className="absolute -right-10 top-44 hidden rotate-8 xl:block" />

            <p className="xmas-btn-gold pointer-events-none px-6 py-2 text-sm sm:text-base">
              <span aria-hidden="true">🎁</span> Affiliate Roulette × Pulse
            </p>
            <h1 className="xmas-title-shadow mt-5 leading-none">
              <span className="block font-serif text-4xl font-bold italic sm:text-6xl">25 Days of</span>
              <span className="xmas-script xmas-gold-text -mt-1 block px-4 pb-2 text-7xl sm:text-9xl">Christmas</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-white/90 sm:text-lg">
              Spin daily for a chance to win Pulse Pro, free advertising, vouchers, crypto, gift cards and more.
            </p>
            <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold sm:text-base">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2"><Icon className="text-xl text-amber-300" aria-hidden="true" />{label}</li>
              ))}
            </ul>

            <div className="relative mx-auto mt-8 max-w-xl">
              {!state && !loadError && <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-transparent" />}
              {loadError && <p className="font-semibold text-amber-100">{loadError}</p>}
              {state?.phase === 'before' && <Countdown to={`${state.start}T00:00:00Z`} label="The first door opens in" />}
              {state?.phase === 'open' && (me?.spunToday || me?.finished)
                ? (me.finished
                  ? <a href="#my-prizes" className={BIG_CTA}>You won your big prize! Claim it on Pulse below. <FiArrowRight aria-hidden="true" /></a>
                  : state.preview
                    ? <p className="xmas-card rounded-2xl px-5 py-4">You have spun on this day. Pick another day in the preview bar.</p>
                    : <Countdown to={state.nextResetAt} label="Your next spin unlocks in" />)
                : null}
              {state?.phase === 'open' && !me && (
                <button type="button" onClick={() => setJoinOpen(true)} className={BIG_CTA}>Join free and spin today</button>
              )}
              {canSpinToday && (
                <button type="button" onClick={() => setSpinDay(state.today)} className={BIG_CTA}>
                  <span aria-hidden="true">🎁</span> Open today's door
                </button>
              )}
              {state?.phase === 'ended' && (
                <p className="xmas-card rounded-2xl px-5 py-4">
                  The giveaway has ended. Thank you for playing! Winners can claim their prize on Pulse until {prettyDay(state.claimDeadline)} 2027.
                </p>
              )}
              {state?.phase === 'before' && !me && (
                <button type="button" onClick={() => setJoinOpen(true)} className="xmas-btn-outline mt-5 w-full px-6 py-3">
                  Join now so you are ready on 1 December
                </button>
              )}
            </div>
          </section>

          {state && (
            <section className="relative mt-10" aria-labelledby="xmas-cal">
              {/* Snow drifts either side of the calendar, the full width of the screen. */}
              <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-screen -translate-x-1/2" aria-hidden="true"><SnowDrift className="h-full" /></div>
              <h2 id="xmas-cal" className="sr-only">Advent calendar</h2>
              <div className="xmas-calendar relative mx-auto max-w-3xl rounded-[1.75rem] px-3 pb-5 pt-9 sm:px-7 sm:pb-7 sm:pt-11">
                <SnowCap className="h-8 rounded-t-[1.75rem]" />
                <div className="grid grid-cols-5 gap-2 sm:gap-3.5">
                  {days.map((d, i) => <Door key={d} day={d} index={i} state={state} onOpen={openDoor} />)}
                </div>
                <p className="mt-4 min-h-6 text-center text-sm font-semibold text-amber-200" aria-live="polite">{hint}</p>
                <p className="text-center text-xs text-white/60">A new door opens every day at midnight UTC.</p>
              </div>
            </section>
          )}

          <WhatIsPulse />

          {me && me.wins.length > 0 && (
            <section id="my-prizes" className="mt-16 scroll-mt-6" aria-labelledby="xmas-mine">
              <SectionTitle id="xmas-mine">My Prizes</SectionTitle>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {me.wins.map((w) => (
                  <li key={w.code} className="xmas-card rounded-2xl border-amber-300/60! p-5">
                    <p className="font-semibold">{w.name}</p>
                    <p className="mt-1 text-xs text-white/65">Won on {prettyDay(w.day)}</p>
                    <p className="xmas-code-box mt-3 w-fit select-all rounded-lg px-3 py-1 font-mono text-lg font-bold tracking-widest text-amber-200">{w.code}</p>
                    {w.claimed
                      ? <p className="mt-3 text-sm font-semibold text-amber-200">Claimed ✓</p>
                      : <Link to={`${CLAIM_PATH}?code=${encodeURIComponent(w.code)}`} className="xmas-btn-gold mt-4 px-5 py-2 text-sm">Claim on Pulse</Link>}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-center text-xs text-white/60">Claim your prizes on Pulse by {state ? prettyDay(state.claimDeadline) : '31 January'} 2027.</p>
            </section>
          )}
          {me && me.wins.length === 0 && <div id="my-prizes" />}

          {state && (
            <section className="mt-16" aria-labelledby="xmas-prizes">
              <SectionTitle id="xmas-prizes">Prizes and Chances</SectionTitle>
              <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-white/75">The chance of each prize on every spin. When a prize runs out it shows Limit Reached, and its chance becomes no prize.</p>
              <h3 className="xmas-eyebrow mt-8 text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Mega Prizes</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">{mega.map((p) => <PrizeRow key={p.key} p={p} />)}</ul>
              <h3 className="xmas-eyebrow mt-8 text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Prizes</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">{standard.map((p) => <PrizeRow key={p.key} p={p} />)}</ul>
              <p className="mt-3 text-center text-xs text-white/60">No prize: {state.noPrizeChance.toFixed(2)}%. Vouchers are for Affiliate Roulette.</p>
            </section>
          )}

          <section className="mt-16" aria-labelledby="xmas-how">
            <SectionTitle id="xmas-how">How It Works</SectionTitle>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((s, i) => (
                <li key={s.title} className="xmas-card rounded-2xl p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-b from-amber-200 to-amber-500 font-extrabold text-[#4a0a0a] shadow">{i + 1}</span>
                  <p className="mt-3 font-semibold">{s.title}</p>
                  <p className="mt-1 text-sm text-white/75">{s.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-16" aria-labelledby="xmas-faq">
            <SectionTitle id="xmas-faq">Questions</SectionTitle>
            <div className="mt-6"><Faq /></div>
          </section>
        </main>
      </div>

      <footer className="relative z-10 border-t border-amber-300/20 py-8 text-center text-sm text-white/65">
        <p>18+ only. No purchase necessary. <Link to="/christmas/terms" className="underline hover:text-white">Giveaway terms</Link> · <Link to="/privacy" className="underline hover:text-white">Privacy</Link></p>
        <p className="mt-2">Affiliate Roulette × Pulse</p>
      </footer>

      {joinOpen && <JoinModal onClose={() => setJoinOpen(false)} onJoined={() => { setJoinOpen(false); load() }} />}
      {spinDay && <SpinWheel day={days.indexOf(spinDay) + 1} onSpin={doSpin} onDone={load} onClose={() => setSpinDay(null)} />}
    </div>
  )
}
