export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface EuCapital {
  id: number
  country: string
  country_code: string
  city: string
  slug: string
  latitude: number
  longitude: number
  region: string | null
}

export type TransportMode =
  | 'lietadlo' | 'vlak' | 'auto' | 'autobus' | 'bicykel' | 'pešo' | 'loď' | 'iné'

export interface Visit {
  id: string
  user_id: string
  capital_id: number
  trip_id: string | null
  visit_date: string
  transport_mode: TransportMode
  duration_nights: number
  notes: string | null
  rating: number | null
  created_at: string
  updated_at: string
}

export interface VisitPhoto {
  id: string
  visit_id: string
  storage_path: string
  caption: string | null
  is_cover: boolean
  created_at: string
}

/** Výlet – zoskupenie viacerých návštev miest do jedného príbehu (napr. "Interrail leto 2026") */
export interface Trip {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

/** Návšteva obohatená o detail mesta, titulnú fotku a výlet – pre Timeline / Infografiku */
export interface VisitWithDetails extends Visit {
  capital: EuCapital
  photoCount: number
  coverPhotoUrl: string | null
  trip: Trip | null
}

export type TripRole = 'owner' | 'member'

/** Člen výletu (vlastník alebo pozvaný spolucestovateľ) */
export interface TripMember {
  userId: string
  role: TripRole
  username: string
  avatarUrl: string | null
}

/** Výlet obohatený o zoznam členov - dátový zdroj pre TripsOverview */
export interface TripWithMembers extends Trip {
  members: TripMember[]
}

/** Jedna návšteva v rámci zdieľaného výletu, vrátane toho, kto ju pridal */
export interface TripVisitEntry {
  id: string
  capital: EuCapital
  visitDate: string
  transportMode: TransportMode
  durationNights: number
  notes: string | null
  coverPhotoUrl: string | null
  addedBy: {
    userId: string
    username: string
    avatarUrl: string | null
  }
}
