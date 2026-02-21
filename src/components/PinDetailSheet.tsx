import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { hasResolved, markResolved } from '../lib/resolvedStorage'
import type { Report } from '../types/report'
import { OBJECT_TYPE_LABELS } from '../types/report'
import { PhotoViewer } from './PhotoViewer'

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
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const alreadyResolved = hasResolved(report.id)

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
    return () => {
      cancelled = true
    }
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

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close"
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden rounded-t-2xl bg-[#1a1a1a] shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Report details"
      >
        <div className="flex justify-center pt-3">
          <div className="h-1 w-12 rounded-full bg-neutral-600" />
        </div>
        <div className="overflow-y-auto pb-safe">
          <button
            type="button"
            onClick={() => setPhotoViewerOpen(true)}
            className="block w-full px-4 pt-2"
          >
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-[#2a2a2a]">
              <img
                src={report.photo_url}
                alt="Reported savesie"
                className="h-full w-full object-cover"
              />
            </div>
          </button>
          <div className="space-y-2 p-4">
            <p className="text-sm text-neutral-400">
              {timeAgo(report.created_at)}
              {report.object_type && report.object_type in OBJECT_TYPE_LABELS && (
                <span className="ml-2 text-white">
                  · {(OBJECT_TYPE_LABELS as Record<string, string>)[report.object_type]}
                </span>
              )}
            </p>
            <p className="min-h-[1.5rem] text-white">{address ?? 'Loading address…'}</p>

            {!showGoneConfirm ? (
              <>
                {!alreadyResolved && (
                  <button
                    type="button"
                    onClick={() => setShowGoneConfirm(true)}
                    className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#2a2a2a] font-semibold text-white transition active:opacity-90"
                  >
                    Is the savesie gone?
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#FF6B00] font-semibold text-white transition active:opacity-90"
                >
                  Close
                </button>
              </>
            ) : (
              <div className="mt-2 rounded-xl border border-neutral-700 bg-[#252525] p-4">
                <p className="mb-3 text-center text-sm font-medium text-white">
                  Mark this spot as cleared?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleMarkGone}
                    disabled={resolving}
                    className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#FF6B00] font-semibold text-white transition active:opacity-90 disabled:opacity-50"
                  >
                    {resolving ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      "Yes, it's gone"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGoneConfirm(false)}
                    disabled={resolving}
                    className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#2a2a2a] font-semibold text-white transition active:opacity-90"
                  >
                    Nope, still there
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {photoViewerOpen && (
        <PhotoViewer
          src={report.photo_url}
          alt="Reported savesie"
          onClose={() => setPhotoViewerOpen(false)}
        />
      )}
    </>
  )
}
