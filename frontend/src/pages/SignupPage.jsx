import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import SignupForm from '../features/signup/SignupForm'
import PaymentModal from '../features/payment/PaymentModal'

export default function SignupPage() {
  const [paymentOpen, setPaymentOpen] = useState(false)

  return (
    <AuthLayout
      footerLink={
        <span>
          Already have an account?{' '}
          <Link to="/login" className="text-violet-600 hover:underline font-medium">Sign In</Link>
        </span>
      }
    >
      <SignupForm onSuccess={() => setPaymentOpen(true)} />

      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
      />
    </AuthLayout>
  )
}
