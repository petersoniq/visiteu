import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface AdminUserOverviewRow {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
  email: string | null
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  visited_count: number
  total_visits: number
  pending_visits_count: number
  badges_earned: number
  photos_count: number
  storage_bytes: number
  trips_count: number
  companions_count: number
}

/**
 * Agregovaný prehľad všetkých používateľov pre admin záložku "Prehľad" - kombinuje
 * profil, auth údaje (email, posledné prihlásenie - inak z klienta nedostupné)
 * a štatistiky naprieč celou appkou. Backend (RPC `admin_list_users_overview`)
 * si prístup sám overuje cez `is_admin()`, takže pre bežného používateľa vráti chybu.
 */
export function useAdminUserOverview() {
  const [rows, setRows] = useState<AdminUserOverviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: rpcError } = await supabase.rpc('admin_list_users_overview')

    if (rpcError) {
      setError(rpcError.message)
      setRows([])
      setLoading(false)
      return
    }

    setRows((data ?? []) as AdminUserOverviewRow[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  return { rows, loading, error, refetch: fetchOverview }
}
