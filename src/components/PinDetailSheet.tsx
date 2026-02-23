import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { hasResolved, markResolved } from '../lib/resolvedStorage'
import type { Report } from '../types/report'
import { OBJECT_TYPE_LABELS } from '../types/report'

interface PinDetailSheetProps {
  report: Report
  onClose: () => void
  onResolved?: (reportId: string) => void
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `Reported ${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `Reported ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  return `Reported ${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export function PinDetailSheet({ report, onClose, onResolved }: PinDetailSheetProps) {
  const [address, setAddress] = useState<string | null>(null)
  const [showGoneConfirm, setShowGoneConfirm] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [flagged, setFlagged] = useState(false)
  const [flagging, setFlagging] = useState(false)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const alreadyResolved = hasResolved(report.id) || report.resolved === true
  const alreadyFlagged = flagged || localStorage.getItem(`flagged_${report.id}`) === 'true'

  // Hide report button while this is open
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('photoViewerOpen'))
    return () => {
      window.dispatchEvent(new CustomEvent('photoViewerClose'))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${report.lat},${report.lng}&key=${apiKey}`
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const result = data.results?.[0]
        setAddress(result?.formatted_address ?? 'Address unavailable')
      })
      .catch(() => {
        if (!cancelled) setAddress('Address unavailable')
      })
    return () => { cancelled = true }
  }, [report.lat, report.lng, apiKey])

  const handleMarkGone = async () => {
    if (alreadyResolved || resolving) return
    setResolving(true)
    const { error } = await supabase
      .from('reports')
      .update({ resolved: true })
      .eq('id', report.id)
    setResolving(false)
    if (error) return
    markResolved(report.id)
    setShowGoneConfirm(false)
    onResolved?.(report.id)
    onClose()
  }

  const handleFlag = async () => {
    if (alreadyFlagged || flagging) return
    setFlagging(true)
    const { error } = await supabase
      .from('flags')
      .insert({ report_id: report.id })
    setFlagging(false)
    if (error) return
    localStorage.setItem(`flagged_${report.id}`, 'true')
    setFlagged(true)
  }

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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Close button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
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

      {/* Photo */}
      <img
        src={report.photo_url}
        alt="Reported savesie"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
        style={{
          maxWidth: '92vw',
          maxHeight: '60vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          borderRadius: 10,
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      />

      {/* Info + actions */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92vw',
          maxWidth: 480,
          marginTop: 16,
          backgroundColor: 'rgba(26,26,26,0.95)',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>
          {timeAgo(report.created_at)}
          {report.object_type && report.object_type in OBJECT_TYPE_LABELS && (
            <span style={{ color: 'white', marginLeft: 8 }}>
              · {(OBJECT_TYPE_LABELS as Record<string, string>)[report.object_type]}
            </span>
          )}
        </p>
        <p style={{ color: 'white', margin: 0, minHeight: 24 }}>
          {address ?? 'Loading address…'}
        </p>

        {!showGoneConfirm ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {!alreadyResolved && (
              <button
                type="button"
                onClick={() => setShowGoneConfirm(true)}
                style={{
                  minHeight: 48,
                  borderRadius: 12,
                  backgroundColor: '#2a2a2a',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 15,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Is the savesie gone?
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                minHeight: 48,
                borderRadius: 12,
                backgroundColor: '#FF6B00',
                color: 'white',
                fontWeight: 600,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleFlag}
              disabled={alreadyFlagged || flagging}
              style={{
                minHeight: 40,
                borderRadius: 12,
                backgroundColor: 'transparent',
                border: 'none',
                color: alreadyFlagged ? '#555' : '#888',
                fontSize: 13,
                cursor: alreadyFlagged ? 'default' : 'pointer',
              }}
            >
              {alreadyFlagged
                ? 'Report flagged for review'
                : flagging
                ? 'Flagging…'
                : 'Flag this report as inappropriate'}
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 4 }}>
            <p style={{ color: 'white', textAlign: 'center', fontSize: 14, marginBottom: 8 }}>
              Mark this spot as cleared?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleMarkGone}
                disabled={resolving}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 12,
                  backgroundColor: '#FF6B00',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 15,
                  border: 'none',
                  cursor: 'pointer',
                  opacity: resolving ? 0.5 : 1,
                }}
              >
                {resolving ? '…' : "Yes, it's gone"}
              </button>
              <button
                type="button"
                onClick={() => setShowGoneConfirm(false)}
                disabled={resolving}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 12,
                  backgroundColor: '#2a2a2a',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 15,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Nope, still there
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}