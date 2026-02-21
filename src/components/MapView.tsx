import { useCallback, useEffect, useMemo, useState } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import type { ObjectType, Report } from '../types/report'
import { OBJECT_TYPE_EMOJI, OBJECT_TYPE_LABELS, OBJECT_TYPES } from '../types/report'
import { supabase } from '../lib/supabase'
import { PinDetailSheet } from './PinDetailSheet'

type FilterType = 'all' | ObjectType

const PHILLY_CENTER = { lat: 39.9526, lng: -75.1652 }
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }
const DARK_MAP_OPTIONS: google.maps.MapOptions = {
  center: PHILLY_CENTER,
  zoom: 13,
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  ],
}

function isActive(report: Report) {
  return new Date(report.expires_at) > new Date() && !report.resolved
}

function reportEmoji(report: Report): string {
  const t = report.object_type as ObjectType | undefined
  return t && t in OBJECT_TYPE_EMOJI ? OBJECT_TYPE_EMOJI[t] : '🚧'
}

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  ...OBJECT_TYPES.map((t) => ({ value: t as FilterType, label: OBJECT_TYPE_LABELS[t] })),
]

interface MapViewProps {
  onShowToast?: (message: string) => void
  onPhotoViewerOpen?: () => void
  onPhotoViewerClose?: () => void
}

export function MapView({ onShowToast, onPhotoViewerOpen, onPhotoViewerClose }: MapViewProps = {}) {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  })

  const activeReports = useMemo(() => reports.filter(isActive), [reports])
  const filteredReports = useMemo(() => {
    if (filter === 'all') return activeReports
    return activeReports.filter((r) => r.object_type === filter)
  }, [activeReports, filter])

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .or('resolved.eq.false,resolved.is.null')
    if (!error) setReports(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    const channel = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchReports])

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1a1a1a] p-4 text-center text-white">
        Failed to load map. Check your Google Maps API key.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#1a1a1a] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF6B00] border-t-transparent" />
        <p>Loading map…</p>
      </div>
    )
  }

  return (
    <>
      <div className="relative h-full w-full">
        <div className="absolute left-0 right-0 top-0 z-10 flex gap-2 overflow-x-auto bg-[#1a1a1a]/95 px-3 py-2 pb-safe">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`min-h-[44px] shrink-0 rounded-full px-4 text-sm font-medium transition ${
                filter === value
                  ? 'bg-[#FF6B00] text-white'
                  : 'bg-[#2a2a2a] text-neutral-300 active:bg-[#333]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={PHILLY_CENTER}
          zoom={13}
          options={DARK_MAP_OPTIONS}
        >
          {filteredReports.map((report) => (
            <Marker
              key={report.id}
              position={{ lat: report.lat, lng: report.lng }}
              label={{ text: reportEmoji(report), fontSize: '24px' }}
              onClick={() => setSelectedReport(report)}
            />
          ))}
        </GoogleMap>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF6B00] border-t-transparent" />
          </div>
        )}
      </div>

      {selectedReport && (
        <PinDetailSheet
          report={selectedReport}
          onClose={() => {
            setSelectedReport(null)
            onPhotoViewerClose?.()
          }}
          onResolved={(reportId) => {
            setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, resolved: true } : r)))
            setSelectedReport(null)
            onPhotoViewerClose?.()
            onShowToast?.('Spot marked as cleared!')
          }}
          onPhotoViewerOpen={onPhotoViewerOpen}
          onPhotoViewerClose={onPhotoViewerClose}
        />
      )}
    </>
  )
}
