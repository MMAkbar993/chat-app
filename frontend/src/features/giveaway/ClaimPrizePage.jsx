import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './giveaway.css'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { previewClaim, errorMessage } from './giveawayApi'
import { setPendingClaim } from '../../utils/pendingClaim'

// /claim?code=XMAS-XXXX-XXXX: where a Christmas giveaway winner turns their prize code into the
// prize. Shows the prize to anyone; claiming needs a verified Pulse account, so a visitor who is
// not there yet is sent through sign up and the ID check and brought back here afterwards
// (utils/pendingClaim.js, picked up in ChatPage.jsx).

const CARD = 'rounded-3xl border border-white/10 bg-[#0d2138]/90 p-6 sm:p-8 shadow-2xl backdrop-blur'
const BTN = 'block w-full rounded-2xl px-6 py-3.5 text-center font-bold transition hover:brightness-110 disabled:opacity-50'
const CODE_RE = /^XMAS-[A-Z0-9]{4}-[A-Z0-9]{4}$/

const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

function proLine(prize, proEndsAt) {
  if (prize.proLifetime) return 'Your Pulse Pro is active for life.'
  if (prize.proMonths && proEndsAt) return `Your Pulse Pro is active until ${formatDate(proEndsAt)}.`
  return null
}

function EnterCode() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const code = value.trim().toUpperCase()
  return (
    <form onSubmit={(e) => { e.preventDefault(); navigate(`/claim?code=${encodeURIComponent(code)}`) }}>
      <h1 className="text-2xl font-bold">Claim your prize</h1>
      <p className="mt-1 text-sm text-white/70">Enter the prize code you won in the Christmas giveaway.</p>
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="XMAS-XXXX-XXXX" aria-label="Prize code"
        className="mt-5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center font-mono text-lg tracking-widest text-white uppercase placeholder:text-white/30 focus:border-amber-300 focus:outline-none" />
      <button type="submit" disabled={!CODE_RE.test(code)} className={`${BTN} mt-4 bg-linear-to-r from-red-600 to-amber-500`}>Continue</button>
    </form>
  )
}

export default function ClaimPrizePage() {
  const [params] = useSearchParams()
  const code = (params.get('code') || '').trim().toUpperCase()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [wallet, setWallet] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'Claim your prize | Affiliate Roulette × Pulse'
    return () => { document.title = prev }
  }, [])

  useEffect(() => {
    if (!code) return
    let gone = false
    previewClaim(code)
      .then((data) => { if (!gone) { setPreview(data); setError('') } })
      .catch((err) => { if (!gone) setError(errorMessage(err, 'That prize code could not be checked. Please try again.')) })
    return () => { gone = true }
  }, [code])

  const verified = user?.kyc_status === 'verified'

  async function claim() {
    setBusy(true)
    setError('')
    try {
      const { data } = await client.post('/giveaway/claim', { code, walletAddress: wallet || undefined })
      setDone(data)
      refreshUser()
    } catch (err) {
      setError(errorMessage(err, 'The prize could not be claimed. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  let body
  if (!code) {
    body = <EnterCode />
  } else if (error && !preview) {
    body = (
      <div>
        <h1 className="text-2xl font-bold">Prize code not found</h1>
        <p className="mt-2 text-white/70">{error}</p>
        <Link to="/claim" className={`${BTN} mt-5 bg-white/10`}>Try another code</Link>
      </div>
    )
  } else if (!preview || authLoading) {
    body = <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-transparent" />
  } else if (done) {
    const line = proLine(done.prize, done.proEndsAt)
    body = (
      <div className="text-center xmas-pop">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-3 text-3xl font-extrabold">Congratulations!</h1>
        <p className="mt-2 text-lg">{done.alreadyClaimed ? 'You have already claimed' : 'You have claimed'} <strong>{done.prize.name}</strong>.</p>
        {line && <p className="mt-2 text-emerald-300 font-semibold">{line}</p>}
        <p className="mt-3 text-sm text-white/70">
          {done.conversationId ? 'We have opened a chat with the Affiliate Roulette team, who will arrange the rest with you.' : 'The Affiliate Roulette team will contact you on Pulse to arrange the rest.'}
        </p>
        <Link to={done.conversationId ? `/chat?conversation=${done.conversationId}` : '/chat'} className={`${BTN} mt-6 bg-linear-to-r from-violet-600 to-fuchsia-600`}>
          {done.conversationId ? 'Open the chat' : 'Go to Pulse'}
        </Link>
      </div>
    )
  } else {
    const { prize } = preview
    const head = (
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Christmas giveaway prize</p>
        <p className="mt-3 text-4xl">{prize.group === 'mega' ? '🏆' : '🎁'}</p>
        <h1 className="mt-2 text-2xl font-extrabold">{prize.name}</h1>
        <p className="mt-2 font-mono tracking-widest text-amber-200">{preview.code}</p>
      </div>
    )
    let action
    if (preview.claimed) {
      action = <p className="text-center text-white/75">This prize has already been claimed.{user && <> If it was you, you will find the chat in <Link to="/chat" className="underline">Pulse</Link>.</>}</p>
    } else if (preview.closed) {
      action = <p className="text-center text-white/75">Prizes had to be claimed by {formatDate(preview.claimDeadline)}.</p>
    } else if (!user) {
      action = (
        <div>
          <p className="text-center text-sm text-white/75">To claim it, create a free Pulse account and verify your ID. It takes about 2 minutes. We will bring you back here after.</p>
          <Link to="/signup" onClick={() => setPendingClaim(preview.code)} className={`${BTN} mt-5 bg-linear-to-r from-violet-600 to-fuchsia-600`}>Create a free Pulse account</Link>
          <Link to="/login" onClick={() => setPendingClaim(preview.code)} className={`${BTN} mt-3 bg-white/10`}>I already have an account</Link>
        </div>
      )
    } else if (!verified) {
      action = (
        <div>
          <p className="text-center text-sm text-white/75">One last step: verify your ID so we know the prize goes to a real person. We will bring you back here after.</p>
          <Link to="/verify" onClick={() => setPendingClaim(preview.code)} className={`${BTN} mt-5 bg-linear-to-r from-violet-600 to-fuchsia-600`}>Verify my ID</Link>
        </div>
      )
    } else {
      const isBtc = prize.key.startsWith('btc')
      action = (
        <div>
          {prize.needsWallet && (
            <div className="mb-4">
              <label htmlFor="claim-wallet" className="text-sm font-medium">Your {isBtc ? 'Bitcoin' : 'Ethereum'} wallet address</label>
              <input id="claim-wallet" value={wallet} onChange={(e) => setWallet(e.target.value.trim())} spellCheck={false} autoComplete="off"
                placeholder={isBtc ? 'bc1…' : '0x…'}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder:text-white/30 focus:border-amber-300 focus:outline-none" />
              <p className="mt-1.5 text-xs text-white/55">Please double check it. Crypto sent to a wrong address cannot be returned.</p>
            </div>
          )}
          <p className="text-center text-sm text-white/75">Claiming as <strong>{user.display_name || user.full_name}</strong>.</p>
          <button type="button" onClick={claim} disabled={busy || (prize.needsWallet && !wallet)} className={`${BTN} mt-4 bg-linear-to-r from-red-600 to-amber-500`}>
            {busy ? 'Claiming…' : 'Claim my prize'}
          </button>
        </div>
      )
    }
    body = (
      <div>
        {head}
        <div className="mt-6">{action}</div>
        {error && <p className="mt-4 text-center text-sm text-red-300" role="alert">{error}</p>}
        <p className="mt-6 text-center text-xs text-white/45">Claim by {formatDate(preview.claimDeadline)} · <Link to="/christmas/terms" className="underline hover:text-white">Giveaway terms</Link></p>
      </div>
    )
  }

  return (
    <div className="xmas-page flex min-h-screen flex-col items-center justify-center px-4 py-10 text-white">
      <Link to="/christmas" className="mb-6 flex items-center gap-2.5" aria-label="Back to the Christmas giveaway">
        <img src="/White Pulse Logo.png" alt="Pulse" className="h-7" />
        <span className="text-white/40" aria-hidden="true">×</span>
        <img src="/christmas/ar-logo-santa.png" alt="Affiliate Roulette" className="h-10 w-10 -mt-2" />
      </Link>
      <div className={`${CARD} w-full max-w-md`}>{body}</div>
    </div>
  )
}
