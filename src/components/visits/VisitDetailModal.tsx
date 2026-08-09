import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2, Trash2, Plus, Luggage } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { visitSchema, type VisitFormData } from '../../lib/validation'
import { PhotoUpload } from './PhotoUpload'
import type { EuCapital, Trip, Visit, VisitPhoto } from '../../types'

interface Props {
  capital: EuCapital
  existingVisits: Visit[]
  trips: Trip[]
  onClose: () => void
  onSaved: () => void
  /** Zavolá sa hneď po úspešnom uložení/vytvorení návštevy (aj výletu) – aj keď modal ešte zostáva otvorený (napr. kvôli fotkám) */
  onDataChanged?: () => void
}

const TRANSPORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'lietadlo', label: '✈️ Lietadlo' },
  { value: 'vlak', label: '🚆 Vlak' },
  { value: 'auto', label: '🚗 Auto' },
  { value: 'autobus', label: '🚌 Autobus' },
  { value: 'bicykel', label: '🚲 Bicykel' },
  { value: 'pešo', label: '🚶 Pešo' },
  { value: 'loď', label: '⛴️ Loď' },
  { value: 'iné', label: '❓ Iné' },
]

const NEW_TRIP_VALUE = '__new__'

export function VisitDetailModal({ capital, existingVisits, trips, onClose, onSaved, onDataChanged }: Props) {
  const { user } = useAuth()
  const [mode, setMode] = useState<'list' | 'form'>(existingVisits.length > 0 ? 'list' : 'form')
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null)
  const [photos, setPhotos] = useState<VisitPhoto[]>([])
  const [savedVisitId, setSavedVisitId] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [tripSelection, setTripSelection] = useState<string>('')
  const [newTripName, setNewTripName] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VisitFormData>({ resolver: zodResolver(visitSchema) })

  function findTripName(tripId: string | null) {
    if (!tripId) return null
    return trips.find((t) => t.id === tripId)?.name ?? null
  }

  function startNewVisit() {
    setEditingVisit(null)
    setSavedVisitId(null)
    setPhotos([])
    setTripSelection('')
    setNewTripName('')
    reset({
      visit_date: format(new Date(), 'yyyy-MM-dd'),
      transport_mode: undefined,
      duration_nights: 1,
      notes: '',
      rating: undefined,
    })
    setMode('form')
  }

  async function startEditVisit(visit: Visit) {
    setEditingVisit(visit)
    setSavedVisitId(visit.id)
    setTripSelection(visit.trip_id ?? '')
    setNewTripName('')
    reset({
      visit_date: visit.visit_date,
      transport_mode: visit.transport_mode,
      duration_nights: visit.duration_nights,
      notes: visit.notes ?? '',
      rating: visit.rating ?? undefined,
    })

    const { data } = await supabase
      .from('visit_photos')
      .select('*')
      .eq('visit_id', visit.id)
      .order('created_at')
    setPhotos((data as VisitPhoto[]) ?? [])

    setMode('form')
  }

  async function handleDeleteVisit(visitId: string) {
    if (!confirm('Naozaj chceš zmazať túto návštevu vrátane fotiek?')) return
    setDeleting(visitId)
    const { error } = await supabase.from('visits').delete().eq('id', visitId)
    setDeleting(null)
    if (error) {
      setServerError(error.message)
      return
    }
    onSaved()
  }

  /** Vyrieši trip_id pre uloženie: buď existujúci výlet, nový (vytvorí ho), alebo žiadny. */
  async function resolveTripId(): Promise<{ tripId: string | null; error: string | null }> {
    if (tripSelection === NEW_TRIP_VALUE) {
      if (!newTripName.trim() || !user) return { tripId: null, error: 'Zadaj názov nového výletu.' }
      const { data, error } = await supabase
        .from('trips')
        .insert({ user_id: user.id, name: newTripName.trim() })
        .select()
        .single()
      if (error) return { tripId: null, error: error.message }
      onDataChanged?.()
      return { tripId: data.id as string, error: null }
    }
    return { tripId: tripSelection || null, error: null }
  }

  async function onSubmit(formData: VisitFormData) {
    if (!user) return
    setServerError(null)

    const { tripId, error: tripError } = await resolveTripId()
    if (tripError) {
      setServerError(tripError)
      return
    }

    if (editingVisit) {
      const { error } = await supabase
        .from('visits')
        .update({
          visit_date: formData.visit_date,
          transport_mode: formData.transport_mode,
          duration_nights: formData.duration_nights,
          notes: formData.notes || null,
          rating: formData.rating || null,
          trip_id: tripId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingVisit.id)

      if (error) {
        setServerError(error.message)
        return
      }
      onSaved()
    } else {
      const { data, error } = await supabase
        .from('visits')
        .insert({
          user_id: user.id,
          capital_id: capital.id,
          visit_date: formData.visit_date,
          transport_mode: formData.transport_mode,
          duration_nights: formData.duration_nights,
          notes: formData.notes || null,
          rating: formData.rating || null,
          trip_id: tripId,
        })
        .select()
        .single()

      if (error) {
        setServerError(error.message)
        return
      }

      setSavedVisitId(data.id)
      setEditingVisit(data as Visit)
      // Návšteva je uložená (aj odznaky sú DB triggerom pridelené) – obnov štatistiky
      // hneď, aj keď modal necháme otvorený kvôli pridávaniu fotiek.
      onDataChanged?.()
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{capital.city}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{capital.country}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'list' && (
          <div className="space-y-3">
            {existingVisits.map((visit) => {
              const tripName = findTripName(visit.trip_id)
              return (
                <div
                  key={visit.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-start justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {format(new Date(visit.visit_date), 'd. MMMM yyyy')}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {TRANSPORT_OPTIONS.find((t) => t.value === visit.transport_mode)?.label} ·{' '}
                      {visit.duration_nights} nocí
                    </p>
                    {tripName && (
                      <p className="text-xs text-accent-text mt-1 flex items-center gap-1">
                        <Luggage className="w-3 h-3" /> {tripName}
                      </p>
                    )}
                    {visit.notes && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{visit.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => startEditVisit(visit)}
                      className="text-xs px-2 py-1 rounded-md text-accent-text hover:bg-accent/10"
                    >
                      Upraviť
                    </button>
                    <button
                      onClick={() => handleDeleteVisit(visit.id)}
                      disabled={deleting === visit.id}
                      className="text-xs px-2 py-1 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      {deleting === visit.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}

            <button
              onClick={startNewVisit}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:border-accent hover:text-accent transition"
            >
              <Plus className="w-4 h-4" /> Pridať ďalšiu návštevu
            </button>
          </div>
        )}

        {mode === 'form' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dátum návštevy</label>
                <input
                  type="date"
                  {...register('visit_date')}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.visit_date && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.visit_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Počet nocí</label>
                <input
                  type="number"
                  min={0}
                  {...register('duration_nights')}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.duration_nights && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.duration_nights.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Spôsob dopravy</label>
              <select
                {...register('transport_mode')}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                defaultValue=""
              >
                <option value="" disabled>Vyber...</option>
                {TRANSPORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.transport_mode && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.transport_mode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Luggage className="w-3.5 h-3.5" /> Výlet (voliteľné)
              </label>
              <select
                value={tripSelection}
                onChange={(e) => setTripSelection(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Bez výletu</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                <option value={NEW_TRIP_VALUE}>+ Nový výlet...</option>
              </select>
              {tripSelection === NEW_TRIP_VALUE && (
                <input
                  type="text"
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  placeholder="Napr. Interrail leto 2026"
                  className="w-full mt-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Zoskup túto návštevu s ďalšími mestami z tej istej cesty.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hodnotenie (voliteľné)</label>
              <select
                {...register('rating')}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                defaultValue=""
              >
                <option value="">Bez hodnotenia</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{'⭐'.repeat(n)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Poznámky / recenzia</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Ako sa ti tam páčilo? Čo odporúčaš vidieť?"
              />
              {errors.notes && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.notes.message}</p>}
            </div>

            {savedVisitId && user ? (
              <PhotoUpload
                userId={user.id}
                visitId={savedVisitId}
                photos={photos}
                onPhotosChange={setPhotos}
              />
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                Fotky budeš môcť pridať hneď po uložení návštevy.
              </p>
            )}

            {serverError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                {serverError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {existingVisits.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Späť na zoznam
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {savedVisitId ? 'Uložiť zmeny' : 'Uložiť návštevu'}
              </button>
            </div>

            {savedVisitId && (
              <button
                type="button"
                onClick={() => onSaved()}
                className="w-full text-sm text-accent-text hover:underline pt-1"
              >
                Hotovo, zavrieť ✓
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
