import { useEffect, useMemo, useState } from 'react'
import { Users, UserPlus, X, Loader2, Link, History } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import type { VisitCompanion } from '../../types'

interface Props {
  userId: string
  visitId: string
  companions: VisitCompanion[]
  onCompanionsChange: (companions: VisitCompanion[]) => void
}

interface PreviousCompanion {
  name: string
  email: string | null
}

export function CompanionsEditor({ userId, visitId, companions, onCompanionsChange }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [previousCompanions, setPreviousCompanions] = useState<PreviousCompanion[]>([])
  const [selectedPrevious, setSelectedPrevious] = useState('')

  // Natiahni všetkých spolucestujúcich, ktorých si tento používateľ niekedy pridal
  // (naprieč všetkými jeho návštevami) - ponúkneme ich na rýchly opätovný výber.
  useEffect(() => {
    let active = true

    async function loadPrevious() {
      const { data } = await supabase
        .from('visits')
        .select('visit_companions(name, email, created_at)')
        .eq('user_id', userId)

      if (!active) return

      const rows = (data ?? []) as { visit_companions: { name: string; email: string | null; created_at: string }[] }[]
      const all = rows
        .flatMap((r) => r.visit_companions ?? [])
        .sort((a, b) => b.created_at.localeCompare(a.created_at))

      const seen = new Set<string>()
      const unique: PreviousCompanion[] = []
      for (const c of all) {
        const key = (c.email || c.name).toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        unique.push({ name: c.name, email: c.email })
      }
      setPreviousCompanions(unique)
    }

    loadPrevious()
    return () => {
      active = false
    }
  }, [userId])

  // Neponúkaj v zozname niekoho, kto je už pridaný k tejto konkrétnej návšteve
  const availablePrevious = useMemo(
    () => previousCompanions.filter((p) => !companions.some((c) => c.name.toLowerCase() === p.name.toLowerCase())),
    [previousCompanions, companions]
  )

  async function addCompanion(nameValue: string, emailValue: string) {
    if (!nameValue.trim()) return

    setAdding(true)
    setError(null)

    const { data, error: dbError } = await supabase
      .from('visit_companions')
      .insert({ visit_id: visitId, name: nameValue.trim(), email: emailValue.trim() || null })
      .select('id, visit_id, name, matched_user_id, created_at')
      .single()

    setAdding(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    onCompanionsChange([...companions, data as VisitCompanion])
  }

  async function handleAddNew() {
    await addCompanion(name, email)
    setName('')
    setEmail('')
  }

  async function handleSelectPrevious(indexStr: string) {
    setSelectedPrevious(indexStr)
    if (!indexStr) return
    const chosen = availablePrevious[Number(indexStr)]
    if (!chosen) return
    await addCompanion(chosen.name, chosen.email ?? '')
    setSelectedPrevious('')
  }

  async function handleRemove(id: string) {
    setRemovingId(id)
    const { error: dbError } = await supabase.from('visit_companions').delete().eq('id', id)
    setRemovingId(null)

    if (dbError) {
      setError(dbError.message)
      return
    }
    onCompanionsChange(companions.filter((c) => c.id !== id))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" /> Spolucestujúci (voliteľné)
      </label>

      {companions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {companions.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full pl-2.5 pr-1.5 py-1"
            >
              {c.name}
              {c.matched_user_id && (
                <span title="Má účet vo visitEU - uvidí túto návštevu aj vo svojom prehľade">
                  <Link className="w-3 h-3 text-accent-text" />
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(c.id)}
                disabled={removingId === c.id}
                className="hover:text-red-600 dark:hover:text-red-400"
              >
                {removingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              </button>
            </span>
          ))}
        </div>
      )}

      {availablePrevious.length > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <select
            value={selectedPrevious}
            onChange={(e) => handleSelectPrevious(e.target.value)}
            disabled={adding}
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          >
            <option value="">Vybrať niekoho, koho si už pridal(a) predtým...</option>
            {availablePrevious.map((p, i) => (
              <option key={i} value={i}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddNew()}
          placeholder="Meno novej osoby"
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddNew()}
          placeholder="E-mail (voliteľné)"
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="button"
          onClick={handleAddNew}
          disabled={adding || !name.trim()}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50 shrink-0"
        >
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
          Pridať
        </button>
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
        Meno je viditeľné len tebe a spolucestujúcemu. Ak zadáš e-mail registrovaného používateľa,
        táto návšteva sa mu automaticky objaví aj v jeho vlastnom prehľade.
      </p>
    </div>
  )
}
