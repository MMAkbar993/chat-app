export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', variant = 'danger', onConfirm, onCancel, darkMode }) {
  if (!open) return null

  const confirmColors = {
    danger:  'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white',
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className={`w-80 rounded-2xl shadow-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`font-semibold text-base mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <p className={`text-sm mb-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${confirmColors[variant] || confirmColors.danger}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
