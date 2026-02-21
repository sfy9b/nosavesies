import { useCallback, useEffect, useRef, useState } from 'react'

interface PhotoViewerProps {
  src: string
  alt: string
  onOpen?: () => void
  onClose: () => void
}

export function PhotoViewer({ src, alt, onOpen, onClose }: PhotoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const lastPinchDistRef = useRef<number | null>(null)
  const lastPinchCenterRef = useRef<{ x: number; y: number } | null>(null)
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null)
  const [isPinching, setIsPinching] = useState(false)

  useEffect(() => {
    onOpen?.()
    return () => {
      onClose()
    }
  }, [onOpen, onClose])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleClose = () => {
    onClose()
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true)
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      )
      lastPinchDistRef.current = dist
      lastPinchCenterRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      }
    } else if (e.touches.length === 1) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDistRef.current !== null && lastPinchCenterRef.current) {
        e.preventDefault()
        const dist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        )
        const delta = dist / lastPinchDistRef.current
        lastPinchDistRef.current = dist
        setScale((s) => Math.min(4, Math.max(0.5, s * delta)))
      }
    },
    []
  )

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      lastPinchDistRef.current = null
      lastPinchCenterRef.current = null
      setIsPinching(false)
    }
    if (e.touches.length < 1) lastTouchRef.current = null
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(20px)',
        animation: 'photoViewerBackdropIn 0.25s ease-out',
      }}
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Photo full screen"
    >
      <style>{`
        @keyframes photoViewerBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
        aria-label="Close"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <div
        className="flex h-full w-full items-center justify-center p-4 pt-14"
        style={{ touchAction: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="max-h-full max-w-full select-none object-contain"
          style={{
            transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
            transition: isPinching ? 'none' : 'transform 0.1s ease-out',
          }}
          draggable={false}
        />
      </div>
    </div>
  )
}
