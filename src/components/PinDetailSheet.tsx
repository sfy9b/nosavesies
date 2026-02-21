import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { hasConfirmed, markConfirmed } from '../lib/confirmStorage'
import type { Report } from '../types/report'
import { OBJECT_TYPE_LABELS } from '../types/report'

interface PinDetailSheetProps {
  report: Report
  onClose: () => void
  onConfirm?: (reportId: string, confirms: number, expiresAt: string) => void
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

export function PinDetailSheet({ report, onClose, onConfirm }: PinDetailSheetProps) {
  const [address, setAddress] = useState<string | null>(null)
  const [confirms, setConfirms] = useState<number>(report.confirms ?? 0)
  const [expiresAt, setExpiresAt] = useState<string>(report.expires_at)
  const [confirming, setConfirming] = useState(false)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const alreadyConfirmed = hasConfirmed(report.id)

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

  const handleConfirm = async () => {
    if (alreadyConfirmed || confirming) return
    setConfirming(true)
    const newConfirms = confirms + 1
    const newExpiresAt = new Date(Date.parse(expiresAt) + 2 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase
      .from('reports')
      .update({ confirms: newConfirms, expires_at: newExpiresAt })
      .eq('id', report.id)
    if (error) {
      setConfirming(false)
      return
    }
    markConfirmed(report.id)
    setConfirms(newConfirms)
    setExpiresAt(newExpiresAt)
    setConfirming(false)
    onConfirm?.(report.id, newConfirms, newExpiresAt)
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
          <img
            src={report.photo_url}
            alt="Reported savesie"
            className="w-full object-cover"
          />
          <div className="space-y-2 p-4">
            <p className="text-sm text-neutral-400">
              {timeAgo(report.created_at)}
              {report.object_type && report.object_type in OBJECT_TYPE_LABELS && (
                <span className="ml-2 text-white"> · {(OBJECT_TYPE_LABELS as Record<string, string>)[report.object_type]}</span>
              )}
            </p>
            <p className="min-h-[1.5rem] text-white">{address ?? 'Loading address…'}</p>
            {confirms > 0 && (
              <p className="text-sm text-neutral-400">
                {confirms} {confirms === 1 ? 'person' : 'people'} confirmed this
              </p>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={alreadyConfirmed || confirming}
              className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#2a2a2a] font-semibold text-white transition active:opacity-90 disabled:opacity-50"
            >
              {confirming ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : alreadyConfirmed ? (
                'Confirmed ✓'
              ) : (
                Savesie still there?
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#FF6B00] font-semibold text-white transition active:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
