import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getPhotoPublicUrl } from '../lib/storage'
import type { EuCapital, Trip, VisitWithDetails } from '../types'

interface RawRow {
  id: string
  user_id: string
  capital_id: number
  trip_id: string | null
  visit_date: string
  transport_mode: VisitWithDetails['transport_mode']
  duration_nights: number
  notes: string | null
  rating: number | null
  created_at: string
  updated_at: string
  eu_capitals: EuCapital
  visit_photos: { storage_path: string; created_at: string; is_cover: boolean }[]
  trips: Trip | null
  // Zámerne bez `email` - toto zobrazenie fotky/karty nemá dôvod k nej mať prístup.
  visit_companions: { id: string; name: string; matched_user_id: string | null; created_at: string }[]
}

/**
 * Návštevy prihláseného používateľa obohatené o detail mesta (join na eu_capitals),
 * titulnú fotku (tú, ktorú si používateľ vybral ako titulnú - inak najstaršia
 * nahratá fotka danej návštevy), prípadný výlet a spolucestujúcich (len meno,
 * bez e-mailu) – dátový zdroj pre TimelineView, StatsInfographic aj TripsOverview.
 */
export function useVisitsWithDetails(userId?: string) {
  const [visits, setVisits] = useState<VisitWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVisits = useCallback(async () => {
    if (!userId) {
      setVisits([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('visits')
      .select(
        '*, eu_capitals(*), visit_photos(storage_path, created_at, is_cover), trips(*), visit_companions(id, visit_id, name, matched_user_id, created_at)'
      )
      .eq('user_id', userId)
      .order('visit_date', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const rows = (data ?? []) as unknown as RawRow[]

    const mapped: VisitWithDetails[] = rows.map((row) => {
      const sortedPhotos = [...(row.visit_photos ?? [])].sort((a, b) =>
        a.created_at.localeCompare(b.created_at)
      )
      const coverPhoto = sortedPhotos.find((p) => p.is_cover) ?? sortedPhotos[0] ?? null
      return {
        id: row.id,
        user_id: row.user_id,
        capital_id: row.capital_id,
        trip_id: row.trip_id,
        visit_date: row.visit_date,
        transport_mode: row.transport_mode,
        duration_nights: row.duration_nights,
        notes: row.notes,
        rating: row.rating,
        created_at: row.created_at,
        updated_at: row.updated_at,
        capital: row.eu_capitals,
        photoCount: sortedPhotos.length,
        coverPhotoUrl: coverPhoto ? getPhotoPublicUrl(coverPhoto.storage_path) : null,
        trip: row.trips ?? null,
        companions: (row.visit_companions ?? []).map((c) => ({
          id: c.id,
          visit_id: row.id,
          name: c.name,
          matched_user_id: c.matched_user_id,
          created_at: c.created_at,
        })),
      }
    })

    setVisits(mapped)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchVisits()
  }, [fetchVisits])

  return { visits, loading, error, refetch: fetchVisits }
}
