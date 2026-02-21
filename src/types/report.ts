export const OBJECT_TYPES = ['chair', 'trash_can', 'cone', 'other'] as const
export type ObjectType = (typeof OBJECT_TYPES)[number]

export const OBJECT_TYPE_LABELS: Record<ObjectType, string> = {
  chair: 'Chair',
  trash_can: 'Trash Can',
  cone: 'Cone',
  other: 'Other',
}

export const OBJECT_TYPE_EMOJI: Record<ObjectType, string> = {
  chair: '🪑',
  trash_can: '🗑️',
  cone: '🚧',
  other: '📦',
}

export interface Report {
  id: string
  lat: number
  lng: number
  photo_url: string
  city: string
  created_at: string
  expires_at: string
  object_type?: string | null
}

export interface InsertReport {
  lat: number
  lng: number
  photo_url: string
  city?: string
  object_type: string
}
