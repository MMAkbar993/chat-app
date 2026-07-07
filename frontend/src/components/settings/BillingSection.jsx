import { useState, useEffect } from 'react'
import client from '../../api/client'
import UpgradeModal from '../../features/payment/UpgradeModal'

const STATUS_STYLE = {
  active:    { label: 'Active',    bg: 'bg-green-100 text-green-700' },
  past_due:  { label: 'Past Due',  bg: 'bg-orange-100 text-orange-700' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-200 text-gray-600' },
  incomplete: { label: 'Incomplete', bg: 'bg-yellow-100 text-yellow-700' },
  inactive:  { label: 'No Active Plan', bg: 'bg-gray-200 text-gray-600' },
}

const INVOICE_STATUS_STYLE = {
  paid:           'bg-green-100 text-green-700',
  open:           'bg-yellow-100 text-yellow-700',
  void:           'bg-gray-200 text-gray-600',
  uncollectible:  'bg-red-100 text-red-700',
  draft:          'bg-gray-200 text-gray-600',
}

const CARD_BRAND_LABEL = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
}

export default function BillingSection({ darkMode }) {
  const dm = darkMode
  const [billing, setBilling] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    client.get('/payment/billing')
      .then(({ data }) => setBilling(data))
      .catch(() => setBilling(null))
      .finally(() => setLoading(false))
  }, [])

  const sub  = dm ? 'text-gray-400' : 'text-gray-500'
  const card = `rounded-2xl border ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const status = STATUS_STYLE[billing?.status] || STATUS_STYLE.inactive
  const planLabel = billing?.plan
    ? billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1)
    : 'Free'
  const price = billing?.plan === 'yearly' ? '€70.00/year' : billing?.plan === 'monthly' ? '€6.99/month' : null
  const renewalDate = billing?.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="space-y-4">

      {/* Current plan */}
      <div className={`${card} p-5`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>{planLabel} Plan</h3>
              <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${status.bg}`}>{status.label}</span>
            </div>
            {price && <p className={`text-sm mt-1 ${sub}`}>{price}</p>}
            {renewalDate && (
              <p className={`text-xs mt-1 ${sub}`}>
                {billing.cancelAtPeriodEnd ? 'Cancels on' : 'Renews on'} {renewalDate}
              </p>
            )}
            {!billing?.plan && (
              <p className={`text-sm mt-1 ${sub}`}>You're not currently subscribed to a paid plan.</p>
            )}
          </div>
          <button
            onClick={() => setShowUpgrade(true)}
            className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl px-4 py-2 transition-colors shrink-0"
          >
            {billing?.status === 'active' ? 'Manage Plan' : 'Upgrade'}
          </button>
        </div>
      </div>

      {/* Payment method */}
      <div className={`${card} p-5`}>
        <h4 className={`text-sm font-bold mb-3 ${dm ? 'text-white' : 'text-gray-900'}`}>Payment Method</h4>
        {billing?.paymentMethod ? (
          <div className="flex items-center gap-3">
            <span className={`w-11 h-8 rounded-md flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${dm ? 'bg-gray-700' : 'bg-gray-800'}`}>
              {(CARD_BRAND_LABEL[billing.paymentMethod.brand] || billing.paymentMethod.brand || 'CARD').slice(0, 4).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${dm ? 'text-white' : 'text-gray-900'}`}>
                {CARD_BRAND_LABEL[billing.paymentMethod.brand] || billing.paymentMethod.brand} •••• {billing.paymentMethod.last4}
              </p>
              <p className={`text-xs ${sub}`}>
                Expires {String(billing.paymentMethod.expMonth).padStart(2, '0')}/{billing.paymentMethod.expYear}
              </p>
            </div>
          </div>
        ) : (
          <p className={`text-xs ${sub}`}>No payment method on file.</p>
        )}
      </div>

      {/* Invoice history */}
      <div className={`${card} p-5`}>
        <h4 className={`text-sm font-bold mb-3 ${dm ? 'text-white' : 'text-gray-900'}`}>Invoice History</h4>
        {billing?.invoices?.length > 0 ? (
          <div className="space-y-2">
            {billing.invoices.map((inv) => (
              <div
                key={inv.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${dm ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}
              >
                <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${dm ? 'bg-gray-700 text-violet-300' : 'bg-violet-100 text-violet-600'}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5-2h5a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${dm ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(inv.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                  <p className={`text-xs ${sub}`}>{inv.amount.toFixed(2)} {inv.currency}</p>
                </div>
                <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 shrink-0 ${INVOICE_STATUS_STYLE[inv.status] || 'bg-gray-200 text-gray-600'}`}>
                  {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                </span>
                {(inv.invoicePdf || inv.hostedInvoiceUrl) && (
                  <a
                    href={inv.invoicePdf || inv.hostedInvoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-violet-500 hover:text-violet-700 shrink-0"
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-xs ${sub}`}>No invoices yet.</p>
        )}
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  )
}
