import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import SignupForm from '../features/signup/SignupForm'

export default function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = searchParams.get('next') || null

  return (
    <AuthLayout
      footerLink={
        <span>
          Already have an account?{' '}
          <Link to={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'} className="text-violet-600 hover:underline font-medium">Sign In</Link>
        </span>
      }
    >
      <SignupForm onSuccess={() => navigate(nextPath || '/chat')} />
    </AuthLayout>
  )
}
