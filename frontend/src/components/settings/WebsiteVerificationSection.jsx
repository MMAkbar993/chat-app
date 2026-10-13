import { useWebsiteVerification, dnsInfoFor } from '../../hooks/useWebsiteVerification'
import { Illustration, SectionLabel, MethodCard, WebsiteCard, HelpCard } from './WebsiteVerificationParts'
import { METHODS } from './websiteVerificationMethods'

export default function WebsiteVerificationSection({ darkMode, profile, onProfileChange }) {
  const {
    loadingList, pendingRequests, myPendingRequests, representatives, revokingRep, addOpen, setAddOpen, url, setUrl, metaTag, setMetaTag, dnsInfo, setDnsInfo, method, setMethod, verifyEmail, setVerifyEmail, emailCode, setEmailCode, codeSentTo, emailBusy, setWebsiteId, step, setStep, loading, error, setError, claimedInfo, setClaimedInfo, removingId, revokingRepr, reprRevoked, cancellingId, removeDialog, setRemoveDialog, transferTo, setTransferTo, dialogLoading, approved, verifiedWebsites, pendingWebsites, handleRevokeRep, resetAddForm, handleChooseMethod, handleVerify, emailDomain, handleSendEmailCode, handleConfirmEmailCode, handleCancelPending, handleRemoveClick, handleDialogDelete, handleDialogTransfer, handleReprAction, handleCancelRequest, handleRemoveRep,
  } = useWebsiteVerification({ profile, onProfileChange })

  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'
  const inp = `w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${
    darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
  } focus:ring-2 focus:ring-violet-400`
  const codeBg = darkMode ? 'bg-gray-900 text-green-400 border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-200'
  const card = `rounded-2xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`

  // A user already approved as a representative of one website is not limited to that single
  // website — they can still verify a website of their own, or request representation of a
  // second one (e.g. reps both Affiliate Roulette and Pulse). This used to be an early `return`
  // that replaced the entire section with just the "you're a rep" card, which meant there was no
  // way to reach the add-website form or the "request representation" flow below at all once
  // approved. Now it's just a header shown above the normal flow instead of replacing it.
  const isPureRepresentative = (approved && verifiedWebsites.length === 0) && !reprRevoked
  // Representing a company and owning one are independent: someone can verify their own site
  // and still speak for a client's.
  const repWebsites = reprRevoked ? [] : (profile?.rep_websites || [])
  const repDomains = repWebsites
    .map((w) => w.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))
    .join(', ')

  // The "already claimed by someone else" lookup and the "you represent this company" panel
  // describe the same site in two contradictory ways, so once the request is approved the
  // lookup is suppressed outright. The state clearing above handles the live case; this covers
  // a page loaded fresh while that state still exists server-side.
  const alreadyRepresentsClaimedSite = Boolean(
    claimedInfo && (profile?.rep_websites || []).some(
      (w) => w.url?.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
        === claimedInfo.websiteUrl?.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase(),
    ),
  )
  const showClaimedPanel = Boolean(claimedInfo) && !alreadyRepresentsClaimedSite

  // Hoisted so it can render in two places. When the user already has verified sites this
  // belongs directly under that list — the natural place to look after clicking "Verify a
  // Website" — rather than at the very bottom of the page below the reps and info cards,
  // where opening it looked like nothing had happened. On first run there is no list yet,
  // so it stays after the "How it works" walkthrough.
  const addFormBlock = (
    <div className={`${card} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {verifiedWebsites.length === 0 ? 'Verify a Website You Own' : 'Verify Another Website'}
        </h4>
        {verifiedWebsites.length > 0 && (
          <button onClick={() => { resetAddForm(); setAddOpen(false) }} className={`text-xs ${sub} hover:text-gray-700`}>
            Cancel
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</p>
      )}

      {step === 1 && (
        <>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yoursite.com"
            className={`${inp} w-full`}
          />

          <p className={`text-xs mt-4 mb-2 ${sub}`}>
            Choose how to verify. Each route gives different access on Pulse.
          </p>
          <div className="flex flex-wrap gap-3">
            {METHODS.map((m) => (
              <MethodCard key={m.key} darkMode={darkMode} method={m} selected={method === m.key} onSelect={setMethod} />
            ))}
          </div>

          <div className={`flex gap-2 mt-4 rounded-xl px-4 py-3 text-xs ${darkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'}`}>
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span>
              <span className="font-bold">Admin access is for authorised people only.</span>{' '}
              The head tag and DNS record make you the admin of this business on Pulse: you manage its
              business profile and its representatives. Only use those if you own the website or
              administer it.
            </span>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => { resetAddForm(); setAddOpen(false) }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
                darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleChooseMethod}
              disabled={loading || !url.trim()}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {loading ? 'Checking…' : 'Continue'}
            </button>
          </div>
        </>
      )}

      {step === 2 && method === 'meta' && (
        <>
          <div>
            <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Step 1 — Add this tag to your website's &lt;head&gt;</p>
            <p className={`text-xs mb-2 ${sub}`}>Open your website's HTML and paste the following tag inside the &lt;head&gt; section.</p>
            <div className={`rounded-xl border p-3 font-mono text-xs break-all ${codeBg}`}>
              {metaTag}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(metaTag)}
              className="mt-1 text-xs text-violet-500 hover:text-violet-700"
            >
              Copy to clipboard
            </button>
          </div>

          <div className="mt-4">
            <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Step 2 — Click Verify</p>
            <p className={`text-xs mb-3 ${sub}`}>
              Once the tag is live on <span className="font-medium">{url}</span>, click Verify below. You'll become
              the admin of this business on Pulse.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setStep(1); setMetaTag(null); setError('') }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
                darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </div>
        </>
      )}

      {step === 2 && method === 'dns' && (
        <>
          <div>
            <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Step 1 — Add this TXT record to your DNS</p>
            <p className={`text-xs mb-3 ${sub}`}>
              Add the record below at your DNS provider. This route works even when a firewall
              (Cloudflare and similar) blocks our check of the page itself.
            </p>
            {dnsInfo ? (
              <div className="space-y-2">
                <div>
                  <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type</p>
                  <div className={`rounded-lg border p-2 font-mono text-xs ${codeBg}`}>TXT</div>
                </div>
                <div>
                  <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name / Host</p>
                  <div className={`rounded-lg border p-2 font-mono text-xs break-all ${codeBg}`}>{dnsInfo.host}</div>
                </div>
                <div>
                  <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Value</p>
                  <div className={`rounded-lg border p-2 font-mono text-xs break-all ${codeBg}`}>{dnsInfo.value}</div>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(dnsInfo.value)}
                  className="text-xs text-violet-500 hover:text-violet-700"
                >
                  Copy value
                </button>
                <p className={`text-xs ${sub}`}>DNS changes can take a few minutes to propagate before Verify will find them.</p>
              </div>
            ) : (
              <p className={`text-xs ${sub}`}>Preparing your record…</p>
            )}
          </div>

          <div className="mt-4">
            <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Step 2 — Click Verify</p>
            <p className={`text-xs mb-3 ${sub}`}>
              Once the record is live on <span className="font-medium">{url}</span>, click Verify below. You'll become
              the admin of this business on Pulse.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setStep(1); setMetaTag(null); setError('') }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
                darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </div>
        </>
      )}

      {step === 2 && method === 'email' && (
        <>
          <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Verify a company email address</p>
          <p className={`text-xs mb-3 ${sub}`}>
            We'll email a code to an address on <span className="font-medium">{emailDomain}</span>. This lists you as a{' '}
            <span className="font-medium">representative</span> of the company — it doesn't give you admin rights over
            the listing, which need the head tag or the DNS record.
          </p>

          <div className="flex gap-2">
            <input
              value={verifyEmail}
              onChange={(e) => setVerifyEmail(e.target.value)}
              placeholder={`you@${emailDomain}`}
              className={`${inp} flex-1`}
            />
            <button
              onClick={() => handleSendEmailCode()}
              disabled={emailBusy || !verifyEmail.trim()}
              className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {emailBusy ? 'Sending…' : codeSentTo ? 'Resend' : 'Send code'}
            </button>
          </div>

          {codeSentTo && (
            <div className="mt-3 space-y-2">
              <p className={`text-xs ${sub}`}>Code sent to {codeSentTo}. It expires in 15 minutes.</p>
              <div className="flex gap-2">
                <input
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  placeholder="6-digit code"
                  className={`${inp} flex-1 tracking-widest`}
                />
                <button
                  onClick={() => handleConfirmEmailCode()}
                  disabled={emailBusy || emailCode.length < 6}
                  className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {emailBusy ? 'Checking…' : 'Verify email'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => { setStep(1); setError('') }}
            className={`w-full mt-4 rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
              darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Back
          </button>
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-4">

      {/* STATE A — this website is already claimed by someone else */}
      {showClaimedPanel && (
        <>
          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={() => { setClaimedInfo(null); setError('') }}
            className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>

          <div className={`${card} p-6 flex items-center gap-6 flex-wrap`}>
            <Illustration darkMode={darkMode}
              badgeColor={darkMode ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-100 text-violet-600'}
              badge={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              lockColor="bg-orange-500"
            />
            <div className="flex-1 min-w-[220px]">
              <h3 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>This Website Is Already Verified</h3>
              <a
                href={claimedInfo.websiteUrl.startsWith('http') ? claimedInfo.websiteUrl : `https://${claimedInfo.websiteUrl}`}
                target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-violet-600 hover:underline inline-flex items-center gap-1"
              >
                {claimedInfo.websiteUrl}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <p className={`text-sm mt-2 ${sub}`}>This website is already verified and managed by another user.</p>
              <div className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs ${darkMode ? 'bg-violet-900/20 text-violet-300' : 'bg-violet-50 text-violet-700'}`}>
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                We verify website ownership to prevent fraud and misrepresentation, and to keep our community trusted.
              </div>
            </div>
          </div>

          <div className={`${card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-600'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </span>
              <div>
                <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Work for this company?</p>
                <p className={`text-xs mt-0.5 ${sub}`}>
                  Verify a company email address and you'll be listed as a representative straight away.
                  No approval needed.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={verifyEmail}
                  onChange={(e) => setVerifyEmail(e.target.value)}
                  placeholder={`you@${claimedInfo.websiteUrl}`}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-400 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
                  }`}
                />
                <button
                  onClick={() => handleSendEmailCode(claimedInfo.websiteUrl)}
                  disabled={emailBusy || !verifyEmail.trim()}
                  className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {emailBusy ? 'Sending…' : codeSentTo ? 'Resend' : 'Send code'}
                </button>
              </div>
              {codeSentTo && (
                <>
                  <p className={`text-xs ${sub}`}>Code sent to {codeSentTo}. It expires in 15 minutes.</p>
                  <div className="flex gap-2">
                    <input
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      placeholder="6-digit code"
                      className={`flex-1 rounded-xl border px-3 py-2.5 text-sm tracking-widest outline-none focus:ring-2 focus:ring-violet-400 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200 placeholder-gray-400'
                      }`}
                    />
                    <button
                      onClick={() => handleConfirmEmailCode(claimedInfo.websiteUrl)}
                      disabled={emailBusy || emailCode.length < 6}
                      className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
                    >
                      {emailBusy ? 'Checking…' : 'Verify email'}
                    </button>
                  </div>
                </>
              )}
              <p className={`flex items-center gap-1.5 text-xs pt-1 ${sub}`}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Representatives don't manage the company's business profile — that stays with its admin.
              </p>
            </div>
          </div>

          <HelpCard darkMode={darkMode} />
        </>
      )}

      {/* STATE B / C — no active "claimed" lookup */}
      {!showClaimedPanel && (
        <>
          {/* Banner — same treatment as Social Profiles so the two settings pages read as
              one product rather than two different eras of the app. */}
          <div className={`relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8 ${
            darkMode
              ? 'bg-gradient-to-br from-violet-900/50 via-gray-800 to-green-900/30 border border-gray-700'
              : 'bg-gradient-to-br from-violet-100 via-violet-50 to-green-50'
          }`}>
            <div className="relative z-10 max-w-lg">
              <p className={`text-[11px] font-bold uppercase tracking-[0.12em] mb-1.5 ${darkMode ? 'text-violet-300' : 'text-violet-500'}`}>
                Website Verification
              </p>
              <h3 className={`text-2xl sm:text-3xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isPureRepresentative
                  ? "You're an Authorized Representative"
                  : verifiedWebsites.length > 0 ? 'Your Verified Websites' : 'Verify Your Website'}
              </h3>
              <p className={`text-sm mt-2 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {isPureRepresentative
                  ? `You have been approved as an authorized representative${repDomains ? ` of ${repDomains}` : ''}. Your profile now shows your company affiliation.`
                  : verifiedWebsites.length > 0
                    ? 'Verified websites appear on your public profile and show others which companies you represent.'
                    : 'KYC proves who you are. Verifying a website proves where you work — it shows others which company you represent.'}
              </p>
              <p className={`inline-flex items-center gap-2 text-xs font-medium mt-4 rounded-full px-3 py-1.5 ${
                darkMode ? 'bg-gray-900/60 text-gray-300' : 'bg-white/70 text-gray-600'
              }`}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {isPureRepresentative
                  ? 'If you want to add a new website you can do so below.'
                  : 'We only look for your verification tag — never the rest of your site.'}
              </p>
            </div>
            <div aria-hidden="true" className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none select-none">
              {isPureRepresentative ? (
                <Illustration darkMode={darkMode}
                  badgeColor="bg-violet-500 text-white"
                  badge={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  }
                />
              ) : (
                <Illustration darkMode={darkMode}
                  badgeColor="bg-green-500 text-white"
                  badge={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  }
                />
              )}
            </div>
          </div>

          {repWebsites.length > 0 && (
            <>
              <div className={`${card} p-5`}>
                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Companies you represent</p>
                <p className={`text-xs mt-0.5 mb-3 ${sub}`}>Step back from any of these whenever you like.</p>
                <div className="space-y-2">
                  {repWebsites.map((w) => {
                    const host = w.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
                    return (
                      <div key={w.url} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <span className="min-w-0">
                          <span className={`block text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{host}</span>
                          <span className={`block text-xs ${sub}`}>Representative</span>
                        </span>
                        <button
                          onClick={() => handleRemoveRep(w.url)}
                          disabled={revokingRepr === w.url}
                          className="shrink-0 text-xs font-semibold text-red-500 border border-red-200 rounded-xl px-4 py-2 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {revokingRepr === w.url ? 'Removing…' : 'Remove'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── SECTION 1 — the websites themselves ─────────────────────────── */}
          <SectionLabel darkMode={darkMode}>Your Websites</SectionLabel>

          <div className={`${card} px-5 py-4 flex items-center gap-4 flex-wrap`}>
            <div className="flex-1 min-w-[180px]">
              <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {verifiedWebsites.length === 0
                  ? 'No websites verified yet'
                  : `${verifiedWebsites.length} website${verifiedWebsites.length === 1 ? '' : 's'} verified`}
              </p>
              <p className={`text-xs mt-0.5 ${sub}`}>
                {pendingWebsites.length > 0
                  ? `${pendingWebsites.length} awaiting verification`
                  : 'Verified websites appear on your public profile.'}
              </p>
            </div>
            <button
              onClick={() => setAddOpen((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2.5 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Verify a Website
            </button>
          </div>

          {error && !addOpen && (
            <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          {addOpen && addFormBlock}

          {/* Cards, not rows — matches Social Profiles, and finally gives a site awaiting its
              tag somewhere to live. Pending sites appeared nowhere before: the list was
              filtered to verified only, so a half-finished verification was invisible. */}
          {!loadingList && (verifiedWebsites.length > 0 || pendingWebsites.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {verifiedWebsites.map((w) => (
                <WebsiteCard
                  key={w.id}
                  darkMode={darkMode}
                  url={w.url}
                  verified
                  busy={removingId === w.id}
                  onRemove={() => handleRemoveClick(w)}
                />
              ))}
              {pendingWebsites.map((w) => (
                <WebsiteCard
                  key={w.id}
                  darkMode={darkMode}
                  url={w.url}
                  verified={false}
                  busy={removingId === w.id}
                  onCancel={() => handleCancelPending(w)}
                  onContinue={() => {
                    setUrl(w.url)
                    setMetaTag(`<meta name="site-verification" content="${w.verify_token}">`)
                    setDnsInfo(dnsInfoFor(w.url, w.verify_token))
                    setWebsiteId(w.id)
                    setStep(2)
                    setAddOpen(true)
                  }}
                />
              ))}
            </div>
          )}

          {verifiedWebsites.length > 0 && (
            <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs ${darkMode ? 'bg-violet-900/20 text-violet-300' : 'bg-violet-50 text-violet-700'}`}>
              <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Removing a website un-verifies it and may affect your profile visibility.
            </div>
          )}

          {/* ── SECTION 2 — the people attached to those websites ───────────── */}
          {(myPendingRequests.length > 0 || verifiedWebsites.length > 0) && (
            <>
              <SectionLabel darkMode={darkMode}>Representatives</SectionLabel>

              {/* Requests this user sent to somebody else's site */}
              {myPendingRequests.length > 0 && (
                <div className={`rounded-2xl border p-4 space-y-2 ${darkMode ? 'border-yellow-800 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'}`}>
                  <p className={`text-xs font-semibold ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    Your requests — awaiting approval
                  </p>
                  {myPendingRequests.map((r) => {
                    const ownerName = r.owner_display_name || r.owner_full_name || 'the site owner'
                    return (
                      <div key={r.id} className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`text-xs flex-1 ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                          Awaiting approval from <span className="font-medium">{ownerName}</span> for{' '}
                          <span className="font-medium">{r.website_url.replace(/^https?:\/\//, '')}</span>
                        </span>
                        <button
                          onClick={() => handleCancelRequest(r.id)}
                          disabled={cancellingId === r.id}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 shrink-0 font-medium"
                        >
                          {cancellingId === r.id ? 'Cancelling…' : 'Cancel'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Requests waiting on this user, as the site owner */}
              {verifiedWebsites.length > 0 && pendingRequests.length > 0 && (
                <div className={`${card} p-5 space-y-3`}>
                  <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Awaiting your approval
                  </p>
                  {pendingRequests.map((r) => {
                    const name = r.display_name || r.full_name || r.username || 'Unknown'
                    return (
                      <div key={r.id} className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold shrink-0 ${r.avatar_url ? '' : 'bg-violet-500'}`}>
                          {r.avatar_url
                            ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                            : name[0].toUpperCase()}
                        </div>
                        <span className={`flex-1 text-sm min-w-0 truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{name}</span>
                        <button
                          onClick={() => handleReprAction(r.id, 'approve')}
                          className="text-xs font-semibold bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 shrink-0"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReprAction(r.id, 'reject')}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          Reject
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* People already approved on this user's sites */}
              {verifiedWebsites.length > 0 && (
                <div className={`${card} p-5`}>
                  <h4 className={`text-sm font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Authorized representatives</h4>
                  {representatives.length === 0 ? (
                    <p className={`text-xs ${sub}`}>
                      Nobody is authorized to represent your websites yet. Approving a request above adds one.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {representatives.map((r) => {
                        const name = r.display_name || r.full_name || r.username || 'Unknown'
                        return (
                          <div key={r.user_id} className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white text-sm font-bold ${r.avatar_url ? '' : 'bg-violet-500'}`}>
                              {r.avatar_url
                                ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                                : name[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>{name}</p>
                              <p className={`text-xs truncate ${sub}`}>{r.website_url}</p>
                            </div>
                            <button
                              onClick={() => handleRevokeRep(r.user_id)}
                              disabled={revokingRep === r.user_id}
                              className="text-xs text-red-500 hover:text-red-700 shrink-0 disabled:opacity-50"
                            >
                              {revokingRep === r.user_id ? 'Removing…' : 'Remove'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <HelpCard darkMode={darkMode} />
        </>
      )}

      {/* Transfer / delete dialog */}
      {removeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            <h3 className="font-semibold text-base">Remove Website</h3>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="font-medium">{removeDialog.url}</span> has {removeDialog.reps.length} authorized {removeDialog.reps.length === 1 ? 'user' : 'users'}.
              You can transfer admin ownership to one of them, or delete the site and remove all associated users.
            </p>

            {/* Transfer option */}
            <div className={`rounded-xl border p-4 space-y-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Transfer admin to</p>
              <div className="space-y-2">
                {removeDialog.reps.map((r) => {
                  const name = r.display_name || r.full_name || r.username || 'Unknown'
                  return (
                    <label key={r.user_id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="transferTo"
                        value={r.user_id}
                        checked={transferTo === r.user_id}
                        onChange={() => setTransferTo(r.user_id)}
                        className="accent-violet-600"
                      />
                      <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white text-xs font-bold ${r.avatar_url ? '' : 'bg-violet-500'}`}>
                        {r.avatar_url
                          ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                          : name[0].toUpperCase()}
                      </div>
                      <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{name}</span>
                    </label>
                  )
                })}
              </div>
              <button
                onClick={handleDialogTransfer}
                disabled={!transferTo || dialogLoading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-40 transition-colors"
              >
                {dialogLoading ? 'Transferring…' : 'Transfer Ownership'}
              </button>
            </div>

            {/* Delete option */}
            <div className="space-y-2">
              <button
                onClick={handleDialogDelete}
                disabled={dialogLoading}
                className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-40 transition-colors"
              >
                {dialogLoading ? 'Deleting…' : 'Delete Site & Remove All Users'}
              </button>
              <button
                onClick={() => { setRemoveDialog(null); setTransferTo('') }}
                disabled={dialogLoading}
                className={`w-full rounded-xl py-2 text-sm font-semibold border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
