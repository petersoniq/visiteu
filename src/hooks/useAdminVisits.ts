import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface AdminVisitRow {
  id: string
  visit_date: string
  notes: string | null
  transport_mode: string
  username: string
  city: string
  country: string
  photo_count: number
}

export function useAdminVisits() {
  const [visits, setVisits] = useState<AdminVisitRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVisits = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('visits')
      .select(`
        id, visit_date, notes, transport_mode,
        profiles ( username ),
        eu_capitals ( city, country ),
        visit_photos ( id )
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const rows: AdminVisitRow[] = (data ?? []).map((v: any) => ({
      id: v.id,
      visit_date: v.visit_date,
      notes: v.notes,
      transport_mode: v.transport_mode,
      username: v.profiles?.username ?? 'neznámy',
      city: v.eu_capitals?.city ?? '—',
      country: v.eu_capitals?.country ?? '—',
      photo_count: v.visit_photos?.length ?? 0,
    }))

    setVisits(rows)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchVisits()
  }, [fetchVisits])

  return { visits, loading, error, refetch: fetchVisits }
}
