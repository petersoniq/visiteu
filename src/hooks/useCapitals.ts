import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { EuCapital } from '../types'

export function useCapitals() {
  const [capitals, setCapitals] = useState<EuCapital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function fetchCapitals() {
      const { data, error } = await supabase.from('eu_capitals').select('*').order('country')

      if (!active) return

      if (error) {
        setError(error.message)
      } else {
        setCapitals(data as EuCapital[])
      }
      setLoading(false)
    }

    fetchCapitals()
    return () => {
      active = false
    }
  }, [])

  return { capitals, loading, error }
}
