import { useState, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import Button from '../components/ui/Button'
import client from '../api/client'

export default function OtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputs = useRef([])

  function handleChange(i, value) {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[i] = value
    setDigits(next)
    if (value && i < 5) inputs.current[i + 1]?.focus()
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    const next = [...digits]
    text.split('').forEach((c, i) => { next[i] = c })
    setDigits(next)
    inputs.current[Math.min(text.length, 5)]?.focus()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const otp = digits.join('')
    if (otp.length < 6) { setError('Enter all 6 digits'); return }
    setError('')
    setLoading(true)
    try {
      const { data } = await client.post('/auth/verify-otp', { email, otp })
      navigate('/reset-password', { state: { resetToken: data.resetToken } })
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code')
    }
    setLoading(false)
  }

  if (!email) {
    return (
      <AuthLayout>
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Invalid link</h1>
          <p className="text-gray-500 text-sm">Please start from the <Link to="/forgot-password" className="text-violet-600 hover:underline">forgot password</Link> page.</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      footerLink={
        <span>
          Wrong email?{' '}
          <Link to="/forgot-password" className="text-violet-600 hover:underline font-medium">Go back</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enter your code</h1>
          <p className="text-sm text-gray-500 mt-1">
            We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-center" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-colors border-gray-200"
            />
          ))}
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Verify code
        </Button>
      </form>
    </AuthLayout>
  )
}
