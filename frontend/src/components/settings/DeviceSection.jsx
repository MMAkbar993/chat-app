import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import ConfirmDialog from '../ui/ConfirmDialog'

function DeviceIcon() {
  return (
    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function getDeviceLabel() {
  const ua = navigator.userAgent
  if (/mobile/i.test(ua)) return 'Mobile Device'
  if (/tablet|ipad/i.test(ua)) return 'Tablet'
  return 'Desktop / Laptop'
}

function getBrowserLabel() {
  const ua = navigator.userAgent
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Edg')) return 'Edge'
  return 'Browser'
}

export default function DeviceSection({ darkMode }) {
  const { logout } = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)
  const [now] = useState(() => new Date().toLocaleString())

  const text    = darkMode ? 'text-white'    : 'text-gray-900'
  const sub     = darkMode ? 'text-gray-400' : 'text-gray-500'
  const rowBg   = darkMode ? 'bg-gray-700'   : 'bg-white border border-gray-100'

  return (
    <>
      <div className="space-y-3">
        <p className={`text-xs ${sub}`}>Devices that are currently signed in to your account.</p>

        <div className={`flex items-center gap-3 rounded-xl p-3 ${rowBg}`}>
          <DeviceIcon />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-medium ${text}`}>{getDeviceLabel()}</p>
              <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">Current</span>
            </div>
            <p className={`text-xs ${sub}`}>{getBrowserLabel()} · {now}</p>
          </div>
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
        >
          Logout From All Devices
        </button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        darkMode={darkMode}
        title="Logout From All Devices"
        message="You will be signed out from all devices including this one. You will need to log in again."
        confirmLabel="Logout All"
        variant="danger"
        onConfirm={() => { setShowConfirm(false); logout() }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
