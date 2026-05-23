import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import SignupForm from '../features/signup/SignupForm'
import { Link } from 'react-router-dom'

export default function SignupPage() {
  const navigate = useNavigate()

  return (
    <AuthLayout
      footerLink={
        <span>
          Already have an account?{' '}
          <Link to="/login" className="text-violet-600 hover:underline font-medium">Sign In</Link>
        </span>
      }
    >
      <SignupForm onSuccess={() => navigate('/chat')} />
    </AuthLayout>
  )
}
