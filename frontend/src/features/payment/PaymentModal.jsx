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

export default function PaymentModal({ isOpen, onClose, planType = 'monthly', standalone = false }) {
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
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" scroll>
      <div className="p-7">
        {step === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-10">
            <span className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Setting up your payment…</p>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col gap-4 py-2">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
            <Button className="w-full" onClick={onClose}>Close</Button>
          </div>
        )}

        {step === 'card' && clientSecret && (
          <div className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
              <p className="text-sm text-gray-500 mt-1">
                {PRICE_LABEL[planType]} · Cancel anytime
              </p>
            </div>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#7C3AED',
                    colorBackground: '#ffffff',
                    colorText: '#111827',
                    colorTextSecondary: '#6b7280',
                    colorDanger: '#dc2626',
                    borderRadius: '12px',
                    fontFamily: 'inherit',
                    fontSizeBase: '14px',
                    spacingGridRow: '12px',
                  },
                  rules: {
                    '.Input': {
                      border: '1px solid #e5e7eb',
                      boxShadow: 'none',
                      padding: '10px 14px',
                    },
                    '.Input:focus': {
                      border: '1px solid #7C3AED',
                      boxShadow: '0 0 0 3px rgba(124,58,237,0.15)',
                    },
                    '.Label': {
                      fontWeight: '500',
                      color: '#6b7280',
                      marginBottom: '4px',
                    },
                    '.Tab': {
                      border: '1px solid #e5e7eb',
                      boxShadow: 'none',
                    },
                    '.Tab:hover': {
                      border: '1px solid #c4b5fd',
                    },
                    '.Tab--selected': {
                      border: '1px solid #7C3AED',
                      boxShadow: '0 0 0 1px #7C3AED',
                    },
                  },
                },
              }}
            >
              <StripeCardForm
                planType={planType}
                standalone={standalone}
                onSuccess={() => setStep('success')}
              />
            </Elements>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">You're upgraded!</h2>
              <p className="text-sm text-gray-500 mt-1">
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
