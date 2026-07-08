export default function AuthLayout({ children, footerLink }) {
  return (
    <div className="h-screen flex overflow-hidden">
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
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-[#EDEBFB]">
        <img
          src="/Right Side.png"
          alt="Pulse — the ultimate iGaming messaging web app"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
