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
