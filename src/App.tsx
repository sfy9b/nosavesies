import { useState, useEffect } from 'react'
import { MapView } from './components/MapView'
import { ReportButton } from './components/ReportButton'
import { Toast } from './components/Toast'
import { InfoModal } from './components/InfoModal'
import { ConeSVG } from './components/ConeSVG'

function App() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPhotoOpen, setIsPhotoOpen] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

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

      {/* Title bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: '#111',
        borderBottom: '1px solid #2a2a2a',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ConeSVG size={28} />
          <span style={{
            color: 'white',
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.5px',
          }}>
            No Savesies
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: '#2a2a2a',
            border: '1px solid #3a3a3a',
            color: '#aaa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 700,
          }}
          aria-label="About No Savesies"
        >
          ?
        </button>
      </header>

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

      {showInfo && (
        <InfoModal onClose={() => setShowInfo(false)} />
      )}
    </div>
  )
}

export default App