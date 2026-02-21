export interface Report {
  id: string
  lat: number
  lng: number
  photo_url: string
  city: string
  created_at: string
  expires_at: string
}

export interface InsertReport {
  lat: number
  lng: number
  photo_url: string
  city?: string
}
