import { Link } from 'react-router-dom'

// One centred card on a soft violet glow — the shape most SaaS sign-in screens share. The
// right-hand marketing panel this replaced had become redundant once the public How It Works
// page existed to do that explaining, and it halved the room the form had to breathe.
//
// Shared by sign in, sign up, forgot/reset password, the OTP step and 2FA, so all of them move
// together. The heading rules below centre each page's title and the line under it without every
// page having to remember to.
export default function AuthLayout({ children, footerLink, wide = false }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#F8F7FD] flex flex-col items-center px-4 py-10 sm:py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_45%,rgba(139,92,246,0.20),transparent_70%)]"
      />

      {/* There is no "/" route — it falls through to /login — so the logo goes to the public
          explainer, the one page a logged-out visitor might actually want from here. */}
      <Link to="/how-it-works" className="relative mb-8">
        <img src="/full-logo.png" alt="Pulse" className="h-10" />
      </Link>

      <main
        className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-xl'} rounded-3xl bg-white px-6 py-8 sm:px-10 sm:py-10 ring-1 ring-gray-100 shadow-[0_24px_64px_-20px_rgba(76,29,149,0.28)]`}
      >
        <div className="[&_h1]:text-center [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1+p]:text-center [&_h1+p]:text-base">
          {children}
        </div>

        {footerLink && (
          <>
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-sm text-gray-400">or</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>
            <div className="text-center text-sm text-gray-500">{footerLink}</div>
          </>
        )}
      </main>

      <footer className="relative mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-400">
        <Link to="/terms" className="hover:text-gray-600">Terms of Service</Link>
        <span aria-hidden="true">•</span>
        <Link to="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
        <span aria-hidden="true">•</span>
        <span>&copy; {new Date().getFullYear()} Pulse. All rights reserved.</span>
      </footer>
    </div>
  )
}
