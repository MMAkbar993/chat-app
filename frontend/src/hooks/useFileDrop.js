import { useRef, useState } from 'react'

// Dropping a file onto an area: whether one is being dragged over it (for an overlay), and the
// files that were dropped. Spread `dropHandlers` onto the element that accepts the drop.
export function useFileDrop() {
  const dragCounterRef = useRef(0)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState(null) // File[] from the last drop

  // dragenter/dragleave fire on every child crossed, not just the container's own boundary —
  // a counter (instead of a plain boolean) is the standard fix so the overlay doesn't flicker
  // as the pointer passes over messages/avatars while dragging.
  function handleDragEnter(e) {
    e.preventDefault()
    if (!e.dataTransfer.types.includes('Files')) return
    dragCounterRef.current++
    setIsDraggingFile(true)
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  function handleDragLeave(e) {
    e.preventDefault()
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
    if (dragCounterRef.current === 0) setIsDraggingFile(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDraggingFile(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length) setDroppedFiles(files)
  }

  return {
    isDraggingFile,
    droppedFiles,
    setDroppedFiles,
    dropHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  }
}
