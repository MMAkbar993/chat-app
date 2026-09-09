import { useState, useMemo } from 'react'

// Answers are deliberately specific — sizes, limits, exact button names — because the vague
// version of each of these is already what support gets asked. Anything stated here as a hard
// number is enforced in the backend (see utils/plan.js and the upload/call/group controllers);
// if one of those changes, change it here too.
const FAQ = [
  {
    category: 'Account & Identity',
    items: [
      {
        q: 'Why do I have to verify my identity before I can use Pulse?',
        a: 'Pulse is a closed network for the iGaming and affiliate industry, so every account is tied to a real, verified person. Identity verification (KYC) runs once, through our verification partner Didit, and takes a few minutes. Until it completes you can sign in but you will be held on the verification screen rather than dropped into chat.',
      },
      {
        q: 'How long does identity verification take?',
        a: 'Usually a couple of minutes. Some checks are referred for manual review, which can take longer — you do not need to stay on the page, and you can sign back in later to see the result. If yours has been sitting unresolved for more than a day, email pulse@affiliateroulette.com.',
      },
      {
        q: 'Can I change my name after verifying?',
        a: 'Your legal name is locked to your verified identity and cannot be edited, which is the point of verifying it. What you can change is your Display Name — the name other people see. You choose it from the parts of your verified name, so you can go by your first name, your surname, or first and last only.',
      },
      {
        q: 'What is the difference between the verified badge and a verified website?',
        a: 'The identity badge means you personally passed KYC. A verified website means you have proved you control a specific domain, which is what links you publicly to a company. They are separate, and you can have one without the other.',
      },
      {
        q: 'How do I deactivate or delete my account?',
        a: 'Both are in Settings under Account. Deactivating hides your profile and stops notifications while keeping your data, so you can come back. Deleting is permanent and removes your account and messages — it cannot be undone.',
      },
    ],
  },
  {
    category: 'Website Verification',
    items: [
      {
        q: 'How do I verify my website?',
        a: 'Go to Settings → Website Verification, enter your domain, and you will be given a meta tag. Paste it into the <head> section of your homepage, publish the change, then come back and click Verify. You only need it on the homepage, and you can remove it after verification succeeds.',
      },
      {
        q: 'My developers need a few days to add the tag. Will it expire?',
        a: 'No. The snippet stays the same until the site is verified. You can close the page, sign out, come back next week, and Settings → Website Verification will still show the exact same tag waiting for you. Do not worry about regenerating it.',
      },
      {
        q: 'I added the tag but verification says it cannot find it. What now?',
        a: 'The most common cause is a firewall. Sites behind Cloudflare and similar services often block automated requests, so our check gets refused before it ever sees your HTML — the tag is fine, we just cannot read it. When that happens we tell you so, and you have two options: allow the user agent "PulseSiteVerifier" in your firewall rules, or use the DNS method below. Other causes worth ruling out: the tag is on a staging site rather than the live one, it sits outside the <head>, or the change has not been published yet.',
      },
      {
        q: 'Can I verify without touching my website code?',
        a: 'Yes. On the verification screen, open "Can\'t edit your <head>? Verify with a DNS record instead". It gives you a TXT record to add at your DNS provider. DNS is not affected by firewalls or caching layers, so it works on sites where the meta tag check cannot. Allow a few minutes for the record to propagate before clicking Verify.',
      },
      {
        q: 'Someone else already verified my company domain.',
        a: 'A domain belongs to one account at a time. If it is already claimed, you will be shown who holds it and offered the option to request representation of that company. The current owner approves or declines, and can also transfer ownership to you outright.',
      },
      {
        q: 'What is a representative?',
        a: 'Someone the domain owner has approved to appear under that company without owning the domain themselves — useful for affiliate managers and sales staff at the same brand. Owners manage this list in Settings → Website Verification and can revoke access at any time.',
      },
    ],
  },
  {
    category: 'Messaging & Files',
    items: [
      {
        q: 'What can I send in a chat?',
        a: 'Text, images, video, audio notes, and files. You can also paste an image straight from your clipboard into the message box, reply to a specific message, forward messages to other conversations, and react with emoji.',
      },
      {
        q: 'How big can a file be?',
        a: 'On the free plan, uploads are capped at 5MB per file. Pro removes the cap. The file keeps its original name for whoever receives it.',
      },
      {
        q: 'Can I edit or delete a message after sending it?',
        a: 'Yes. Text messages can be edited, and the recipient sees that it was edited. Deleting gives you two choices: Delete for me removes it from your view only, and Delete for everyone removes it from the conversation entirely.',
      },
      {
        q: 'If I start typing and switch chats, do I lose what I wrote?',
        a: 'No. Each conversation keeps its own draft, so switching away and coming back leaves your half-written message where you left it.',
      },
      {
        q: 'I sent a message and it did not appear for the other person.',
        a: 'Pulse waits for the server to confirm each message and tells you if it did not go through, so an unsent message will not silently disappear. If you see the offline warning, your connection dropped — it reconnects on its own, and you can resend once it does.',
      },
      {
        q: 'How do I find an old message?',
        a: 'Use the search box at the top of the chat list, then use the filter icon inside it to narrow the search to names or to message content — or leave it on Everything to search both at once.',
      },
    ],
  },
  {
    category: 'Contacts & Search',
    items: [
      {
        q: 'How do I find someone on Pulse?',
        a: 'Open Add Contact and search by their username, or switch to the business tab to search by company. You can also send someone your profile link to have them add you directly.',
      },
      {
        q: 'How does searching by business work?',
        a: 'It matches three things: the company name on a profile, any verified website that company owns, and the domain of a work email address. So someone who signed up with a company address will still be found by their company name even if they never added a website. Free email domains such as Gmail are excluded, for obvious reasons.',
      },
      {
        q: 'Why is business search greyed out for me?',
        a: 'Searching by business name is a Pro feature. Searching by username is available on every plan.',
      },
    ],
  },
  {
    category: 'Pro Plan & Billing',
    items: [
      {
        q: 'What do I get with Pro?',
        a: 'Unlimited file size on uploads, unlimited voice and video call minutes, group chats, business-name search, and Google Calendar scheduling. The free plan includes 30 minutes of calls per month and 5MB uploads.',
      },
      {
        q: 'How do I upgrade, change, or cancel my plan?',
        a: 'Settings → Billing. Payments are handled by Stripe; Pulse never sees or stores your card details. Cancelling leaves Pro active until the end of the period you have already paid for.',
      },
    ],
  },
  {
    category: 'Social Profiles',
    items: [
      {
        q: 'Which social accounts can I connect?',
        a: 'X (Twitter), Instagram, Facebook, YouTube, Twitch, and Kick connect through their own login screens. LinkedIn is added by pasting your profile URL, because LinkedIn does not offer this kind of connection.',
      },
      {
        q: 'A social connection failed. How do I find out why?',
        a: 'The popup now reports the reason the platform gave us rather than a generic failure. If it mentions permissions or scopes, disconnect the account in Settings → Social Profiles and connect it again so a fresh permission grant is issued.',
      },
      {
        q: 'Can I connect two accounts on the same platform?',
        a: 'One account per platform per profile. Connecting a second one replaces the first.',
      },
    ],
  },
  {
    category: 'Privacy & Security',
    items: [
      {
        q: 'How do I turn on two-factor authentication?',
        a: 'Settings → Two-Factor Authentication. It uses an authenticator app, and once enabled you will be asked for a code each time you sign in on a new device.',
      },
      {
        q: 'How do I know who has been signing in to my account?',
        a: 'Settings → Device History lists recent sign-ins. Anything you do not recognise is worth changing your password over, and worth telling us about.',
      },
      {
        q: 'Someone is bothering me. What can I do?',
        a: 'Block them from the conversation menu or their profile. Blocked users cannot message or call you, and you can review the list in Settings → Blocked Users. If someone is breaking the rules, report it through Settings → Feedback & Support.',
      },
      {
        q: 'Does dark mode stay on?',
        a: 'Yes. Your choice is remembered on that browser, so it survives reloads and future sessions.',
      },
    ],
  },
]

function QaRow({ item, darkMode, open, onToggle }) {
  return (
    <div className={`border-b last:border-b-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`w-full flex items-start justify-between gap-3 text-left py-3.5 ${
          darkMode ? 'hover:text-white' : 'hover:text-gray-900'
        }`}
      >
        <span className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{item.q}</span>
        <svg
          className={`w-4 h-4 mt-0.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <p className={`text-sm leading-relaxed pb-4 pr-7 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {item.a}
        </p>
      )}
    </div>
  )
}

export default function FaqSection({ darkMode }) {
  const [search, setSearch] = useState('')
  // Keyed by "category::question" so two categories can't collide on a similar wording.
  const [openKey, setOpenKey] = useState(null)

  const term = search.trim().toLowerCase()

  const groups = useMemo(() => {
    if (!term) return FAQ
    // Search answers as well as questions — people describe the symptom they have, not the
    // question we happened to write ("cloudflare", "5mb", "can't find the tag").
    return FAQ
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) => i.q.toLowerCase().includes(term) || i.a.toLowerCase().includes(term)
        ),
      }))
      .filter((g) => g.items.length > 0)
  }, [term])

  const total = groups.reduce((n, g) => n + g.items.length, 0)
  const card = `rounded-2xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className="space-y-4">
      <div className={`${card} p-5`}>
        <h4 className={`text-sm font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Frequently Asked Questions
        </h4>
        <p className={`text-xs mb-4 ${sub}`}>
          Search below, or browse by topic. Still stuck? Settings → Feedback &amp; Support reaches a human.
        </p>

        <div className="relative">
          <svg
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the FAQ…"
            className={`w-full rounded-xl pl-10 pr-9 py-2.5 text-sm outline-none border ${
              darkMode
                ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500'
                : 'bg-white border-gray-200 placeholder-gray-400'
            } focus:ring-2 focus:ring-violet-400`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {term && (
          <p className={`text-xs mt-2 ${sub}`}>
            {total === 0
              ? 'No answers matched. Try a different word, or contact support below.'
              : `${total} ${total === 1 ? 'answer' : 'answers'} for “${search.trim()}”`}
          </p>
        )}
      </div>

      {groups.map((group) => (
        <div key={group.category} className={`${card} p-5`}>
          <h5 className={`text-xs font-bold uppercase tracking-wide mb-1 ${darkMode ? 'text-violet-300' : 'text-violet-600'}`}>
            {group.category}
          </h5>
          <div>
            {group.items.map((item) => {
              const key = `${group.category}::${item.q}`
              return (
                <QaRow
                  key={key}
                  item={item}
                  darkMode={darkMode}
                  // While searching, show every match expanded — collapsing a result set the
                  // user just filtered down to makes them click twice for what they asked for.
                  open={term ? true : openKey === key}
                  onToggle={() => setOpenKey(openKey === key ? null : key)}
                />
              )
            })}
          </div>
        </div>
      ))}

      <div className={`${card} p-5 flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Didn&apos;t find your answer?
          </p>
          <p className={`text-xs mt-0.5 ${sub}`}>We usually reply within one business day.</p>
        </div>
        <a
          href="mailto:pulse@affiliateroulette.com"
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors shrink-0"
        >
          Contact Support
        </a>
      </div>
    </div>
  )
}
