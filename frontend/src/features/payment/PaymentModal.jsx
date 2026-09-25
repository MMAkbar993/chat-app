import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import StripeCardForm from './StripeCardForm'
import { stripePromise } from '../../stripe/stripeLoader'
import client from '../../api/client'

const PRICE_LABEL = {
  yearly: '€70.00/year',
  monthly: '€6.99/month',
}

// Stripe renders the card fields in its own iframe, so Tailwind cannot reach them — the theme
// has to be handed over as an appearance object.
//
// fontFamily used to be 'inherit'. Inside the iframe there is nothing to inherit from, so every
// field fell back to the browser's default serif while the rest of the modal used the app's
// sans — which is most of why the form looked like it came from another decade. The stack is
// now spelled out explicitly; the app itself uses Tailwind's default sans, so this matches it.
const FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ' +
  '"Helvetica Neue", Arial, "Noto Sans", sans-serif'

function stripeAppearance(darkMode) {
  const c = darkMode
    ? {
        primary: '#8B5CF6',
        bg: '#1F2937',
        field: '#111827',
        text: '#F9FAFB',
        muted: '#9CA3AF',
        placeholder: '#6B7280',
        border: '#374151',
        borderHover: '#4B5563',
        danger: '#F87171',
        tabHoverBg: '#1F2937',
        selectedBg: 'rgba(139,92,246,0.12)',
        focusRing: 'rgba(139,92,246,0.25)',
        shadow: 'none',
      }
    : {
        primary: '#7C3AED',
        bg: '#FFFFFF',
        field: '#FFFFFF',
        text: '#111827',
        muted: '#4B5563',
        placeholder: '#9CA3AF',
        border: '#E5E7EB',
        borderHover: '#C4B5FD',
        danger: '#DC2626',
        tabHoverBg: '#FAFAFA',
        selectedBg: '#F5F3FF',
        focusRing: 'rgba(124,58,237,0.12)',
        shadow: '0 1px 2px rgba(16,24,40,0.04)',
      }

  return {
    theme: darkMode ? 'night' : 'stripe',
    variables: {
      colorPrimary: c.primary,
      colorBackground: c.bg,
      colorText: c.text,
      colorTextSecondary: c.muted,
      colorTextPlaceholder: c.placeholder,
      colorDanger: c.danger,
      colorIcon: c.muted,
      fontFamily: FONT_STACK,
      fontSizeBase: '15px',
      borderRadius: '12px',
      spacingUnit: '4px',
      spacingGridRow: '16px',
    },
    rules: {
      // Fields: one hairline border and a whisper of shadow, rather than the heavy boxes
      // Stripe ships by default.
      '.Input': {
        backgroundColor: c.field,
        border: `1px solid ${c.border}`,
        boxShadow: c.shadow,
        padding: '12px 14px',
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
      },
      '.Input:hover': { border: `1px solid ${c.borderHover}` },
      '.Input:focus': {
        border: `1px solid ${c.primary}`,
        boxShadow: `0 0 0 4px ${c.focusRing}`,
      },
      '.Input--invalid': { border: `1px solid ${c.danger}`, boxShadow: 'none' },
      '.Input::placeholder': { color: c.placeholder },

      '.Label': {
        fontSize: '13px',
        fontWeight: '500',
        color: c.muted,
        marginBottom: '6px',
      },

      // Payment-method tabs read as one row of equal cards; the selected one is filled rather
      // than double-ringed, which is what made the old version look boxy.
      '.Tab': {
        backgroundColor: c.field,
        border: `1px solid ${c.border}`,
        boxShadow: c.shadow,
        padding: '12px 10px',
        transition: 'border-color 120ms ease, background-color 120ms ease',
      },
      '.Tab:hover': { backgroundColor: c.tabHoverBg, border: `1px solid ${c.borderHover}` },
      '.Tab--selected': {
        backgroundColor: c.selectedBg,
        border: `1px solid ${c.primary}`,
        boxShadow: 'none',
        color: c.primary,
      },
      '.Tab:focus': { boxShadow: `0 0 0 4px ${c.focusRing}` },
      '.TabLabel': { fontWeight: '500' },
      '.TabLabel--selected': { color: c.primary },
      '.TabIcon--selected': { fill: c.primary },

      '.Error': { fontSize: '13px', marginTop: '6px' },
    },
  }
}

export default function PaymentModal({ isOpen, onClose, planType = 'monthly', standalone = false, darkMode = false }) {
  const navigate = useNavigate()
  const [step, setStep] = useState('loading')  // 'loading' | 'card' | 'success' | 'error'
  const [clientSecret, setClientSecret] = useState(null)
  const [error, setError] = useState('')
  // The plan is already chosen by the time this opens, so the subscription is created on open
  // rather than behind a button. StrictMode invokes effects twice in dev, and this one is not
  // idempotent — without the guard it would create two subscriptions.
  const started = useRef(false)

  useEffect(() => {
    if (!isOpen || started.current) return
    started.current = true

    async function start() {
      try {
        const res = await client.post('/payment/create-subscription', { planType })
        if (!res.data.clientSecret) {
          // Nothing left to pay — either Stripe isn't configured (dev bypass) or the invoice
          // came to zero, and the backend has already activated the subscription. Still show
          // a real confirmation rather than just vanishing: the account IS upgraded, and the
          // user has no way to tell unless we say so.
          if (standalone) setStep('success')
          else navigate('/verify')
          return
        }
        setClientSecret(res.data.clientSecret)
        setStep('card')
      } catch (err) {
        setError(err.response?.data?.error || 'Could not start payment. Please try again.')
        setStep('error')
      }
    }

    start()
  }, [isOpen, planType, standalone, navigate])

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" scroll darkMode={darkMode}>
      <div className="p-7">
        {step === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-10">
            <span className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Setting up your payment…</p>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col gap-4 py-2">
            <div className={`border rounded-xl px-4 py-3 text-sm ${
              darkMode ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {error}
            </div>
            <Button className="w-full" onClick={onClose}>Close</Button>
          </div>
        )}

        {step === 'card' && clientSecret && (
          <div className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Payment Details</h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {PRICE_LABEL[planType]} · Cancel anytime
              </p>
            </div>
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: stripeAppearance(darkMode) }}
            >
              <StripeCardForm
                planType={planType}
                standalone={standalone}
                darkMode={darkMode}
                onSuccess={() => setStep('success')}
              />
            </Elements>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-500/15' : 'bg-green-100'}`}>
              <svg className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>You're upgraded!</h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Your {planType === 'yearly' ? 'annual' : 'monthly'} plan is now active. Enjoy the new features.
              </p>
            </div>
            <Button className="w-full" onClick={onClose}>Done</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
