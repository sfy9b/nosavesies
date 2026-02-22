import { useCallback, useEffect, useRef, useState } from 'react'

interface PhotoViewerProps {
  src: string
  alt: string
  onClose: () => void
}

export function PhotoViewer({ src, alt, onClose }: PhotoViewerProps) {
  const [scale, setScale] = useState(1)
  const lastPinchDistRef = useRef<number | null>(null)
  const [isPinching, setIsPinching] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true)
      lastPinchDistRef.current = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      )
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
      e.preventDefault()
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      )
      const delta = dist / lastPinchDistRef.current
      lastPinchDistRef.current = dist
      setScale((s) => Math.min(4, Math.max(1, s * delta)))
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      lastPinchDistRef.current = null
      setIsPinching(false)
      setScale((s) => (s < 1 ? 1 : s))
    }
  }, [])

  const handleDoubleTap = useCallback(() => {
    setScale((s) => (s > 1 ? 1 : 2.5))
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        aria-label="Close"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <img
        ref={imageRef}
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => { e.stopPropagation(); handleDoubleTap() }}
        draggable={false}
        style={{
          maxWidth: '92vw',
          maxHeight: '88vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          borderRadius: 10,
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          transform: `scale(${scale})`,
          transition: isPinching ? 'none' : 'transform 0.2s ease-out',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
        }}
      />
    </div>
  )
}