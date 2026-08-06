import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface Announcement {
  id: string
  title: string
  content: string
  is_active: boolean
  created_at: string
}

export function useAnnouncements(onlyActive = false) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (onlyActive) query = query.eq('is_active', true)

    const { data } = await query
    setAnnouncements((data as Announcement[]) ?? [])
    setLoading(false)
  }, [onlyActive])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  return { announcements, loading, refetch: fetchAnnouncements }
}
