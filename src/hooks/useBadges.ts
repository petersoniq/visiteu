import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let active = true

    async function fetchBadges() {
      const [allRes, earnedRes] = await Promise.all([
        supabase.from('badges').select('*').order('id'),
        supabase
          .from('user_badges')
          .select('earned_at, badge:badges(*)')
          .eq('user_id', userId)
          .order('earned_at', { ascending: false }),
      ])

      if (!active) return

      if (allRes.data) setAllBadges(allRes.data as Badge[])
      if (earnedRes.data) setEarnedBadges(earnedRes.data as unknown as UserBadge[])
      setLoading(false)
    }

    fetchBadges()
    return () => {
      active = false
    }
  }, [userId])

  const earnedCodes = new Set(earnedBadges.map((eb) => eb.badge.code))

  return { allBadges, earnedBadges, earnedCodes, loading }
}
