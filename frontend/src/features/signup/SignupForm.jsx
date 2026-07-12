import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import CountrySelect from './CountrySelect'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'

function MailIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

export default function SignupForm({ onSuccess }) {
  const { login } = useAuth()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur' })

  const password = watch('password')

  async function onSubmit(data) {
    setServerError('')
    try {
      const res = await client.post('/auth/register', data)
      login(res.data.user, res.data.accessToken)
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg
        || err.response?.data?.error
        || 'Registration failed. Please try again.'
      setServerError(msg)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create an account</h1>
        <p className="text-base text-gray-500 mt-1">Personal Information &amp; Primary Role</p>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Name (Legal name only)"
          placeholder="John Doe"
          error={errors.full_name?.message}
          required
          iconPosition="right"
          icon={UserIcon}
          {...register('full_name', {
            required: 'Full name is required',
            minLength: { value: 2, message: 'At least 2 characters' },
            maxLength: { value: 255, message: 'Too long' },
          })}
        />

        <Input
          label="Username"
          placeholder="johndoe123"
          error={errors.username?.message}
          required
          iconPosition="right"
          icon={UserIcon}
          {...register('username', {
            required: 'Username is required',
            minLength: { value: 3, message: 'At least 3 characters' },
            maxLength: { value: 30, message: 'Max 30 characters' },
            pattern: {
              value: /^[a-zA-Z0-9_]+$/,
              message: 'Only letters, numbers and underscores',
            },
          })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="country"
          control={control}
          rules={{ required: 'Country is required' }}
          render={({ field }) => (
            <div className="relative">
              <CountrySelect
                value={field.value}
                onChange={field.onChange}
                error={errors.country?.message}
              />
            </div>
          )}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="john@example.com"
          error={errors.email?.message}
          required
          iconPosition="right"
          icon={MailIcon}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
          })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-base font-medium text-gray-700">
          Primary Role <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            className={`w-full appearance-none border rounded-xl px-4 py-3.5 pr-10 text-base leading-tight bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition-colors
              ${errors.primary_role ? 'border-red-400' : 'border-gray-200'}`}
            {...register('primary_role', { required: 'Primary role is required' })}
            defaultValue=""
          >
            <option value="" disabled>Select role</option>
            <option value="affiliate_publisher">Affiliate (Publisher)</option>
            <option value="casino_operator">Casino / Operator</option>
            <option value="affiliate_manager">Affiliate Manager</option>
            <option value="game_provider">Game Provider</option>
            <option value="payment_provider">Payment Provider</option>
            <option value="platform_provider">Platform Provider (White Label / Turnkey)</option>
            <option value="media_seo_agency">Media / SEO Agency</option>
            <option value="event_organizer">Event Organizer</option>
            <option value="influencer_streamer">Influencer / Streamer</option>
            <option value="investor_advisor">Investor / Advisor</option>
            <option value="compliance_legal">Compliance / Legal</option>
            <option value="kyc_aml_provider">KYC / AML Provider</option>
            <option value="other">Other</option>
          </select>
          <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {errors.primary_role && <p className="text-xs text-red-500">{errors.primary_role.message}</p>}
      </div>

      {watch('primary_role') === 'other' && (
        <Input
          label="Other (please specify)"
          placeholder="Describe your role"
          error={errors.primary_role_other?.message}
          required
          {...register('primary_role_other', {
            required: 'Please describe your role',
            minLength: { value: 2, message: 'At least 2 characters' },
            maxLength: { value: 255, message: 'Too long' },
          })}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
                onChange: () => trigger('confirm_password'),
              })}
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
          {errors.password
            ? <p className="text-xs text-red-500">{errors.password.message}</p>
            : <p className="text-xs text-gray-400">Min 8 characters</p>
          }
        </div>

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          error={errors.confirm_password?.message}
          required
          {...register('confirm_password', {
            required: 'Please confirm your password',
            validate: (val) => val === password || 'Passwords do not match',
          })}
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-400"
          {...register('terms', { required: 'You must agree to the terms' })}
        />
        <span className="text-sm text-gray-600">
          I agree to the{' '}
          <a href="/terms" target="_blank" rel="noopener" className="text-violet-600 hover:underline font-medium">Terms &amp; Conditions</a>
          {' '}and{' '}
          <a href="/privacy" target="_blank" rel="noopener" className="text-violet-600 hover:underline font-medium">Privacy Policy</a>
        </span>
      </label>
      {errors.terms && <p className="text-xs text-red-500 -mt-2">{errors.terms.message}</p>}

      <p className="text-xs text-gray-400">2FA can be set up under Settings once logged in.</p>

      <Button type="submit" loading={isSubmitting} variant="gradient" className="w-full mt-1">
        Create Account
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Button>
    </form>
  )
}
