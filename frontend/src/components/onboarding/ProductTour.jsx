import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

function buildSteps({ setSection }) {
  return [
    { target: '[data-tour="sidebar-chats"]', title: 'Your Chats', body: 'All your conversations live here.' },
    { target: '[data-tour="sidebar-contacts"]', title: 'Contacts', body: 'Add and manage your contacts.' },
    { target: '[data-tour="sidebar-groups"]', title: 'Groups', body: 'Create group chats here. This is a Pro feature.' },
    { target: '[data-tour="sidebar-calls"]', title: 'Calls', body: 'Your call history, and where you start new calls.' },
    { target: '[data-tour="sidebar-upgrade"]', title: 'Go Pro', body: 'Upgrade your plan here — unlimited calls, Groups, and more.' },
    { target: '[data-tour="sidebar-settings"]', title: 'Settings', before: () => setSection('settings'), body: 'All your account settings live here.' },
    { target: '[data-tour="settings-website"]', title: 'Website Verification', body: "Here is where you verify your website's ownership." },
    { target: '[data-tour="sidebar-avatar"]', title: 'Your Profile', before: () => setSection('chats'), body: 'Edit your profile anytime from here. Enjoy Pulse!' },
  ]
}

function tourSeenKey(userId) {
  return `pulse_tour_seen_${userId}`
}

export default function ProductTour({ userId, setSection, darkMode, restartSignal }) {
  const [phase, setPhase] = useState('closed') // 'closed' | 'prompt' | 'running'
  const [stepIndex, setStepIndex] = useState(0)
  const [pos, setPos] = useState(null) // { top, left, spotlight: {top,left,width,height}, arrow }
  const tooltipRef = useRef(null)

  const steps = useMemo(() => buildSteps({ setSection }), [setSection])

  // Restarting the tour (from Settings → "Take a Tour") is a prop change we react to during
  // render, not an effect — this is React's documented pattern for "adjust state when a prop
  // changes" and avoids an extra render pass.
  const [prevRestartSignal, setPrevRestartSignal] = useState(restartSignal)
  if (restartSignal !== prevRestartSignal) {
    setPrevRestartSignal(restartSignal)
    setStepIndex(0)
    setPhase('running')
  }

  useEffect(() => {
    if (!userId) return
    if (!localStorage.getItem(tourSeenKey(userId))) {
      const t = setTimeout(() => setPhase('prompt'), 700)
      return () => clearTimeout(t)
    }
  }, [userId])

  function finish() {
    if (userId) localStorage.setItem(tourSeenKey(userId), '1')
    setPhase('closed')
    setPos(null)
  }

  function startTour() {
    setStepIndex(0)
    setPhase('running')
  }

  function goNext() {
    if (stepIndex >= steps.length - 1) { finish(); return }
    setStepIndex((i) => i + 1)
  }

  function goPrev() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  // Run each step's `before` hook (navigation) when the step becomes active.
  useEffect(() => {
    if (phase !== 'running') return
    steps[stepIndex]?.before?.()
  }, [phase, stepIndex, steps])

  // Position the spotlight + tooltip against the current step's target.
  useLayoutEffect(() => {
    if (phase !== 'running') return
    let raf
    function measure() {
      const step = steps[stepIndex]
      const target = step && document.querySelector(step.target)
      if (!target) {
        // Target not mounted (e.g. layout still settling after a `before` nav) — retry shortly,
        // and skip this step entirely if it never shows up.
        raf = requestAnimationFrame(measure)
        return
      }
      const rect = target.getBoundingClientRect()
      const spotlight = { top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }
      const tw = tooltipRef.current?.offsetWidth || 288
      const th = tooltipRef.current?.offsetHeight || 140
      const spacing = 16
      const vw = window.innerWidth
      const vh = window.innerHeight
      let top, left, arrow
      if (vw - rect.right > tw + spacing) {
        arrow = 'left'
        left = rect.right + spacing
        top = Math.min(Math.max(rect.top + rect.height / 2 - th / 2, 8), vh - th - 8)
      } else if (vh - rect.bottom > th + spacing) {
        arrow = 'top'
        top = rect.bottom + spacing
        left = Math.min(Math.max(rect.left, 8), vw - tw - 8)
      } else {
        arrow = 'bottom'
        top = Math.max(rect.top - th - spacing, 8)
        left = Math.min(Math.max(rect.left, 8), vw - tw - 8)
      }
      setPos({ spotlight, top, left, arrow })
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [phase, stepIndex, steps])

  if (phase === 'prompt') {
    return (
      <Modal isOpen onClose={finish} maxWidth="max-w-sm" darkMode={darkMode}>
        <div className="p-7 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Want a quick tour?</h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              We'll show you around in under a minute.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={finish}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              No thanks
            </button>
            <Button className="flex-1" onClick={startTour}>Take the tour</Button>
          </div>
        </div>
      </Modal>
    )
  }

  if (phase !== 'running') return null

  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1

  return (
    <div className="fixed inset-0 z-100" onClick={(e) => e.stopPropagation()}>
      {pos && (
        <div
          className="fixed rounded-xl pointer-events-none transition-all duration-200"
          style={{
            top: pos.spotlight.top, left: pos.spotlight.left,
            width: pos.spotlight.width, height: pos.spotlight.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
          }}
        />
      )}
      <div
        ref={tooltipRef}
        className={`fixed w-72 rounded-2xl shadow-2xl p-4 transition-opacity duration-150 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} ${pos ? 'opacity-100' : 'opacity-0'}`}
        style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
      >
        {pos?.arrow === 'left' && (
          <span className={`absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 rotate-45 ${darkMode ? 'bg-gray-900' : 'bg-white'}`} />
        )}
        {pos?.arrow === 'top' && (
          <span className={`absolute -top-2 left-6 w-4 h-4 rotate-45 ${darkMode ? 'bg-gray-900' : 'bg-white'}`} />
        )}
        {pos?.arrow === 'bottom' && (
          <span className={`absolute -bottom-2 left-6 w-4 h-4 rotate-45 ${darkMode ? 'bg-gray-900' : 'bg-white'}`} />
        )}

        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold">{step.title}</p>
          <button onClick={finish} className={`shrink-0 -mt-1 -mr-1 p-1 rounded-lg ${darkMode ? 'text-gray-500 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-100'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className={`text-sm mt-1.5 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{step.body}</p>

        <div className="flex items-center justify-between mt-4">
          <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{stepIndex + 1} / {steps.length}</span>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                onClick={goPrev}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Back
              </button>
            )}
            <button
              onClick={goNext}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors"
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
