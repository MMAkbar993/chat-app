import heroImg from '../../assets/hero.png'

export default function AuthLayout({ children, footerLink }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — form */}
      <div className="flex flex-col w-full lg:w-1/2 bg-white px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-md mx-auto flex flex-col min-h-full">
          {/* Logo */}
          <div className="mb-8 flex justify-start">
            <img src="/full-logo.png" alt="Connect" className="h-9" />
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
            <img
              src={heroImg}
              alt="App preview"
              className="rounded-xl w-full object-cover"
            />
          </div>

          <h2 className="text-white text-2xl font-bold mb-3 leading-tight">
            Connect. Collaborate.<br />Succeed.
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
