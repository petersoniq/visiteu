import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Luggage, Pencil, Check, X, Trash2, Plus, Loader2, MapPin, Moon } from 'lucide-react'
import type { Trip, VisitWithDetails } from '../../types'

interface Props {
  trips: Trip[]
  visits: VisitWithDetails[]
  loading: boolean
  onCreateTrip: (name: string, description?: string) => Promise<{ trip: Trip | null; error: string | null }>
  onUpdateTrip: (id: string, updates: { name?: string; description?: string | null }) => Promise<{ error: string | null }>
  onDeleteTrip: (id: string) => Promise<{ error: string | null }>
}

interface TripSummary {
  trip: Trip
  visits: VisitWithDetails[]
  cityCount: number
  totalNights: number
  dateRangeLabel: string
  coverPhotoUrl: string | null
}

export function TripsOverview({ trips, visits, loading, onCreateTrip, onUpdateTrip, onDeleteTrip }: Props) {
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const summaries = useMemo<TripSummary[]>(() => {
    return trips.map((trip) => {
      const tripVisits = visits
        .filter((v) => v.trip_id === trip.id)
        .sort((a, b) => a.visit_date.localeCompare(b.visit_date))

      const cityCount = new Set(tripVisits.map((v) => v.capital_id)).size
      const totalNights = tripVisits.reduce((sum, v) => sum + v.duration_nights, 0)

      let dateRangeLabel = 'Zatiaľ bez dátumov'
      if (tripVisits.length > 0) {
        const first = tripVisits[0].visit_date
        const last = tripVisits[tripVisits.length - 1].visit_date
        dateRangeLabel =
          first === last
            ? format(new Date(first), 'd. M. yyyy')
            : `${format(new Date(first), 'd. M. yyyy')} – ${format(new Date(last), 'd. M. yyyy')}`
      }

      const coverPhotoUrl = tripVisits.find((v) => v.coverPhotoUrl)?.coverPhotoUrl ?? null

      return { trip, visits: tripVisits, cityCount, totalNights, dateRangeLabel, coverPhotoUrl }
    })
  }, [trips, visits])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setCreateError(null)
    const { error } = await onCreateTrip(newName.trim())
    setCreating(false)
    if (error) {
      setCreateError(error)
      return
    }
    setNewName('')
  }

  function startEdit(trip: Trip) {
    setEditingId(trip.id)
    setEditName(trip.name)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    await onUpdateTrip(id, { name: editName.trim() })
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Zmazať tento výlet? Návštevy v ňom zostanú zachované, len sa odviažu.')) return
    setDeletingId(id)
    await onDeleteTrip(id)
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[0, 1].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Vytvorenie nového výletu */}
      <form
        onSubmit={handleCreate}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Názov nového výletu, napr. Interrail leto 2026"
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition disabled:opacity-50 shrink-0"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Nový výlet
        </button>
      </form>
      {createError && <p className="text-sm text-red-600 dark:text-red-400 -mt-3">{createError}</p>}

      {/* Zoznam výletov */}
      {summaries.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Luggage className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-slate-500 dark:text-slate-400">Zatiaľ žiadne výlety.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Vytvor výlet vyššie, alebo ho priraď priamo pri pridávaní návštevy mesta.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {summaries.map(({ trip, visits: tripVisits, cityCount, totalNights, dateRangeLabel, coverPhotoUrl }) => (
            <div
              key={trip.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              <div className="flex">
                {coverPhotoUrl && (
                  <div className="w-28 sm:w-40 shrink-0 hidden sm:block">
                    <img src={coverPhotoUrl} alt={trip.name} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    {editingId === trip.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <button onClick={() => saveEdit(trip.id)} className="text-accent-text">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 dark:text-slate-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 min-w-0">
                        <Luggage className="w-4 h-4 text-accent-text shrink-0" />
                        <span className="truncate">{trip.name}</span>
                      </h3>
                    )}

                    {editingId !== trip.id && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(trip)}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                          title="Premenovať"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(trip.id)}
                          disabled={deletingId === trip.id}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400"
                          title="Zmazať výlet"
                        >
                          {deletingId === trip.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{dateRangeLabel}</p>

                  {tripVisits.length > 0 && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {cityCount} {cityCount === 1 ? 'mesto' : 'miest'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Moon className="w-3 h-3" /> {totalNights} nocí
                      </span>
                    </div>
                  )}

                  {tripVisits.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {tripVisits.map((v) => (
                        <span
                          key={v.id}
                          className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full px-2.5 py-1"
                        >
                          {v.capital.city}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-3">
                      Zatiaľ žiadne mestá - priraď ich pri pridávaní návštevy.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
