import { useCallback, useEffect, useMemo, useState } from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import type { ObjectType, Report } from '../types/report'
import { OBJECT_TYPE_LABELS, OBJECT_TYPES } from '../types/report'
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

const CONE_SVG = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 70" width="36" height="42">
    <ellipse cx="30" cy="64" rx="22" ry="5" fill="rgba(0,0,0,0.3)"/>
    <circle cx="30" cy="28" r="24" fill="#1a1a2e" opacity="0.85"/>
    <g transform="translate(30,28) scale(0.55) translate(-30,-33)">
      <polygon points="30,4 8,62 52,62" fill="#E84400"/>
      <polygon points="30,4 8,62 52,62" fill="url(#coneGrad)"/>
      <defs>
        <linearGradient id="coneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:rgba(0,0,0,0.2)"/>
          <stop offset="40%" style="stop-color:rgba(255,255,255,0.1)"/>
          <stop offset="100%" style="stop-color:rgba(0,0,0,0.15)"/>
        </linearGradient>
      </defs>
      <polygon points="14,46 46,46 49,54 11,54" fill="white" opacity="0.9"/>
      <polygon points="20,28 40,28 43,36 17,36" fill="white" opacity="0.9"/>
      <ellipse cx="30" cy="6" rx="4" ry="2.5" fill="#CC3A00"/>
    </g>
  </svg>
  `)

function makeEmojiSVG(emoji: string): string {
  return encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 70" width="36" height="42">
  <ellipse cx="30" cy="64" rx="22" ry="5" fill="rgba(0,0,0,0.3)"/>
  <circle cx="30" cy="28" r="24" fill="#1a1a2e" opacity="0.85"/>
  <text x="30" y="40" text-anchor="middle" font-size="28" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${emoji}</text>
</svg>
`)
}

function getMarkerIcon(objectType: string | undefined): google.maps.Icon {
  if (objectType === 'cone') {
    return {
      url: `data:image/svg+xml;charset=UTF-8,${CONE_SVG}`,
      scaledSize: new google.maps.Size(44, 52),
      anchor: new google.maps.Point(22, 52),
    }
  }

  let emoji = '📦'
  if (objectType === 'chair') emoji = '🪑'
  else if (objectType === 'trash_can') emoji = '🗑️'

  return {
    url: `data:image/svg+xml;charset=UTF-8,${makeEmojiSVG(emoji)}`,
    scaledSize: new google.maps.Size(44, 52),
    anchor: new google.maps.Point(22, 52),
  }
}

function isActive(report: Report) {
  return new Date(report.expires_at) > new Date() && !report.resolved
}

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  ...OBJECT_TYPES.map((t) => ({ value: t as FilterType, label: OBJECT_TYPE_LABELS[t] })),
]

interface MapViewProps {
  onShowToast?: (message: string) => void
}

export function MapView({ onShowToast }: MapViewProps = {}) {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])

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

  useEffect(() => { fetchReports() }, [fetchReports])

  useEffect(() => {
    const channel = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchReports])

  useEffect(() => {
    if (!map) return
    markers.forEach((m) => m.setMap(null))
    const newMarkers = filteredReports.map((report) => {
      const marker = new google.maps.Marker({
        position: { lat: report.lat, lng: report.lng },
        map,
        icon: getMarkerIcon(report.object_type as string | undefined),
        title: report.object_type || 'savesie',
      })
      marker.addListener('click', () => setSelectedReport(report))
      return marker
    })
    setMarkers(newMarkers)
    return () => { newMarkers.forEach((m) => m.setMap(null)) }
  }, [map, filteredReports])

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
        <div className="absolute left-0 right-0 top-0 z-10 bg-[#1a1a1a]/95 px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">
              {activeReports.length === 0
                ? 'No active savesies'
                : `${activeReports.length} active savesie${activeReports.length === 1 ? '' : 's'}`}
            </span>
            {filter !== 'all' && filteredReports.length !== activeReports.length && (
              <span className="text-xs text-neutral-400">
                {filteredReports.length} shown
              </span>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`min-h-[36px] shrink-0 rounded-full px-4 text-sm font-medium transition ${
                  filter === value
                    ? 'bg-[#FF6B00] text-white'
                    : 'bg-[#2a2a2a] text-neutral-300 active:bg-[#333]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={PHILLY_CENTER}
          zoom={13}
          options={DARK_MAP_OPTIONS}
          onLoad={(m) => setMap(m)}
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF6B00] border-t-transparent" />
          </div>
        )}
      </div>

      {selectedReport && (
        <PinDetailSheet
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onResolved={(reportId) => {
            setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, resolved: true } : r)))
            setSelectedReport(null)
            onShowToast?.('Spot marked as cleared!')
          }}
        />
      )}
    </>
  )
}