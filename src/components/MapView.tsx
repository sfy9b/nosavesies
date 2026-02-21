import { useCallback, useEffect, useMemo, useState } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import type { Report } from '../types/report'
import { supabase } from '../lib/supabase'
import { PinDetailSheet } from './PinDetailSheet'

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
  return new Date(report.expires_at) > new Date()
}

export function MapView() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  })

  const activeReports = useMemo(() => reports.filter(isActive), [reports])

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .gt('expires_at', new Date().toISOString())
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
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={PHILLY_CENTER}
          zoom={13}
          options={DARK_MAP_OPTIONS}
        >
          {activeReports.map((report) => (
            <Marker
              key={report.id}
              position={{ lat: report.lat, lng: report.lng }}
              label={{ text: '🚧', fontSize: '24px' }}
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
        <PinDetailSheet report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </>
  )
}
