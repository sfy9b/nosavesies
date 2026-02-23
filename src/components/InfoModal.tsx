interface InfoModalProps {
    onClose: () => void
  }
  
  export function InfoModal({ onClose }: InfoModalProps) {
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
          padding: '24px',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={onClose}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.97); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#1a1a1a',
            borderRadius: 20,
            padding: 24,
            maxWidth: 400,
            width: '100%',
            border: '1px solid #2a2a2a',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0 }}>
              What is No Savesies?
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#2a2a2a',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
  
          <p style={{ color: '#ccc', fontSize: 15, lineHeight: 1.6, margin: '0 0 12px' }}>
            <strong style={{ color: 'white' }}>Savesies</strong> is the illegal but common practice of using household items like chairs, cones, or trash cans to reserve public parking spots on public streets, typically after digging them out from snow.
            </p>
            <p style={{ color: '#ccc', fontSize: 15, lineHeight: 1.6, margin: '0 0 12px' }}>
            <strong style={{ color: 'white' }}>No Savesies</strong> is a crowdsourced map where people can report and track savesies in real time. Spot a chair in a parking space? Report it. Savesie cleared? Mark it gone.
            </p>
            <p style={{ color: '#ccc', fontSize: 15, lineHeight: 1.6, margin: '0 0 12px' }}>
            Reports expire automatically after 48 hours.
            </p>
            <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px', borderTop: '1px solid #2a2a2a', paddingTop: 12 }}>
            <strong style={{ color: '#ccc' }}>Privacy notice:</strong> Reports include your approximate GPS location and any photo you submit. Location data is visible publicly on the map. Do not submit photos containing identifiable people or private property. By submitting a report you agree that your content may be visible to anyone.
            </p>
            
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              minHeight: 48,
              borderRadius: 12,
              backgroundColor: '#FF6B00',
              color: 'white',
              fontWeight: 700,
              fontSize: 16,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    )
  }