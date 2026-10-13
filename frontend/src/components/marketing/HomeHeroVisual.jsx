import { P } from './mockupIcons'
import { I, Badge, WindowFrame } from './MockupParts'
import SocialIcon from '../ui/SocialIcon'
import GroupAvatar from '../ui/GroupAvatar'

// The home page hero: what Pulse actually looks like. A desktop chat with call buttons and the
// verified profile behind the name, a phone on the chat list, and a second phone mid video call.
// Illustration only (aria-hidden); people and companies are fictional.
//
// PEOPLE photos: drop licensed headshots into public/marketing/people/ and set `photo` here.
// Until then each shows as coloured initials, and the layout is the same either way.
const PEOPLE = {
  daniel: { name: 'Daniel Reyes', role: 'Affiliate Manager', color: 'from-sky-400 to-blue-600', photo: null },
  alex: { name: 'Alex Carter', color: 'from-amber-400 to-orange-500', photo: null },
  lena: { name: 'Lena Fischer', color: 'from-pink-400 to-rose-500', photo: null },
  marco: { name: 'Marco Rossi', color: 'from-emerald-400 to-teal-500', photo: null },
}

function Person({ who, className = 'w-8 h-8 text-[11px]' }) {
  const p = PEOPLE[who]
  if (p.photo) return <img src={p.photo} alt="" className={`rounded-full object-cover shrink-0 ${className}`} />
  const initials = p.name.split(' ').map((w) => w[0]).join('')
  return (
    <span className={`rounded-full shrink-0 flex items-center justify-center font-bold text-white bg-linear-to-br ${p.color} ${className}`}>
      {initials}
    </span>
  )
}

function RoundButton({ d, className = '' }) {
  return (
    <span className={`w-7 h-7 rounded-full flex items-center justify-center ${className}`}>
      <I d={d} className="w-3.5 h-3.5" />
    </span>
  )
}

function DesktopChat() {
  return (
    <WindowFrame>
      <div className="text-left bg-gray-50 night:bg-gray-950">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white night:bg-gray-900 border-b border-gray-100 night:border-gray-800">
          <span className="relative">
            <Person who="daniel" className="w-8 h-8 text-[11px]" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white night:border-gray-900" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 night:text-white">Daniel Reyes</p>
            <p className="text-[10px] text-green-500">Online</p>
          </div>
          {/* the chat header's own buttons: voice call, video call */}
          <RoundButton d={P.phone} className="text-violet-600 bg-violet-50 night:bg-violet-500/15 night:text-violet-300" />
          <RoundButton d={P.video} className="text-violet-600 bg-violet-50 night:bg-violet-500/15 night:text-violet-300" />
        </div>
        <div className="px-4 py-4 space-y-2.5">
          <div className="flex items-end gap-2">
            <Person who="daniel" className="w-5 h-5 text-[8px]" />
            <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-white night:bg-gray-900 px-3 py-2 text-[11px] text-gray-700 night:text-gray-200 shadow-sm">
              Hi! We're launching a new casino brand next month. Open to a partnership?
            </div>
          </div>
          <div className="ml-auto max-w-[75%] rounded-2xl rounded-br-sm bg-violet-600 px-3 py-2 text-[11px] text-white shadow-sm">
            Sounds interesting. Let me take a look at your profile first.
          </div>
        </div>
        <div className="px-4 py-2.5 bg-white night:bg-gray-900 border-t border-gray-100 night:border-gray-800">
          <div className="h-7 rounded-full bg-gray-100 night:bg-gray-800" />
        </div>
      </div>
    </WindowFrame>
  )
}

function ProfileCard() {
  return (
    <div className="w-max max-w-full rounded-2xl bg-white night:bg-gray-900 p-4 text-left shadow-2xl shadow-violet-900/20 ring-1 ring-gray-100 night:ring-gray-800">
      <div className="flex items-center gap-3">
        <Person who="daniel" className="w-11 h-11 text-sm" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 night:text-white">Daniel Reyes</p>
          <p className="text-[11px] text-gray-500 night:text-gray-400">{PEOPLE.daniel.role}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 whitespace-nowrap">
        <Badge>KYC Verified</Badge>
        <Badge>Website Verified</Badge>
        <Badge>Socials Verified</Badge>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-violet-600 night:text-violet-300">
          <I d={P.check} className="w-3 h-3 text-green-500" stroke={3} /> northstarbet.com
        </p>
        <div className="flex gap-1">
          {['twitter', 'instagram', 'youtube'].map((k) => <SocialIcon key={k} platform={k} size={22} />)}
        </div>
      </div>
    </div>
  )
}

// A modern handset: thin dark bezel, island, home indicator. Width comes from the parent.
function Phone({ children, className = '', dark = false }) {
  return (
    <div className={`rounded-[2rem] bg-gray-900 p-[5px] shadow-2xl shadow-violet-900/30 ring-1 ring-black/10 ${className}`}>
      <div className={`relative overflow-hidden rounded-[1.7rem] aspect-[9/19] ${dark ? 'bg-gray-950' : 'bg-white night:bg-gray-950'}`}>
        <div className={`flex items-center justify-between px-5 pt-2 text-[8px] font-semibold ${dark ? 'text-white' : 'text-gray-900 night:text-white'}`}>
          <span>9:41</span>
          <span className="w-14 h-3.5 rounded-full bg-gray-900" />
          <span className="tracking-tighter">●●●</span>
        </div>
        {children}
        <span className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full ${dark ? 'bg-white/70' : 'bg-gray-900/80 night:bg-white/70'}`} />
      </div>
    </div>
  )
}

const CHAT_ROWS = [
  { who: 'daniel', name: 'Daniel Reyes', preview: "Yes, let's discuss this.", time: '10:24' },
  { group: ['lena', 'marco'], name: 'Marketing Team', preview: 'Lena: new campaign ideas', time: '09:41', unread: 3 },
  { group: ['alex', 'daniel'], name: 'SBC Lisbon 2026', preview: 'See you there!', time: 'Yesterday' },
  { who: 'alex', name: 'Alex Carter', preview: 'Sent a file', time: 'Mon', icon: P.file },
  { who: 'marco', name: 'Marco Rossi', preview: 'Voice call · 12 min', time: 'Mon', icon: P.phone },
]

const NAV = [
  { label: 'Chats', d: P.chat, active: true },
  { label: 'Calls', d: P.phone },
  { label: 'Contacts', d: P.user },
  { label: 'Settings', d: P.gear },
]

function ChatListScreen() {
  return (
    <div className="flex flex-col h-[calc(100%-1rem)] text-left">
      <div className="flex items-center justify-between px-3 pt-2">
        <img src="/full-logo.png" alt="" className="h-3.5" />
        <span className="w-4 h-4 text-gray-500"><I d={P.search} className="w-3.5 h-3.5" /></span>
      </div>
      <div className="mx-3 mt-2 flex items-center gap-1.5 rounded-full bg-gray-100 night:bg-gray-800 px-2.5 py-1 text-[8px] text-gray-400">
        <I d={P.search} className="w-2.5 h-2.5" /> Search or start a chat
      </div>
      <div className="mx-3 mt-2 flex gap-1 text-[8px] font-semibold">
        <span className="rounded-full bg-violet-600 text-white px-2 py-0.5">All</span>
        <span className="rounded-full bg-gray-100 night:bg-gray-800 text-gray-500 px-2 py-0.5">Contacts</span>
        <span className="rounded-full bg-gray-100 night:bg-gray-800 text-gray-500 px-2 py-0.5">Groups</span>
      </div>
      <ul className="mt-1.5 flex-1">
        {CHAT_ROWS.map((r) => (
          <li key={r.name} className="flex items-center gap-2 px-3 py-1.5">
            {r.group ? (
              <GroupAvatar members={r.group.map((k) => ({ avatar: PEOPLE[k].photo }))} size={26} ringClass="ring-white night:ring-gray-950" />
            ) : (
              <Person who={r.who} className="w-[26px] h-[26px] text-[8px]" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="truncate text-[9px] font-semibold text-gray-900 night:text-white">{r.name}</p>
                <span className="shrink-0 text-[7px] text-gray-400">{r.time}</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <p className="flex items-center gap-0.5 truncate text-[8px] text-gray-500 night:text-gray-400">
                  {r.icon && <I d={r.icon} className="w-2.5 h-2.5 shrink-0" />}
                  {r.preview}
                </p>
                {r.unread && (
                  <span className="shrink-0 w-3 h-3 rounded-full bg-violet-600 text-white text-[7px] font-bold flex items-center justify-center">{r.unread}</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mb-3 mx-2 grid grid-cols-4 border-t border-gray-100 night:border-gray-800 pt-1.5">
        {NAV.map((n) => (
          <span key={n.label} className={`flex flex-col items-center gap-0.5 text-[7px] ${n.active ? 'text-violet-600 font-semibold' : 'text-gray-400'}`}>
            <I d={n.d} className="w-3 h-3" />
            {n.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function VideoCallScreen() {
  const p = PEOPLE.daniel
  return (
    <div className="absolute inset-0 flex flex-col items-center text-center">
      {p.photo ? (
        <img src={p.photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-linear-to-b from-slate-700 via-slate-800 to-gray-950" />
      )}
      <div className="relative mt-8 px-2">
        <p className="text-[10px] font-semibold text-white drop-shadow">Daniel Reyes</p>
        <p className="text-[8px] text-white/80">00:24</p>
      </div>
      {!p.photo && <Person who="daniel" className="relative mt-6 w-16 h-16 text-lg ring-4 ring-white/10" />}
      {/* your own camera, top corner */}
      <div className="absolute top-14 right-2 w-7 h-10 rounded-md bg-linear-to-br from-violet-400 to-fuchsia-500 ring-1 ring-white/30" />
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2.5">
        <span className="w-6 h-6 rounded-full bg-white/15 text-white flex items-center justify-center"><I d={P.mic} className="w-3 h-3" /></span>
        <span className="w-6 h-6 rounded-full bg-white/15 text-white flex items-center justify-center"><I d={P.video} className="w-3 h-3" /></span>
        <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center rotate-135"><I d={P.phone} className="w-3 h-3" /></span>
      </div>
    </div>
  )
}

export default function HomeHeroVisual() {
  return (
    <div aria-hidden="true" className="relative w-full max-w-xl mx-auto lg:max-w-none">
      {/* soft ring behind the phones */}
      <div className="absolute -right-10 top-0 w-[70%] aspect-square rounded-full bg-violet-200/40 night:bg-violet-500/10 ring-1 ring-violet-300/40 night:ring-violet-500/20" />

      <div className="relative grid grid-cols-[1fr] sm:grid-cols-[1fr_auto] items-start gap-0">
        {/* desktop chat and profile card; the phone only overlaps its edge, so the call buttons stay in view */}
        <div className="relative z-10 pt-6 sm:pt-10 sm:mr-[-0.75rem]">
          <DesktopChat />
          <div className="relative -mt-6 ml-6 sm:ml-10">
            <ProfileCard />
          </div>
        </div>

        {/* phones: hidden on phones (too small to read) and from 1024 to 1279px, where the hero
            column is too narrow for the chat, its profile card and a phone side by side */}
        <div className="relative hidden sm:block lg:hidden xl:block w-[11.5rem] xl:w-[12rem]">
          <Phone dark className="absolute top-8 left-[30%] xl:left-[46%] 2xl:left-[58%] w-[92%] rotate-6">
            <VideoCallScreen />
          </Phone>
          <Phone className="relative z-20">
            <ChatListScreen />
          </Phone>
          <span className="absolute -top-3 -right-3 z-30 w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/40 ring-4 ring-white night:ring-gray-950">
            <I d={P.shield} className="w-5 h-5" />
          </span>
        </div>
      </div>
    </div>
  )
}
