export default function StepIndicator({ currentStep = 1 }) {
  const steps = [
    { number: 1, label: 'Payment' },
    { number: 2, label: 'KYC Verification' },
  ]

  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((step, idx) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
              ${currentStep >= step.number
                ? 'bg-violet-600 text-white'
                : 'bg-gray-200 text-gray-500'
              }`}>
              {step.number}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap
              ${currentStep >= step.number ? 'text-violet-600' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`w-16 h-0.5 mb-4 mx-2 transition-colors
              ${currentStep > step.number ? 'bg-violet-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
