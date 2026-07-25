import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import AuthLayout from '../components/layout/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

function MailIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = searchParams.get('next') || null
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  async function onSubmit(data) {
    setServerError('')
    try {
      const res = await client.post('/auth/login', data)
      if (res.data.requires2FA) {
        navigate('/2fa', { state: { tempToken: res.data.tempToken } })
        return
      }
      login(res.data.user, res.data.accessToken)
      const { kyc_status } = res.data.user
      if (kyc_status !== 'verified') {
        navigate('/verify')
      } else if (nextPath) {
        navigate(nextPath)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setServerError(err.response?.data?.error || 'Login failed. Please try again.')
    }
  }

  return (
    <AuthLayout
      footerLink={
        <span>
          Don't have an account?{' '}
          <Link to="/signup" className="text-violet-600 hover:underline font-medium">Create an account</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-base text-gray-500 mt-1">Please enter your details to sign in.</p>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {serverError}
          </div>
        )}

        <Input
          label="Email address"
          type="email"
          placeholder="Enter your email"
          error={errors.email?.message}
          required
          iconPosition="right"
          icon={MailIcon}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
          })}
        />

        <div className="flex flex-col gap-1">
          <label className="text-base font-medium text-gray-700">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`w-full border rounded-xl px-4 py-3.5 pr-10 text-base bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition-colors
                ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
              {...register('password', { required: 'Password is required' })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between -mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-400"
              {...register('remember')}
            />
            <span className="text-xs text-gray-600">Remember for 30 days</span>
          </label>
          <Link to="/forgot-password" className="text-xs text-violet-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} variant="gradient" className="w-full mt-1">
          Sign in
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Button>

        <p className="text-center text-xs text-gray-400">
          By signing in you agree to our{' '}
          <Link to="/terms" className="text-violet-600 hover:underline">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-violet-600 hover:underline">Privacy Policy</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
