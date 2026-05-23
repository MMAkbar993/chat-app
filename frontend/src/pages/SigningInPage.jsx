import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SigningInPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        const fullyVerified = user.subscription_status === 'active' && user.kyc_status === 'verified'
        navigate(fullyVerified ? '/chat' : '/verify', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [user, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
      <img src="/full-logo.png" alt="ConnectAR" className="h-10" />
      <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Signing you in…</p>
    </div>
  )
}
