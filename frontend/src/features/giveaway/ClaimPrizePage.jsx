import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './giveaway.css'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { previewClaim, errorMessage } from './giveawayApi'
import { setPendingClaim } from '../../utils/pendingClaim'
import { XmasShell, GiftBox, SnowDrift } from './XmasDecor'

// /claim?code=XMAS-XXXX-XXXX: where a Christmas giveaway winner turns their prize code into the
// prize. Shows the prize to anyone; claiming needs a verified Pulse account, so a visitor who is
// not there yet is sent through sign up and the ID check and brought back here afterwards
// (utils/pendingClaim.js, picked up in ChatPage.jsx).

const GOLD = 'xmas-btn-gold w-full px-6 py-3.5 text-lg'
const OUTLINE = 'xmas-btn-outline w-full px-6 py-3'
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
      <h1 className="text-center text-2xl font-extrabold">Claim your prize</h1>
      <p className="mt-1 text-center text-sm text-white/80">Enter the prize code you won in the Christmas giveaway.</p>
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="XMAS-XXXX-XXXX" aria-label="Prize code"
        className="xmas-input mt-5 px-4 py-3 text-center font-mono text-lg tracking-widest uppercase" />
      <button type="submit" disabled={!CODE_RE.test(code)} className={`${GOLD} mt-4`}>Continue</button>
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

  // Already claimed: if it was this account, the server answers with the chat (and opens it now
  // if it never opened), so the winner sees the same "you claimed it" screen again.
  const checkOwnClaim = preview?.claimed && verified
  useEffect(() => {
    if (!checkOwnClaim || done) return
    let gone = false
    client.post('/giveaway/claim', { code })
      .then(({ data }) => { if (!gone) setDone(data) })
      .catch(() => { /* claimed by someone else: the message below stays */ })
    return () => { gone = true }
  }, [checkOwnClaim, done, code])

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
        <h1 className="text-center text-2xl font-extrabold">Prize code not found</h1>
        <p className="mt-2 text-center text-white/80">{error}</p>
        <Link to="/claim" className={`${OUTLINE} mt-5`}>Try another code</Link>
      </div>
    )
  } else if (!preview || authLoading) {
    body = <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-transparent" />
  } else if (done) {
    const line = proLine(done.prize, done.proEndsAt)
    body = (
      <div className="text-center xmas-pop">
        <GiftBox width={140} className="mx-auto" />
        <h1 className="mt-3 text-3xl font-extrabold">Congratulations!</h1>
        <p className="mt-2 text-lg">{done.alreadyClaimed ? 'You have already claimed' : 'You have claimed'} <strong>{done.prize.name}</strong>.</p>
        {line && <p className="mt-2 font-semibold text-amber-200">{line}</p>}
        <p className="mt-3 text-sm text-white/70">
          {done.conversationId ? 'We have opened a chat with the Affiliate Roulette team, who will arrange the rest with you.' : 'The Affiliate Roulette team will contact you on Pulse to arrange the rest.'}
        </p>
        <Link to={done.conversationId ? `/chat?conversation=${done.conversationId}` : '/chat'} className={`${GOLD} mt-6`}>
          {done.conversationId ? 'Open the chat' : 'Go to Pulse'}
        </Link>
      </div>
    )
  } else {
    const { prize } = preview
    const head = (
      <div className="text-center">
        <p className="xmas-eyebrow text-xs font-bold uppercase tracking-[0.25em] text-amber-300">Christmas giveaway prize</p>
        {prize.group === 'mega' ? <p className="mt-4 text-6xl" aria-hidden="true">🏆</p> : <GiftBox width={130} className="mx-auto mt-4" />}
        <h1 className="mt-3 text-2xl font-extrabold"><span className="xmas-gold-text">{prize.name}</span></h1>
        <p className="xmas-code-box mx-auto mt-3 w-fit rounded-xl px-4 py-1.5 font-mono tracking-widest text-amber-200">{preview.code}</p>
      </div>
    )
    let action
    if (preview.claimed) {
      action = <p className="text-center text-white/80">This prize has already been claimed.{!user && <> If it was you, <Link to="/login" onClick={() => setPendingClaim(preview.code)} className="underline">sign in to Pulse</Link> to see it.</>}</p>
    } else if (preview.closed) {
      action = <p className="text-center text-white/75">Prizes had to be claimed by {formatDate(preview.claimDeadline)}.</p>
    } else if (!user) {
      action = (
        <div>
          <p className="text-center text-sm text-white/75">To claim it, create a free Pulse account and verify your ID. It takes about 2 minutes. We will bring you back here after.</p>
          <Link to="/signup" onClick={() => setPendingClaim(preview.code)} className={`${GOLD} mt-5`}>Create a free Pulse account</Link>
          <Link to="/login" onClick={() => setPendingClaim(preview.code)} className={`${OUTLINE} mt-3`}>I already have an account</Link>
        </div>
      )
    } else if (!verified) {
      action = (
        <div>
          <p className="text-center text-sm text-white/75">One last step: verify your ID so we know the prize goes to a real person. We will bring you back here after.</p>
          <Link to="/verify" onClick={() => setPendingClaim(preview.code)} className={`${GOLD} mt-5`}>Verify my ID</Link>
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
                className="xmas-input mt-1.5 px-4 py-3 font-mono text-sm" />
              <p className="mt-1.5 text-xs text-white/55">Please double check it. Crypto sent to a wrong address cannot be returned.</p>
            </div>
          )}
          <p className="text-center text-sm text-white/75">Claiming as <strong>{user.display_name || user.full_name}</strong>.</p>
          <button type="button" onClick={claim} disabled={busy || (prize.needsWallet && !wallet)} className={`${GOLD} mt-4`}>
            {busy ? 'Claiming…' : 'Claim my prize'}
          </button>
        </div>
      )
    }
    body = (
      <div>
        {head}
        <div className="mt-6">{action}</div>
        {error && <p className="mt-4 text-center text-sm font-semibold text-amber-100" role="alert">{error}</p>}
        <p className="mt-6 text-center text-xs text-white/60">Claim by {formatDate(preview.claimDeadline)} · <Link to="/christmas/terms" className="underline hover:text-white">Giveaway terms</Link></p>
      </div>
    )
  }

  return (
    <XmasShell>
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="xmas-panel xmas-rays xmas-pop w-full max-w-md rounded-[1.75rem] px-6 pb-14 pt-7 sm:px-8">
          <div className="relative z-10">{body}</div>
          <SnowDrift className="h-10" />
        </div>
      </main>
    </XmasShell>
  )
}
