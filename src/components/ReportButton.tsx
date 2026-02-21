import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/compress'
import type { InsertReport } from '../types/report'

interface ReportButtonProps {
  onSuccess: () => void
  onError: (message: string) => void
}

export function ReportButton({ onSuccess, onError }: ReportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const [uploading, setUploading] = useState(false)

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          if (err.code === 1) reject(new Error('Location permission denied. Enable location to report a savesie.'))
          else if (err.code === 2) reject(new Error('Location unavailable. Check your connection and try again.'))
          else if (err.code === 3) reject(new Error('Location request timed out. Try again.'))
          else reject(new Error('Could not get your location. Try again.'))
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      )
    })
  }

  const handleFile = async (file: File, lat: number, lng: number) => {
    if (!file.type.startsWith('image/')) {
      onError('Please choose an image.')
      return
    }
    setUploading(true)
    try {
      const blob = await compressImage(file, 800)
      const ext = file.name.split('.').pop() || 'jpg'
      const name = `${crypto.randomUUID()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(name, blob, { contentType: 'image/jpeg', upsert: false })

      if (uploadError) {
        onError('Upload failed. Make sure the "photos" bucket exists and allows uploads.')
        return
      }

      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(uploadData.path)
      const row: InsertReport = { lat, lng, photo_url: urlData.publicUrl }
      const { error: insertError } = await supabase.from('reports').insert(row)

      if (insertError) {
        onError('Could not save report. Try again.')
        return
      }
      onSuccess()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const openCamera = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (uploading) return
    getLocation()
      .then((loc) => {
        pendingLocationRef.current = loc
        const input = fileInputRef.current
        if (input) {
          input.value = ''
          requestAnimationFrame(() => {
            input.click()
          })
        }
      })
      .catch((err) => {
        onError(err instanceof Error ? err.message : 'Something went wrong.')
      })
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-hidden
        tabIndex={-1}
        className="absolute left-0 top-0 h-0 w-0 overflow-hidden opacity-0"
        onChange={(e) => {
          const f = e.target.files?.[0]
          const loc = pendingLocationRef.current
          if (!f || !loc) return
          pendingLocationRef.current = null
          handleFile(f, loc.lat, loc.lng)
        }}
      />
      <button
        type="button"
        onClick={openCamera}
        disabled={uploading}
        className="flex min-h-[48px] min-w-[48px] items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] px-6 py-4 text-lg font-bold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-70"
      >
        {uploading ? (
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            Report a Savesie 🚧
          </>
        )}
      </button>
    </>
  )
}
