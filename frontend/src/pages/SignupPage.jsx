import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import SignupForm from '../features/signup/SignupForm'
import Modal from '../components/ui/Modal'
import FaqSection from '../components/settings/FaqSection'

export default function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = searchParams.get('next') || null
  // Set by the home page's "Start with Pro". Wording only: sign-up, KYC and payment are unchanged.
  const wantsPro = searchParams.get('plan') === 'pro'
  const [showFaq, setShowFaq] = useState(false)

  return (
    <AuthLayout
      wide
      footerLink={
        <div className="space-y-2">
          <div>
            Already have an account?{' '}
            <Link to={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'} className="text-violet-600 hover:underline font-medium">Sign In</Link>
          </div>
          {/* Someone deciding whether to hand over ID/KYC info to sign up is exactly who
              benefits from the FAQ before committing, not after — a modal here keeps it one
              tap away without turning the signup page itself into a help article. */}
          <button
            type="button"
            onClick={() => setShowFaq(true)}
            className="text-sm font-medium text-violet-600 hover:underline"
          >
            Have questions? View our FAQ
          </button>
        </div>
      }
    >
      {wantsPro && (
        <div role="note" className="mb-6 flex gap-3 rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-900">
          <svg aria-hidden="true" className="w-4 h-4 mt-0.5 shrink-0 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            You're signing up for Pro. Create your account and verify your ID first; you'll choose
            billing after that.
          </p>
        </div>
      )}
      <SignupForm onSuccess={() => navigate('/verify')} />

      <Modal isOpen={showFaq} onClose={() => setShowFaq(false)} maxWidth="max-w-2xl" scroll>
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <FaqSection darkMode={false} />
        </div>
      </Modal>
    </AuthLayout>
  )
}
