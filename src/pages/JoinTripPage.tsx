import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Loader2, PartyPopper, AlertTriangle, Luggage } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

type Status = 'joining' | 'success' | 'error'

export function JoinTripPage() {
  const { token } = useParams<{ token: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [status, setStatus] = useState<Status>('joining')
  const [tripName, setTripName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!token) {
      setStatus('error')
      setError('Neplatný pozývací odkaz.')
      return
    }

    if (!user) {
      navigate('/login', { replace: true, state: { from: `/join/${token}` } })
      return
    }

    let active = true

    async function join() {
      const { data, error } = await supabase.rpc('join_trip_via_invite', { p_token: token })

      if (!active) return

      if (error) {
        setStatus('error')
        setError(error.message)
        return
      }

      const trip = Array.isArray(data) ? data[0] : data
      setTripName(trip?.trip_name ?? null)
      setStatus('success')
    }

    join()
    return () => {
      active = false
    }
  }, [user, authLoading, token, navigate])

  if (authLoading || status === 'joining') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Pripájam ťa k výletu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
        {status === 'success' ? (
          <>
            <PartyPopper className="w-10 h-10 text-accent-text mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Si v tíme!</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              {tripName ? (
                <>
                  Pripojil(a) si sa k výletu <span className="font-medium text-slate-700 dark:text-slate-300">{tripName}</span>.
                  Teraz doň môžeš pridávať vlastné mestá, dátumy a fotky.
                </>
              ) : (
                'Pripojenie prebehlo úspešne.'
              )}
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition"
            >
              <Luggage className="w-4 h-4" /> Prejsť na Výlety
            </Link>
          </>
        ) : (
          <>
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Pripojenie zlyhalo</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              {error ?? 'Skús to znova, alebo si vyžiadaj nový odkaz.'}
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Späť do appky
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
