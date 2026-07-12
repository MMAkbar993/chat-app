function FeatureBadge({ icon, label }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 whitespace-nowrap">
      <span className="w-6 h-6 rounded-full flex items-center justify-center bg-violet-100 text-violet-600 shrink-0">
        {icon}
      </span>
      {label}
    </div>
  )
}

function ChatMockup() {
  const contacts = [
    { name: 'Nichol', color: 'bg-rose-400' },
    { name: 'Titus', color: 'bg-amber-400' },
    { name: 'Geoffrey', color: 'bg-emerald-400' },
    { name: 'Laverty', color: 'bg-sky-400' },
  ]
  const chats = [
    { name: 'Aaryian Jose', preview: 'is typing…', time: '02:40 PM', color: 'bg-rose-400' },
    { name: 'Sarika Jain', preview: 'Do you know which…', time: '06:12 AM', color: 'bg-amber-400' },
    { name: 'Clyde Smith', preview: 'Haha oh man 🔥', time: '03:15 AM', color: 'bg-emerald-400' },
  ]

  return (
    <div className="rounded-2xl border-4 border-[#1B1533] bg-white shadow-2xl overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1B1533]">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
      </div>

      <div className="flex h-64 sm:h-72">
        {/* Icon rail */}
        <div className="hidden sm:flex flex-col items-center gap-3 w-10 py-3 bg-gray-50 border-r border-gray-100">
          <span className="w-6 h-6 rounded-lg bg-violet-600" />
          <span className="w-6 h-6 rounded-lg bg-gray-200" />
          <span className="w-6 h-6 rounded-lg bg-gray-200" />
          <span className="w-6 h-6 rounded-lg bg-gray-200" />
        </div>

        {/* Chat list */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col">
          <div className="px-3 py-2 text-[11px] font-semibold text-gray-700 border-b border-gray-100">Chats</div>
          <div className="flex gap-1.5 px-3 py-2 border-b border-gray-100 overflow-hidden">
            {contacts.map((c) => (
              <span key={c.name} className={`w-6 h-6 rounded-full ${c.color} shrink-0 ring-2 ring-white`} />
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {chats.map((c) => (
              <div key={c.name} className="flex items-center gap-2 px-3 py-2 border-b border-gray-50">
                <span className={`w-7 h-7 rounded-full ${c.color} shrink-0`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-800 truncate">{c.name}</span>
                    <span className="text-[9px] text-gray-400 shrink-0">{c.time}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 truncate block">{c.preview}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation */}
        <div className="flex-1 flex flex-col bg-gray-50/60">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 bg-white">
            <span className="w-6 h-6 rounded-full bg-sky-400" />
            <div>
              <div className="text-[11px] font-semibold text-gray-800">Edward Lietz</div>
              <div className="text-[9px] text-emerald-500">Online</div>
            </div>
          </div>
          <div className="flex-1 px-3 py-3 flex flex-col gap-2 overflow-hidden">
            <div className="self-start max-w-[75%] bg-white rounded-xl rounded-tl-sm px-2.5 py-1.5 text-[10px] text-gray-700 shadow-sm">
              Hi there! I'm interested in adding our casino to your website.
            </div>
            <div className="self-start max-w-[75%] bg-white rounded-xl rounded-tl-sm px-2.5 py-1.5 text-[10px] text-gray-700 shadow-sm">
              Can you tell me more about what you offer?
            </div>
            <div className="self-end max-w-[75%] bg-gradient-to-r from-sky-400 to-violet-600 rounded-xl rounded-tr-sm px-2.5 py-1.5 text-[10px] text-white shadow-sm">
              Absolutely, you can see our verified websites in my bio — we work on a hybrid model.
            </div>
          </div>
          <div className="px-3 py-2 border-t border-gray-100 bg-white">
            <div className="h-6 rounded-full bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthLayout({ children, footerLink, wide = false }) {
  return (
    <div className="h-dvh flex overflow-hidden">
      {/* Left panel — form */}
      <div className="flex flex-col w-full lg:w-1/2 bg-white px-6 py-10 overflow-y-auto">
        <div className={`w-full mx-auto flex flex-col min-h-full ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
          {/* Logo */}
          <div className="mb-8 flex justify-start">
            <img src="/full-logo.png" alt="Pulse" className="h-9" />
          </div>

          {/* Form content */}
          <div className="flex-1">
            {children}
          </div>

          {/* Footer link */}
          {footerLink && (
            <div className="mt-8 text-center text-sm text-gray-500">
              {footerLink}
            </div>
          )}

          <div className="mt-6 text-center text-xs text-gray-400">
            &copy;{new Date().getFullYear()} Pulse. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right panel — hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-y-auto overflow-x-hidden bg-[#EDEBFB] flex-col items-center px-12 py-10">
        {/* Decorative dashed ring */}
        <div className="absolute w-[560px] h-[560px] rounded-full border border-dashed border-violet-300/60" />

        <div className="relative w-full max-w-2xl flex flex-col gap-6 m-auto">
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-sm font-semibold text-violet-600 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              FOR IGAMING PROFESSIONALS
            </span>
          </div>

          <h1 className="text-5xl font-extrabold text-[#1B1533] leading-tight">
            The <span className="bg-gradient-to-r from-sky-400 to-violet-600 bg-clip-text text-transparent">Ultimate</span> iGaming<br />Messaging Web App
          </h1>

          <p className="text-base text-gray-600 max-w-lg">
            Connecting verified professionals from across the iGaming industry in one secure messaging platform. Experience the future of B2B networking and communication.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 bg-white/70 rounded-full px-5 py-3 w-full">
            <FeatureBadge
              label="No Fake Accounts"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75l1.5 1.5 3.75-3.75M12 3l7 3v5c0 4.5-3 8.25-7 9.5-4-1.25-7-5-7-9.5V6l7-3z" />
                </svg>
              }
            />
            <FeatureBadge
              label="No Anonymous Users"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={2} />
                  <circle cx="9" cy="10.5" r="1.75" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 16c0-1.66 1.34-3 3-3s3 1.34 3 3M13.5 9.5h4M13.5 13h4" />
                </svg>
              }
            />
            <FeatureBadge
              label="Only Verified Professionals"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            />
          </div>

          <ChatMockup />
        </div>
      </div>
    </div>
  )
}
