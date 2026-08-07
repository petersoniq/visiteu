import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface Badge {
  id: number
  code: string
  name: string
  description: string | null
  icon: string | null
}

export interface UserBadge {
  badge: Badge
  earned_at: string
}

export function useBadges(userId?: string) {
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBadges = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    const [allRes, earnedRes] = await Promise.all([
      supabase.from('badges').select('*').order('id'),
      supabase
        .from('user_badges')
        .select('earned_at, badge:badges(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false }),
    ])

    if (allRes.data) setAllBadges(allRes.data as Badge[])
    if (earnedRes.data) setEarnedBadges(earnedRes.data as unknown as UserBadge[])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchBadges()
  }, [fetchBadges])

  const earnedCodes = new Set(earnedBadges.map((eb) => eb.badge.code))

  return { allBadges, earnedBadges, earnedCodes, loading, refetch: fetchBadges }
}
