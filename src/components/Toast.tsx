import { useEffect } from 'react'

interface ToastProps {
  message: string
  onDismiss: () => void
  duration?: number
}

export function Toast({ message, onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [onDismiss, duration])

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-[60] rounded-xl bg-[#1a1a1a] px-4 py-3 text-center text-white shadow-lg"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}
