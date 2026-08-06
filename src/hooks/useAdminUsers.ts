import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface AdminUserRow {
  id: string
  username: string
  full_name: string | null
  is_admin: boolean
  created_at: string
  visited_count: number
  total_visits: number
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      setError(profilesError.message)
      setLoading(false)
      return
    }

    const { data: visits, error: visitsError } = await supabase.from('visits').select('user_id, capital_id')

    if (visitsError) {
      setError(visitsError.message)
      setLoading(false)
      return
    }

    const statsMap = new Map<string, { visited: Set<number>; total: number }>()
    for (const v of visits ?? []) {
      const entry = statsMap.get(v.user_id) ?? { visited: new Set<number>(), total: 0 }
      entry.visited.add(v.capital_id)
      entry.total += 1
      statsMap.set(v.user_id, entry)
    }

    const rows: AdminUserRow[] = (profiles ?? []).map((p) => ({
      id: p.id,
      username: p.username,
      full_name: p.full_name,
      is_admin: p.is_admin,
      created_at: p.created_at,
      visited_count: statsMap.get(p.id)?.visited.size ?? 0,
      total_visits: statsMap.get(p.id)?.total ?? 0,
    }))

    setUsers(rows)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return { users, loading, error, refetch: fetchUsers }
}
