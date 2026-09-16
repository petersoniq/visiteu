import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface AdminUserDetailVisit {
  id: string
  city: string
  country: string
  visit_date: string
  participant_status: 'pending' | 'confirmed' | 'declined'
  transport_mode: string
  rating: number | null
  photo_count: number
}

export interface AdminUserDetailBadge {
  code: string
  name: string
  icon: string
  earned_at: string
}

export interface AdminUserDetailTrip {
  id: string
  name: string
  role: string
  joined_at: string
}

export interface AdminUserDetailCompanion {
  name: string
  matched_user_id: string | null
}

export interface AdminUserDetail {
  profile: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    is_admin: boolean
    created_at: string
    email: string | null
    last_sign_in_at: string | null
    email_confirmed_at: string | null
  }
  visits: AdminUserDetailVisit[]
  badges: AdminUserDetailBadge[]
  trips: AdminUserDetailTrip[]
  companions: AdminUserDetailCompanion[]
  storage_bytes: number
}

/** Detail jedného používateľa pre admin modal na rozkliknutie z prehľadovej tabuľky. */
export function useAdminUserDetail(userId: string | null) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    if (!userId) {
      setDetail(null)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: rpcError } = await supabase.rpc('admin_get_user_detail', { p_user_id: userId })

    if (rpcError) {
      setError(rpcError.message)
      setDetail(null)
      setLoading(false)
      return
    }

    setDetail(data as AdminUserDetail)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  return { detail, loading, error, refetch: fetchDetail }
}
