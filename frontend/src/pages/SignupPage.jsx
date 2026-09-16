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
            className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline"
          >
            Have questions? View our FAQ
          </button>
        </div>
      }
    >
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
