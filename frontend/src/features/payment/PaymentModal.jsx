import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import Modal from '../../components/ui/Modal'
import StepIndicator from '../../components/ui/StepIndicator'
import Button from '../../components/ui/Button'
import PlanCard from './PlanCard'
import StripeCardForm from './StripeCardForm'
import { stripePromise } from '../../stripe/stripeLoader'
import client from '../../api/client'

export default function PaymentModal({ isOpen, onClose, standalone = false }) {
  const navigate = useNavigate()
  const [step, setStep] = useState('plan')  // 'plan' | 'card' | 'success'
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [clientSecret, setClientSecret] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [promoCode, setPromoCode] = useState('')

  async function handleEnterPayment() {
    setLoading(true)
    setError('')
    try {
      const res = await client.post('/payment/create-subscription', { planType: selectedPlan, promoCode: promoCode.trim() || undefined })
      if (!res.data.clientSecret) {
        // No payment step needed — either Stripe isn't configured (dev bypass) or a promo code
        // fully covered the invoice, so the subscription is already active on the backend.
        if (standalone) {
          onClose()
        } else {
          navigate('/verify')
        }
        return
      }
      setClientSecret(res.data.clientSecret)
      setStep('card')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setStep('plan')
    setClientSecret(null)
    setError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md" scroll>
      <div className="p-7">
        {!standalone && <StepIndicator currentStep={step === 'card' ? 2 : 1} />}

        {step === 'plan' && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Choose Your Plan</h2>
            </div>

            {!standalone && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Don't worry — you won't be charged until your identity is verified.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-1">
              <PlanCard plan="monthly" selected={selectedPlan === 'monthly'} onSelect={setSelectedPlan} />
              <PlanCard plan="yearly" selected={selectedPlan === 'yearly'} onSelect={setSelectedPlan} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Promo code (optional)</label>
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter code"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <Button className="w-full" loading={loading} onClick={handleEnterPayment}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Enter Payment Details
            </Button>

            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Your data is securely processed
            </p>
          </div>
        )}

        {step === 'card' && clientSecret && (
          <div className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedPlan === 'yearly' ? '€70.00/year' : '€6.99/month'} · Cancel anytime
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
                    borderRadius: '12px',
                    fontFamily: 'inherit',
                  },
                },
              }}
            >
              <StripeCardForm
                planType={selectedPlan}
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
                Your {selectedPlan} plan is now active. Enjoy the new features.
              </p>
            </div>
            <Button className="w-full" onClick={handleClose}>Done</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
