import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Trip, TripWithMembers, TripMember } from '../types'

interface RawTripRow {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  trip_members: {
    user_id: string
    role: TripMember['role']
    profiles: { username: string; avatar_url: string | null } | null
  }[]
}

function buildInviteUrl(token: string): string {
  // HashRouter - odkaz musí obsahovať #/join/<token>
  return `${window.location.origin}${window.location.pathname}#/join/${token}`
}

export function useTrips(userId?: string) {
  const [trips, setTrips] = useState<TripWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrips = useCallback(async () => {
    if (!userId) {
      setTrips([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Najprv zistíme, ktorých výletov je používateľ členom (vlastných aj tých,
    // do ktorých bol pozvaný) - a až potom natiahneme ich detail so zoznamom členov.
    const { data: memberships, error: memberError } = await supabase
      .from('trip_members')
      .select('trip_id')
      .eq('user_id', userId)

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    const tripIds = (memberships ?? []).map((m) => m.trip_id)
    if (tripIds.length === 0) {
      setTrips([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('trips')
      .select('*, trip_members(user_id, role, profiles(username, avatar_url))')
      .in('id', tripIds)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const rows = (data ?? []) as unknown as RawTripRow[]
    const mapped: TripWithMembers[] = rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
      members: (row.trip_members ?? []).map((m) => ({
        userId: m.user_id,
        role: m.role,
        username: m.profiles?.username ?? '?',
        avatarUrl: m.profiles?.avatar_url ?? null,
      })),
    }))

    setTrips(mapped)
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

  async function leaveTrip(id: string) {
    if (!userId) return { error: 'Nie si prihlásený.' }
    const { error } = await supabase.from('trip_members').delete().eq('trip_id', id).eq('user_id', userId)
    if (!error) await fetchTrips()
    return { error: error?.message ?? null }
  }

  /** Vráti existujúci nevyčerpaný pozývací odkaz, alebo vytvorí nový. */
  async function getOrCreateInviteLink(tripId: string): Promise<{ url: string | null; error: string | null }> {
    if (!userId) return { url: null, error: 'Nie si prihlásený.' }

    const { data: existing } = await supabase
      .from('trip_invites')
      .select('token, expires_at, max_uses, use_count')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (
      existing &&
      (!existing.expires_at || new Date(existing.expires_at) > new Date()) &&
      (existing.max_uses === null || existing.use_count < existing.max_uses)
    ) {
      return { url: buildInviteUrl(existing.token), error: null }
    }

    const { data, error } = await supabase
      .from('trip_invites')
      .insert({ trip_id: tripId, created_by: userId })
      .select('token')
      .single()

    if (error) return { url: null, error: error.message }
    return { url: buildInviteUrl(data.token), error: null }
  }

  return {
    trips,
    loading,
    error,
    refetch: fetchTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    leaveTrip,
    getOrCreateInviteLink,
  }
}
