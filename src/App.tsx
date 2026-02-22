import { useState, useEffect } from 'react'
import { MapView } from './components/MapView'
import { ReportButton } from './components/ReportButton'
import { Toast } from './components/Toast'

function App() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPhotoOpen, setIsPhotoOpen] = useState(false)

  useEffect(() => {
    const onOpen = () => setIsPhotoOpen(true)
    const onClose = () => setIsPhotoOpen(false)
    window.addEventListener('photoViewerOpen', onOpen)
    window.addEventListener('photoViewerClose', onClose)
    return () => {
      window.removeEventListener('photoViewerOpen', onOpen)
      window.removeEventListener('photoViewerClose', onClose)
    }
  }, [])

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-[#1a1a1a]">
      <main className="relative flex-1 overflow-hidden">
        <MapView
          onShowToast={(message) => setToast({ type: 'success', message })}
        />
        <div
          className="absolute bottom-6 left-0 right-0 z-[100] flex justify-center px-4 pb-[env(safe-area-inset-bottom)] pointer-events-none"
          style={{ display: isPhotoOpen ? 'none' : 'flex' }}
        >
          <div className="pointer-events-auto">
            <ReportButton
              isPhotoOpen={isPhotoOpen}
              onSuccess={() => setToast({ type: 'success', message: 'Savesie reported!' })}
              onError={(message) => setToast({ type: 'error', message })}
            />
          </div>
        </div>
      </main>
      {toast && (
        <Toast
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default App