import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getPhotoPublicUrl } from '../lib/storage'
import type { EuCapital, TripVisitEntry } from '../types'

interface RawRow {
  id: string
  trip_id: string | null
  user_id: string
  visit_date: string
  transport_mode: TripVisitEntry['transportMode']
  duration_nights: number
  notes: string | null
  eu_capitals: EuCapital
  visit_photos: { storage_path: string; created_at: string; is_cover: boolean }[]
  profiles: { username: string; avatar_url: string | null } | null
}

/**
 * Návštevy priradené k daným výletom - naprieč VŠETKÝMI ich členmi, nielen
 * prihláseným používateľom. Toto je to, čo robí zdieľaný výlet skutočne
 * spoločným: každý člen vidí, čo do neho pridali ostatní.
 */
export function useTripVisits(tripIds: string[]) {
  const [visitsByTrip, setVisitsByTrip] = useState<Map<string, TripVisitEntry[]>>(new Map())
  const [loading, setLoading] = useState(true)

  const key = [...tripIds].sort().join(',')

  const fetchAll = useCallback(async () => {
    if (tripIds.length === 0) {
      setVisitsByTrip(new Map())
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('visits')
      .select(
        'id, trip_id, user_id, visit_date, transport_mode, duration_nights, notes, eu_capitals(*), visit_photos(storage_path, created_at, is_cover), profiles(username, avatar_url)'
      )
      .in('trip_id', tripIds)
      .order('visit_date', { ascending: true })

    if (error) {
      setLoading(false)
      return
    }

    const rows = (data ?? []) as unknown as RawRow[]
    const map = new Map<string, TripVisitEntry[]>()

    for (const row of rows) {
      if (!row.trip_id) continue

      const sortedPhotos = [...(row.visit_photos ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at))
      const cover = sortedPhotos.find((p) => p.is_cover) ?? sortedPhotos[0] ?? null

      const entry: TripVisitEntry = {
        id: row.id,
        capital: row.eu_capitals,
        visitDate: row.visit_date,
        transportMode: row.transport_mode,
        durationNights: row.duration_nights,
        notes: row.notes,
        coverPhotoUrl: cover ? getPhotoPublicUrl(cover.storage_path) : null,
        addedBy: {
          userId: row.user_id,
          username: row.profiles?.username ?? '?',
          avatarUrl: row.profiles?.avatar_url ?? null,
        },
      }

      const list = map.get(row.trip_id) ?? []
      list.push(entry)
      map.set(row.trip_id, list)
    }

    setVisitsByTrip(map)
    setLoading(false)
    // key (stabilná serializácia tripIds) je zámerne jediná závislosť - referencia poľa sa mení pri každom renderi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { visitsByTrip, loading, refetch: fetchAll }
}
