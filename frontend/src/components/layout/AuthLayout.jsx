function ChatMockup() {
  return (
    <svg viewBox="0 0 320 220" className="w-full h-auto rounded-xl" role="img" aria-label="Chat app preview">
      <rect width="320" height="220" rx="16" fill="#ffffff" />

      {/* Header */}
      <circle cx="30" cy="30" r="12" fill="#7C3AED" />
      <rect x="50" y="22" width="90" height="7" rx="3.5" fill="#4C1D95" opacity="0.85" />
      <rect x="50" y="34" width="50" height="5" rx="2.5" fill="#22C55E" opacity="0.8" />
      <circle cx="290" cy="28" r="3" fill="#D1D5DB" />
      <circle cx="278" cy="28" r="3" fill="#D1D5DB" />
      <circle cx="266" cy="28" r="3" fill="#D1D5DB" />
      <line x1="16" y1="52" x2="304" y2="52" stroke="#F3F4F6" strokeWidth="2" />

      {/* Incoming bubble */}
      <rect x="16" y="66" width="150" height="26" rx="13" fill="#F3F4F6" />
      <rect x="28" y="75" width="90" height="6" rx="3" fill="#9CA3AF" />

      {/* Outgoing bubble */}
      <rect x="154" y="100" width="150" height="34" rx="16" fill="#7C3AED" />
      <rect x="168" y="110" width="80" height="6" rx="3" fill="#EDE9FE" />
      <rect x="168" y="120" width="110" height="6" rx="3" fill="#EDE9FE" opacity="0.8" />

      {/* Incoming bubble with avatar */}
      <circle cx="26" cy="152" r="10" fill="#A78BFA" />
      <rect x="44" y="142" width="120" height="26" rx="13" fill="#F3F4F6" />
      <rect x="56" y="151" width="70" height="6" rx="3" fill="#9CA3AF" />

      {/* Outgoing short bubble */}
      <rect x="220" y="176" width="84" height="24" rx="12" fill="#A78BFA" />
      <rect x="232" y="184" width="50" height="6" rx="3" fill="#EDE9FE" />
    </svg>
  )
}

export default function AuthLayout({ children, footerLink }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — form */}
      <div className="flex flex-col w-full lg:w-1/2 bg-white px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-md mx-auto flex flex-col min-h-full">
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
        </div>
      </div>

      {/* Right panel — hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-700 via-violet-800 to-violet-950 relative overflow-hidden items-center justify-center">
        {/* Background dots pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Floating emoji decorations */}
        <span className="absolute top-12 left-16 text-4xl animate-float select-none">🥳</span>
        <span className="absolute top-10 right-20 text-4xl animate-float-slow select-none">👍</span>
        <span className="absolute bottom-24 left-10 text-4xl animate-float-reverse select-none">🤝</span>
        <span className="absolute bottom-16 right-12 text-4xl animate-float select-none">❤️</span>
        <span className="absolute top-1/2 right-8 text-3xl animate-float-slow select-none">😎</span>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center px-10 text-center">
          {/* App screenshot card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 shadow-2xl border border-white/20 mb-8 w-full max-w-sm">
            <ChatMockup />
          </div>

          <h2 className="text-white text-2xl font-bold mb-3 leading-tight">
            Pulse. Collaborate.<br />Succeed.
          </h2>
          <p className="text-violet-200 text-sm leading-relaxed max-w-xs">
            Join thousands of professionals on the platform built for real connections and real results.
          </p>

          {/* Stat pills */}
          <div className="flex gap-3 mt-6">
            {[['10K+', 'Members'], ['4.9★', 'Rating'], ['99%', 'Uptime']].map(([val, lab]) => (
              <div key={lab} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center">
                <div className="text-white font-bold text-sm">{val}</div>
                <div className="text-violet-300 text-xs">{lab}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
