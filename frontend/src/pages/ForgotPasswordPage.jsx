import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import AuthLayout from '../components/layout/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import client from '../api/client'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [serverMsg, setServerMsg] = useState('')
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm()

  async function onSubmit(data) {
    setServerMsg('')
    try {
      await client.post('/auth/forgot-password', { email: data.email })
      setSent(true)
      // Pass email through location state so OTP page can use it
      setTimeout(() => navigate('/otp', { state: { email: data.email } }), 2000)
    } catch (err) {
      setServerMsg(err.response?.data?.error || 'Something went wrong. Please try again.')
    }
  }

  return (
    <AuthLayout
      footerLink={
        <span>
          Remembered it?{' '}
          <Link to="/login" className="text-violet-600 hover:underline font-medium">Sign in</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email and we'll send you a reset code.
          </p>
        </div>

        {serverMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {serverMsg}
          </div>
        )}

        {sent && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
            Code sent! Check your email — redirecting you now…
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="john@example.com"
          error={errors.email?.message}
          required
          disabled={sent}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
          })}
        />

        <Button type="submit" loading={isSubmitting} disabled={sent} className="w-full mt-1">
          Send reset code
        </Button>
      </form>
    </AuthLayout>
  )
}
