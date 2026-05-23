let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

function tone(freq, startTime, duration, gain = 0.4, type = 'sine') {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.connect(g)
  g.connect(ctx.destination)
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, startTime)
  g.gain.linearRampToValueAtTime(gain, startTime + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.05)
}

// Short soft pop — message sent
export function playSentSound() {
  try {
    const ctx = getCtx()
    const t = ctx.currentTime
    tone(700, t, 0.09, 0.18, 'sine')
    tone(500, t + 0.06, 0.09, 0.1, 'sine')
  } catch {}
}

// Two-tone ding — message received
export function playReceivedSound() {
  try {
    const ctx = getCtx()
    const t = ctx.currentTime
    tone(880, t, 0.15, 0.28, 'sine')
    tone(1100, t + 0.12, 0.2, 0.22, 'sine')
  } catch {}
}

// Ascending three-tone — call connected
export function playCallConnected() {
  try {
    const ctx = getCtx()
    const t = ctx.currentTime
    tone(660, t, 0.12, 0.28, 'sine')
    tone(880, t + 0.1, 0.15, 0.25, 'sine')
    tone(1100, t + 0.22, 0.22, 0.22, 'sine')
  } catch {}
}

// Descending two-tone — call ended
export function playCallEnded() {
  try {
    const ctx = getCtx()
    const t = ctx.currentTime
    tone(440, t, 0.15, 0.28, 'sine')
    tone(330, t + 0.12, 0.22, 0.22, 'sine')
  } catch {}
}

// Repeating phone-style ringtone
let ringtoneTimer = null

function ringOnce() {
  try {
    const ctx = getCtx()
    const t = ctx.currentTime
    tone(480, t, 0.38, 0.45, 'sine')
    tone(440, t, 0.38, 0.22, 'triangle')
    tone(480, t + 0.48, 0.38, 0.45, 'sine')
    tone(440, t + 0.48, 0.38, 0.22, 'triangle')
  } catch {}
}

export function playRingtone() {
  stopRingtone()
  ringOnce()
  ringtoneTimer = setInterval(ringOnce, 2200)
}

export function stopRingtone() {
  if (ringtoneTimer) {
    clearInterval(ringtoneTimer)
    ringtoneTimer = null
  }
}
