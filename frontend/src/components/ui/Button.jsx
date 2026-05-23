export default function Button({
  children,
  loading = false,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-6 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg',
    outline: 'border-2 border-violet-600 text-violet-600 hover:bg-violet-50 active:scale-[0.98]',
    ghost: 'text-violet-600 hover:bg-violet-50 active:scale-[0.98]',
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
