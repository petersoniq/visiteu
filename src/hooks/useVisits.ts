import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import type { Visit } from '../types'

export function useVisits(userId?: string) {
  const { user } = useAuth()
  const targetUserId = userId ?? user?.id

  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVisits = useCallback(async () => {
    if (!targetUserId) {
      setVisits([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('user_id', targetUserId)
      .order('visit_date', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setVisits(data as Visit[])
    }
    setLoading(false)
  }, [targetUserId])

  useEffect(() => {
    fetchVisits()
  }, [fetchVisits])

  const visitedCapitalIds = new Set(visits.map((v) => v.capital_id))

  return { visits, visitedCapitalIds, loading, error, refetch: fetchVisits }
}
