import { useRef, useEffect, useState } from 'react'
import { uploadFile } from '../../api/users'

function CameraModal({ onCapture, onClose, darkMode }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setReady(true)
        }
      })
      .catch(() => onClose())
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [onClose])

  function capture() {
    const video = videoRef.current
    if (!video) return
    setCapturing(true)
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d').drawImage(video, 0, 0)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    canvas.toBlob((blob) => {
      if (blob) onCapture(blob)
      else onClose()
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full max-w-lg rounded-xl object-cover"
        style={{ maxHeight: '70vh' }}
      />
      <div className="flex items-center gap-6 mt-6">
        <button
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          onClick={capture}
          disabled={!ready || capturing}
          className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center transition-colors shadow-lg"
        >
          <div className="w-12 h-12 rounded-full border-4 border-gray-400" />
        </button>
      </div>
      {!ready && (
        <p className="text-white/70 text-sm mt-4">Starting camera...</p>
      )}
    </div>
  )
}

export default function AttachmentMenu({ onClose, onAttach, darkMode }) {
  const menuRef = useRef(null)
  const galleryRef = useRef(null)
  const audioRef = useRef(null)
  const fileRef = useRef(null)
  const [showCamera, setShowCamera] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  async function handleFile(e, type) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const { fileUrl, messageType } = await uploadFile(file)
      onAttach(fileUrl, messageType || type)
    } catch (err) {
      console.error('Upload error:', err)
    }
    setUploading(false)
    onClose()
  }

  async function handleCameraCapture(blob) {
    setShowCamera(false)
    setUploading(true)
    try {
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const { fileUrl, messageType } = await uploadFile(file)
      onAttach(fileUrl, messageType || 'image')
    } catch (err) {
      console.error('Camera upload error:', err)
    }
    setUploading(false)
    onClose()
  }

  const itemClass = `flex items-center gap-3 w-full px-4 py-3 text-sm text-left transition-colors rounded-lg ${
    darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
  }`

  if (showCamera) {
    return (
      <CameraModal
        darkMode={darkMode}
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    )
  }

  return (
    <div
      ref={menuRef}
      className={`absolute bottom-16 left-0 w-44 rounded-2xl shadow-xl z-50 py-2 ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
      }`}
    >
      {uploading ? (
        <div className="flex items-center justify-center py-4 gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          Uploading...
        </div>
      ) : (
        <>
          <button className={itemClass} onClick={() => setShowCamera(true)}>
            <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Camera
          </button>

          <button className={itemClass} onClick={() => galleryRef.current?.click()}>
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Gallery
          </button>

          <button className={itemClass} onClick={() => audioRef.current?.click()}>
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Audio
          </button>

          <button className={itemClass} onClick={() => fileRef.current?.click()}>
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            File
          </button>
        </>
      )}

      <input ref={galleryRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleFile(e, 'image')} />
      <input ref={audioRef}   type="file" accept="audio/*"          className="hidden" onChange={(e) => handleFile(e, 'audio')} />
      <input ref={fileRef}    type="file"                            className="hidden" onChange={(e) => handleFile(e, 'file')} />
    </div>
  )
}
