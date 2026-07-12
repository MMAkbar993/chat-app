import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, error, icon: Icon, iconPosition = 'left', className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-base font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none ${iconPosition === 'right' ? 'right-3' : 'left-3'}`}>
            <Icon size={16} />
          </span>
        )}
        <input
          ref={ref}
          className={`w-full border rounded-xl px-4 py-3.5 text-base text-gray-800 bg-white placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400
            transition-colors duration-150
            ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${error ? 'border-red-400 focus:ring-red-300 focus:border-red-400' : 'border-gray-200'}
            ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
})

export default Input
