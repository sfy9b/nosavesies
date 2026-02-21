import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/compress'
import type { InsertReport, ObjectType } from '../types/report'
import { OBJECT_TYPE_EMOJI, OBJECT_TYPE_LABELS, OBJECT_TYPES } from '../types/report'

interface ReportButtonProps {
  isPhotoOpen?: boolean
  onSuccess: () => void
  onError: (message: string) => void
}

type Step = 'idle' | 'getting' | 'select_type' | 'uploading'

export function ReportButton({ isPhotoOpen = false, onSuccess, onError }: ReportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const locationRef = useRef<{ lat: number; lng: number } | null>(null)
  const pendingTypeRef = useRef<ObjectType | null>(null)
  const [step, setStep] = useState<Step>('idle')
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

  const handleFile = async (file: File, lat: number, lng: number, objectType: ObjectType) => {
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
      const row: InsertReport = { lat, lng, photo_url: urlData.publicUrl, object_type: objectType }
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
      setStep('idle')
      locationRef.current = null
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const startReport = () => {
    if (step !== 'idle' || uploading) return
    setStep('getting')
    getLocation()
      .then((loc) => {
        locationRef.current = loc
        setStep('select_type')
      })
      .catch((err) => {
        setStep('idle')
        onError(err instanceof Error ? err.message : 'Something went wrong.')
      })
  }

  const openPicker = (objectType: ObjectType) => {
    const loc = locationRef.current
    if (!loc || step !== 'select_type') return
    pendingTypeRef.current = objectType
    const input = fileInputRef.current
    if (input) {
      input.value = ''
      input.click()
    }
  }

  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    const loc = locationRef.current
    const objectType = pendingTypeRef.current
    if (!f || !loc || !objectType) return
    pendingTypeRef.current = null
    setStep('uploading')
    handleFile(f, loc.lat, loc.lng, objectType)
  }

  const cancelTypeSelect = () => {
    setStep('idle')
    locationRef.current = null
  }

  if (step === 'select_type') {
    return (
      <div style={{ display: isPhotoOpen ? 'none' : 'flex' }} className="flex flex-col gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          aria-hidden
          tabIndex={-1}
          className="absolute left-0 top-0 h-0 w-0 overflow-hidden opacity-0"
          onChange={onFileChosen}
        />
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm font-medium text-white">What&apos;s blocking the spot?</p>
          <div className="grid grid-cols-2 gap-3">
            {OBJECT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => openPicker(type)}
                disabled={uploading}
                className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl bg-[#2a2a2a] py-4 text-white transition active:scale-[0.98] disabled:opacity-70"
              >
                <span className="text-2xl">{OBJECT_TYPE_EMOJI[type]}</span>
                <span className="text-sm font-semibold">{OBJECT_TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={cancelTypeSelect}
            className="min-h-[48px] text-sm text-neutral-400 underline"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        aria-hidden
        tabIndex={-1}
        className="absolute left-0 top-0 h-0 w-0 overflow-hidden opacity-0"
        onChange={onFileChosen}
      />
      <button
        type="button"
        onClick={startReport}
        disabled={uploading || step === 'getting'}
        className="flex min-h-[48px] min-w-[48px] items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] px-6 py-4 text-lg font-bold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-70"
        style={{ display: isPhotoOpen ? 'none' : 'flex' }}
      >
        {step === 'getting' || uploading ? (
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>Report a Savesie 🚧</>
        )}
      </button>
    </>
  )
}
