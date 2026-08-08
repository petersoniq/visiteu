import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Trip } from '../types'

export function useTrips(userId?: string) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrips = useCallback(async () => {
    if (!userId) {
      setTrips([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setTrips((data as Trip[]) ?? [])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  async function createTrip(name: string, description?: string): Promise<{ trip: Trip | null; error: string | null }> {
    if (!userId) return { trip: null, error: 'Nie si prihlásený.' }

    const { data, error } = await supabase
      .from('trips')
      .insert({ user_id: userId, name: name.trim(), description: description?.trim() || null })
      .select()
      .single()

    if (error) return { trip: null, error: error.message }

    await fetchTrips()
    return { trip: data as Trip, error: null }
  }

  async function updateTrip(id: string, updates: { name?: string; description?: string | null }) {
    const { error } = await supabase
      .from('trips')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) await fetchTrips()
    return { error: error?.message ?? null }
  }

  async function deleteTrip(id: string) {
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (!error) await fetchTrips()
    return { error: error?.message ?? null }
  }

  return { trips, loading, error, refetch: fetchTrips, createTrip, updateTrip, deleteTrip }
}
