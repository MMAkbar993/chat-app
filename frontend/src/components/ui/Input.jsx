import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, error, icon: Icon, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={16} />
          </span>
        )}
        <input
          ref={ref}
          className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-800 bg-white placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400
            transition-colors duration-150
            ${Icon ? 'pl-10' : ''}
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
