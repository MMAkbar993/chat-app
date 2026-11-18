import { useEffect, useState } from 'react'
import adminClient from '../api/adminClient'
import { useToast } from '../../context/ToastContext'
import { apiErrorMessage } from '../../utils/apiError'

// The Christmas giveaway: numbers and prize stock (limits can be changed here), winners and their
// delivery, and entries (block anyone cheating). "Show test data" switches the numbers and the
// winners to preview mode play by testers.

const CATEGORY_LABELS = {
  affiliate_publisher: 'Affiliate / Publisher',
  casino_affiliate_manager: 'Casino / Affiliate Manager',
  event_organizer: 'Event Organizer',
  affiliate_network: 'Affiliate Network',
  other: 'Other',
}
const PHASE_LABELS = { before: 'Not started yet', open: 'Running', ended: 'Ended' }
const LIMIT = 25

const BTN = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40'
const INPUT = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtDay(day) {
  return day ? new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '—'
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="w-7 h-7 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Loads `path` with `params` whenever they change or `reload()` is called. Answers that arrive
// after the inputs changed again are dropped.
function useAdminData(path, params, errorText) {
  const { showToast } = useToast()
  const [data, setData] = useState(null)
  const [tick, setTick] = useState(0)
  const key = JSON.stringify(params)
  useEffect(() => {
    let gone = false
    adminClient.get(path, { params: JSON.parse(key) })
      .then(({ data: d }) => { if (!gone) setData(d) })
      .catch((err) => { if (!gone) showToast(apiErrorMessage(err, errorText), 'error') })
    return () => { gone = true }
  }, [path, key, tick, errorText, showToast])
  return [data, () => setTick((t) => t + 1)]
}

function Pager({ page, total, onPage }) {
  const pages = Math.ceil(total / LIMIT)
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-400">Page {page} of {pages} · {total}</p>
      <div className="flex gap-2">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${BTN} border border-gray-200 text-gray-600 hover:bg-gray-50`}>Previous</button>
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} className={`${BTN} border border-gray-200 text-gray-600 hover:bg-gray-50`}>Next</button>
      </div>
    </div>
  )
}

async function downloadCsv(path, params, showToast) {
  try {
    const res = await adminClient.get(path, { params, responseType: 'blob' })
    const name = /filename="([^"]+)"/.exec(res.headers['content-disposition'] || '')?.[1] || 'giveaway.csv'
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (err) {
    showToast(apiErrorMessage(err, 'Could not download the file'), 'error')
  }
}

// ---------- Overview and prizes ----------

function Stat({ label, value, sub, tone = 'gray' }) {
  const tones = { gray: 'text-gray-900', amber: 'text-amber-600', violet: 'text-violet-700' }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function limitText(v) {
  return v === null || v === undefined ? '' : String(v)
}

function PrizeRow({ p, tests, onSaved }) {
  const { showToast } = useToast()
  const [daily, setDaily] = useState(limitText(p.daily_limit))
  const [total, setTotal] = useState(limitText(p.total_limit))
  const [saving, setSaving] = useState(false)
  const changed = daily !== limitText(p.daily_limit) || total !== limitText(p.total_limit)

  async function save(body) {
    setSaving(true)
    try {
      await adminClient.patch(`/giveaway/prizes/${p.key}`, body)
      showToast('Prize updated', 'success')
      onSaved()
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not update the prize'), 'error')
    }
    setSaving(false)
  }

  const out = (p.total_limit !== null && p.won_total >= p.total_limit) || (p.daily_limit !== null && p.won_today >= p.daily_limit)
  return (
    <tr className={`hover:bg-gray-50 ${p.active ? '' : 'opacity-50'}`}>
      <td className="px-4 py-2.5">
        <p className="font-medium text-gray-800">{p.name}</p>
        <p className="text-xs text-gray-400">
          {p.bonus_entries ? `Not a prize: +${p.bonus_entries} Grand Prize Draw entries`
            : p.key === 'pro_lifetime' ? 'Grand Prize Draw prize (kept off the wheel)'
            : <>{p.prize_group === 'mega' ? 'Mega prize · ' : ''}{p.ends_game ? 'Big prize (one per person)' : 'Small prize (once each)'}{p.available_from ? ` · from ${fmtDay(p.available_from)}` : ''}</>}
        </p>
      </td>
      <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{p.chance}%</td>
      <td className="px-4 py-2.5 text-gray-700">
        {p.won_today} today · {p.won_total} total
        {out && p.active && <span className="ml-2 rounded-full bg-red-50 text-red-600 px-2 py-0.5 text-[11px] font-semibold">Limit reached</span>}
      </td>
      <td className="px-4 py-2.5">
        <input value={daily} onChange={(e) => setDaily(e.target.value.replace(/[^0-9]/g, ''))} placeholder="No limit" aria-label={`${p.name} daily limit`}
          className={`${INPUT} w-24 py-1.5`} />
      </td>
      <td className="px-4 py-2.5">
        <input value={total} onChange={(e) => setTotal(e.target.value.replace(/[^0-9]/g, ''))} placeholder="No limit" aria-label={`${p.name} total limit`}
          className={`${INPUT} w-24 py-1.5`} />
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap">
        <button disabled={!changed || saving} onClick={() => save({ daily_limit: daily, total_limit: total })}
          className={`${BTN} bg-violet-600 text-white hover:bg-violet-700`}>Save</button>
        <button disabled={saving} onClick={() => save({ active: !p.active })}
          className={`${BTN} ml-2 border border-gray-200 text-gray-600 hover:bg-gray-50`}
          title={p.active ? 'Take this prize out of the draw (its chance becomes no prize)' : 'Put this prize back in the draw'}>
          {p.active ? 'Turn off' : 'Turn on'}
        </button>
        {tests && <span className="sr-only">Counts are test data</span>}
      </td>
    </tr>
  )
}

// The Grand Prize Draw: who is in it, the winner once drawn, and running or voiding it.
function DrawPanel({ draw, phase, tests, onChanged }) {
  const { showToast } = useToast()
  const [busy, setBusy] = useState(false)
  const live = draw.live
  const canRun = !live && (tests || phase === 'ended')

  async function run() {
    if (!window.confirm(tests ? 'Run a test draw over preview mode spins?' : 'Run the Grand Prize Draw now? The winner is emailed straight away.')) return
    setBusy(true)
    try {
      const { data } = await adminClient.post('/giveaway/draw', { tests })
      showToast(`Drawn: ${data.result.email}`, 'success')
      onChanged()
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not run the draw'), 'error')
    }
    setBusy(false)
  }

  async function voidIt() {
    const reason = window.prompt('Why is this draw being voided? (for example: winner disqualified). The prize code is removed and this person is left out of the redraw.')
    if (!reason?.trim()) return
    setBusy(true)
    try {
      await adminClient.post('/giveaway/draw/void', { tests, reason })
      showToast('Draw voided. You can now run it again.', 'success')
      onChanged()
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not void the draw'), 'error')
    }
    setBusy(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">🎟️ Grand Prize Draw{tests ? ' (test)' : ''}: Free Pulse Pro for Life</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {draw.pool.entries} entries from {draw.pool.entrants} people. Draws by itself after the last door ({fmtDate(draw.at)}, midnight UTC). Blocked entries are left out.
          </p>
        </div>
        <div className="flex gap-2">
          {!live && (
            <button disabled={busy || !canRun || !draw.pool.entries} onClick={run}
              title={canRun ? '' : 'The real draw can only run after the giveaway has ended'}
              className={`${BTN} bg-violet-600 text-white hover:bg-violet-700`}>{tests ? 'Run test draw' : 'Run draw now'}</button>
          )}
          {live && !live.claimed_at && (
            <button disabled={busy} onClick={voidIt} className={`${BTN} border border-red-200 text-red-600 hover:bg-red-50`}>Void and redraw</button>
          )}
        </div>
      </div>
      {live && (
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-gray-800">
          <p><strong>Winner:</strong> {live.winner_email} · {live.winner_entries} of {live.total_entries} entries ({live.entrant_count} people)</p>
          <p className="mt-0.5">
            <strong>Prize code:</strong> <span className="font-mono select-all">{live.code || '—'}</span> ·{' '}
            {live.claimed_at ? <span className="text-emerald-700 font-semibold">Claimed by @{live.claimed_username} on {fmtDate(live.claimed_at)}</span> : 'Not claimed yet'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Drawn {fmtDate(live.created_at)} by {live.drawn_by}</p>
        </div>
      )}
      {draw.voided.length > 0 && (
        <div className="mt-3 text-xs text-gray-500">
          <p className="font-semibold text-gray-600">Voided draws</p>
          {draw.voided.map((v) => <p key={v.id}>{v.winner_email} · voided {fmtDate(v.voided_at)} by {v.voided_by}: {v.void_reason}</p>)}
        </div>
      )}
    </div>
  )
}

function OverviewTab({ tests }) {
  const [data, load] = useAdminData('/giveaway/overview', { tests: tests ? 1 : 0 }, 'Could not load the giveaway')

  if (!data) return <Spinner />
  const n = data.numbers
  const standard = data.prizes.filter((p) => p.prize_group !== 'mega')
  const mega = data.prizes.filter((p) => p.prize_group === 'mega')

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        {PHASE_LABELS[data.phase]} · {fmtDay(data.dates.start)} to {fmtDay(data.dates.end)} · claims close {fmtDay(data.dates.claimDeadline)} · today is {fmtDay(data.today)} (UTC)
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Entries" value={n.entrants} sub={`${n.entrants_today} joined today${n.blocked ? ` · ${n.blocked} blocked` : ''}`} />
        <Stat label={tests ? 'Test spins' : 'Spins'} value={n.spins} sub={`${n.spins_today} today`} />
        <Stat label={tests ? 'Test prizes won' : 'Prizes won'} value={n.wins} sub={`${n.wins_today} today · ${n.claimed} claimed`} tone="violet" />
        <Stat label="To deliver" value={n.to_deliver} sub="Claimed, not sent yet" tone={n.to_deliver ? 'amber' : 'gray'} />
      </div>

      <DrawPanel draw={data.draw} phase={data.phase} tests={tests} onChanged={load} />

      {n.categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-800 mb-2">Who joined</p>
          <div className="flex flex-wrap gap-2">
            {n.categories.map((c) => (
              <span key={c.category} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                {CATEGORY_LABELS[c.category] || c.category}: <strong>{c.count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">Prizes and limits</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Leave a limit empty for no limit. Changes apply from the next spin. When a limit is reached, landing on that prize counts as no prize.
            Chances are fixed: they are published on the giveaway page.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-2.5 font-medium">Prize</th>
                <th className="px-4 py-2.5 font-medium">Chance</th>
                <th className="px-4 py-2.5 font-medium">Won{tests ? ' (test)' : ''}</th>
                <th className="px-4 py-2.5 font-medium">Daily limit</th>
                <th className="px-4 py-2.5 font-medium">Total limit</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr><td colSpan={6} className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-amber-600">Mega prizes</td></tr>
              {mega.map((p) => <PrizeRow key={`${p.key}-${p.daily_limit}-${p.total_limit}-${p.active}`} p={p} tests={tests} onSaved={load} />)}
              <tr><td colSpan={6} className="px-4 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Prizes</td></tr>
              {standard.map((p) => <PrizeRow key={`${p.key}-${p.daily_limit}-${p.total_limit}-${p.active}`} p={p} tests={tests} onSaved={load} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---------- Winners ----------

function WinRow({ w, onSaved }) {
  const { showToast } = useToast()
  const [note, setNote] = useState(w.admin_note || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function save(body, done) {
    setSaving(true)
    try {
      await adminClient.patch(`/giveaway/wins/${w.id}`, body)
      showToast(done, 'success')
      setEditing(false)
      onSaved()
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not update the prize'), 'error')
    }
    setSaving(false)
  }

  let status
  if (!w.claimed_at) status = <span className="rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-[11px] font-semibold">Not claimed</span>
  else if (w.auto_delivered) status = <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-semibold">Pro applied</span>
  else if (w.fulfilled_at) status = <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-semibold" title={`by ${w.fulfilled_by}`}>Delivered {fmtDate(w.fulfilled_at)}</span>
  else status = <span className="rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-semibold">To deliver</span>

  return (
    <tr className="align-top hover:bg-gray-50">
      <td className="px-4 py-3">
        <p className="font-medium text-gray-800">{w.prize_name}</p>
        <p className="font-mono text-xs text-gray-500 select-all">{w.code}</p>
        <p className="text-xs text-gray-400">Won {fmtDay(w.won_day)}</p>
      </td>
      <td className="px-4 py-3">
        {w.user_id ? (
          <>
            <p className="text-gray-800">{w.full_name} <span className="text-gray-400">@{w.username}</span></p>
            <p className="text-xs text-gray-400">{w.user_email}</p>
          </>
        ) : <p className="text-gray-400">—</p>}
        <p className="text-xs text-gray-400 mt-0.5">Entry: {w.entrant_email}{w.entrant_blocked_at ? ' (blocked)' : ''}</p>
      </td>
      <td className="px-4 py-3 max-w-[14rem]">
        {w.wallet_address ? <p className="font-mono text-xs text-gray-700 break-all select-all">{w.wallet_address}</p> : <p className="text-gray-400">—</p>}
      </td>
      <td className="px-4 py-3">
        {status}
        {w.claimed_at && <p className="text-xs text-gray-400 mt-1">Claimed {fmtDate(w.claimed_at)}</p>}
        {w.conversation_id && (
          <a href={`/chat?conversation=${w.conversation_id}`} target="_blank" rel="noreferrer" className="block text-xs text-violet-600 hover:underline mt-1"
            title="Opens the winner chat in Pulse (sign in there as the giveaway host account)">Winner chat ↗</a>
        )}
      </td>
      <td className="px-4 py-3 min-w-[13rem]">
        {editing ? (
          <div className="space-y-1.5">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} className={`${INPUT} w-full`} placeholder="Note, e.g. sent on 3 Dec, tx id…" />
            <div className="flex gap-2">
              <button disabled={saving} onClick={() => save({ note }, 'Note saved')} className={`${BTN} bg-violet-600 text-white hover:bg-violet-700`}>Save note</button>
              <button disabled={saving} onClick={() => { setEditing(false); setNote(w.admin_note || '') }} className={`${BTN} border border-gray-200 text-gray-600`}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-left text-xs text-gray-600 hover:text-violet-700">
            {w.admin_note ? <span className="whitespace-pre-wrap">{w.admin_note}</span> : <span className="text-gray-400">+ Add note</span>}
          </button>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {w.claimed_at && !w.auto_delivered && (
          w.fulfilled_at
            ? <button disabled={saving} onClick={() => save({ delivered: false }, 'Marked not delivered')} className={`${BTN} border border-gray-200 text-gray-600 hover:bg-gray-50`}>Undo</button>
            : <button disabled={saving} onClick={() => save({ delivered: true }, 'Marked delivered')} className={`${BTN} bg-emerald-600 text-white hover:bg-emerald-700`}>Mark delivered</button>
        )}
      </td>
    </tr>
  )
}

function WinnersTab({ tests }) {
  const { showToast } = useToast()
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, load] = useAdminData('/giveaway/wins', { status, q: search, page, tests: tests ? 1 : 0 }, 'Could not load the winners')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[['', 'All'], ['to_deliver', 'To deliver'], ['unclaimed', 'Not claimed'], ['delivered', 'Delivered']].map(([v, label]) => (
          <button key={v} onClick={() => { setStatus(v); setPage(1) }}
            className={`${BTN} ${status === v ? 'bg-violet-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{label}</button>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(1) }} className="ml-auto flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Code, email or name" className={`${INPUT} w-56`} />
          <button className={`${BTN} border border-gray-200 text-gray-600 hover:bg-gray-50`}>Search</button>
        </form>
        <button onClick={() => downloadCsv('/giveaway/export/wins.csv', { tests: tests ? 1 : 0 }, showToast)}
          className={`${BTN} border border-gray-200 text-gray-600 hover:bg-gray-50`}>Download CSV</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {!data ? <Spinner /> : data.wins.length === 0 ? (
          <p className="py-14 text-center text-sm text-gray-400">No prizes here yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-2.5 font-medium">Prize</th>
                  <th className="px-4 py-2.5 font-medium">Winner (Pulse account)</th>
                  <th className="px-4 py-2.5 font-medium">Wallet</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Note</th>
                  <th className="px-4 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.wins.map((w) => <WinRow key={`${w.id}-${w.fulfilled_at}-${w.admin_note}`} w={w} onSaved={load} />)}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pager page={page} total={data.total} onPage={setPage} />}
      </div>
    </div>
  )
}

// ---------- Entries ----------

function EntriesTab() {
  const { showToast } = useToast()
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(null)
  const [data, load] = useAdminData('/giveaway/entrants', { status, category, q: search, page }, 'Could not load the entries')

  async function setBlocked(e, blocked) {
    if (blocked && !window.confirm(`Block ${e.email}? They will not be able to spin or claim any prize they have not claimed yet.`)) return
    setBusy(e.id)
    try {
      await adminClient.post(`/giveaway/entrants/${e.id}/block`, { blocked })
      showToast(blocked ? 'Entry blocked' : 'Entry unblocked', 'success')
      load()
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not update the entry'), 'error')
    }
    setBusy(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[['', 'All'], ['active', 'No big prize yet'], ['finished', 'Won big prize'], ['blocked', 'Blocked']].map(([v, label]) => (
          <button key={v} onClick={() => { setStatus(v); setPage(1) }}
            className={`${BTN} ${status === v ? 'bg-violet-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{label}</button>
        ))}
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }} className={`${INPUT} py-1.5`} aria-label="Category">
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(1) }} className="ml-auto flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email or IP" className={`${INPUT} w-48`} />
          <button className={`${BTN} border border-gray-200 text-gray-600 hover:bg-gray-50`}>Search</button>
        </form>
        <button onClick={() => downloadCsv('/giveaway/export/entrants.csv', {}, showToast)}
          className={`${BTN} border border-gray-200 text-gray-600 hover:bg-gray-50`}>Download CSV</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {!data ? <Spinner /> : data.entrants.length === 0 ? (
          <p className="py-14 text-center text-sm text-gray-400">No entries yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Country / IP</th>
                  <th className="px-4 py-2.5 font-medium">Spins / prizes / entries</th>
                  <th className="px-4 py-2.5 font-medium">Joined</th>
                  <th className="px-4 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.entrants.map((e) => (
                  <tr key={e.id} className={`hover:bg-gray-50 ${e.blocked_at ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-2.5">
                      <p className="text-gray-800">{e.email}</p>
                      <p className="text-xs text-gray-400">
                        {e.tester && <span className="mr-1 rounded bg-amber-100 text-amber-700 px-1.5 py-0.5 font-semibold">Tester</span>}
                        {e.pulse_username ? `Pulse: @${e.pulse_username}` : ''}
                        {e.finished_at && <span className="ml-1">· won big prize</span>}
                        {e.blocked_at && <span className="ml-1 font-semibold text-red-600">· blocked</span>}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{CATEGORY_LABELS[e.category] || e.category}</td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {e.country || '—'} · <span className="font-mono text-xs">{e.ip || '—'}</span>
                      {e.same_ip > 1 && (
                        <button onClick={() => { setQ(e.ip); setSearch(e.ip); setPage(1) }}
                          className="ml-1 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-semibold hover:bg-amber-100"
                          title="Show every entry from this IP">{e.same_ip} on this IP</button>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{e.spins} / {e.wins} / {e.entries}</td>
                    <td className="px-4 py-2.5 text-gray-500">{fmtDate(e.created_at)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {e.blocked_at
                        ? <button disabled={busy === e.id} onClick={() => setBlocked(e, false)} className={`${BTN} border border-gray-200 text-gray-600 hover:bg-gray-50`}>Unblock</button>
                        : <button disabled={busy === e.id} onClick={() => setBlocked(e, true)} className={`${BTN} border border-red-200 text-red-600 hover:bg-red-50`}>Block</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pager page={page} total={data.total} onPage={setPage} />}
      </div>
    </div>
  )
}

// ---------- Page ----------

const TABS = [['overview', 'Overview & prizes'], ['winners', 'Winners'], ['entries', 'Entries']]

export default function AdminGiveawayPage() {
  const [tab, setTab] = useState('overview')
  const [tests, setTests] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎄 Christmas Giveaway</h1>
          <p className="text-sm text-gray-500">25 Days of Christmas · Affiliate Roulette × Pulse</p>
        </div>
        {tab !== 'entries' && (
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={tests} onChange={(e) => setTests(e.target.checked)} className="accent-violet-600" />
            Show test data (preview mode)
          </label>
        )}
      </div>

      {tests && tab !== 'entries' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Showing test spins and prizes from preview mode. They never use real prize stock.
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(([v, label]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === v ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab tests={tests} />}
      {tab === 'winners' && <WinnersTab tests={tests} />}
      {tab === 'entries' && <EntriesTab />}
    </div>
  )
}
