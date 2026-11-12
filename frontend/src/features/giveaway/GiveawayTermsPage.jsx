import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './giveaway.css'
import { XmasShell } from './XmasDecor'

// Terms for the Christmas giveaway. Keep in step with the backend rules and giveawayContent.js.
// TODO before launch: Eddie to confirm the organiser's legal name and address, and how vouchers
// and advertising prizes are delivered.

const SECTIONS = [
  {
    h: '1. The organisers',
    p: [
      'The 25 Days of Christmas giveaway (the "Giveaway") is run by Affiliate Roulette together with Pulse (the "Organisers").',
    ],
  },
  {
    h: '2. Dates',
    p: [
      'The Giveaway runs from 00:00 UTC on 1 December 2026 to 23:59 UTC on 25 December 2026. Prizes must be claimed by 23:59 UTC on 31 January 2027. Unclaimed prizes after that time are lost.',
    ],
  },
  {
    h: '3. Who can enter',
    p: [
      'You must be 18 or over. Employees of the Organisers cannot enter.',
      'The Giveaway is not open to residents of, or people taking part from, North Korea, Iran, Cuba, Crimea, the Donetsk and Luhansk regions, Belarus, Syria, India or mainland China, or anywhere else the Giveaway would be against the law.',
      'One entry per person. Entries are checked by email, connection and browser, and every winner must pass the Pulse ID check before a prize is given.',
    ],
  },
  {
    h: '4. How to play',
    p: [
      'Join with your email and confirm it with the code we send. You get one spin per day (UTC) during the Giveaway. Spins cannot be saved or moved to another day.',
      'Each spin gives no prize or one prize, decided at random on our servers by the chances shown on the Giveaway page. The chances are the same for every entrant and every category.',
    ],
  },
  {
    h: '5. Prizes and limits',
    p: [
      'You may hold one 5% voucher and one 10% voucher and keep playing. Winning any other prize ends your spins for the rest of the Giveaway. Landing on a voucher you already hold counts as no prize.',
      'Some prizes are limited in total and per day. When a prize runs out it shows Limit Reached and landing on it counts as no prize.',
      'Vouchers and advertising prizes are for Affiliate Roulette and are subject to its usual terms. Crypto prizes are sent to a wallet address you give us, worth €10 at the time of sending. Pulse Pro prizes run from the day you claim them. Prizes have no cash alternative, cannot be transferred or sold, and may be replaced by a prize of similar value if one becomes unavailable.',
    ],
  },
  {
    h: '6. Claiming',
    p: [
      'To claim, create a Pulse account, complete the ID check, and enter your prize code on Pulse. The name on your ID must be your own and you must meet section 3. The Organisers will contact you through Pulse to arrange your prize.',
    ],
  },
  {
    h: '7. Fair play',
    p: [
      'The Organisers may disqualify any entry, cancel any prize and block any account where they believe someone has made more than one entry, used throwaway emails, automated tools, VPNs to get around country rules, or otherwise tried to cheat. Their decision is final.',
    ],
  },
  {
    h: '8. Your data',
    p: [
      'We use your email, the category you chose and basic technical data (IP address, country and browser) to run the Giveaway and stop abuse. See the Pulse Privacy Policy for how Pulse handles your data, including the ID check.',
    ],
  },
  {
    h: '9. Changes',
    p: [
      'The Organisers may change, pause or end the Giveaway if something outside their control affects it, such as technical problems or fraud. Any change will be shown on the Giveaway page.',
    ],
  },
]

export default function GiveawayTermsPage() {
  useEffect(() => {
    const prev = document.title
    document.title = 'Giveaway Terms | Affiliate Roulette × Pulse'
    window.scrollTo(0, 0)
    return () => { document.title = prev }
  }, [])

  return (
    <XmasShell right={<Link to="/christmas" className="xmas-btn-outline px-4 py-2 text-sm">Back to the giveaway</Link>}>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="xmas-eyebrow text-xs font-bold uppercase tracking-[0.25em] text-amber-300">Affiliate Roulette × Pulse</p>
        <h1 className="mt-3 text-center text-4xl font-extrabold sm:text-5xl">
          25 Days of <span className="xmas-script xmas-gold-text xmas-title-shadow pr-2">Christmas</span>
        </h1>
        <p className="mt-2 text-center text-lg font-semibold">Giveaway Terms</p>
        <p className="mt-1 text-center text-sm text-white/70">No purchase necessary. 18+ only.</p>
        <div className="xmas-card mt-8 space-y-7 rounded-[1.75rem] p-6 sm:p-9">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-bold text-amber-200">{s.h}</h2>
              {s.p.map((t) => <p key={t.slice(0, 40)} className="mt-2 leading-relaxed text-white/85">{t}</p>)}
            </section>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-white/70">
          <Link to="/privacy" className="underline hover:text-white">Pulse Privacy Policy</Link> · <Link to="/terms" className="underline hover:text-white">Pulse Terms</Link>
        </p>
      </main>
    </XmasShell>
  )
}
