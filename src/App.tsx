import { useState } from 'react'
import { MapView } from './components/MapView'
import { ReportButton } from './components/ReportButton'
import { Toast } from './components/Toast'

function App() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-[#1a1a1a]">
      <main className="relative flex-1 overflow-hidden">
        <MapView />
        <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]">
          <ReportButton
            onSuccess={() => setToast({ type: 'success', message: 'Savesie reported! 🚧' })}
            onError={(message) => setToast({ type: 'error', message })}
          />
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
