import { useState } from 'react'
import { format } from 'date-fns'
import { Trash2, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAdminVisits } from '../../hooks/useAdminVisits'
import { SkeletonRows } from '../ui/Skeleton'

export function ContentModeration() {
  const { visits, loading, error, refetch } = useAdminVisits()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  async function handleDelete(visitId: string) {
    if (!confirm('Naozaj chceš natrvalo zmazať túto návštevu? Vrátane fotiek.')) return
    setDeletingId(visitId)
    const { error } = await supabase.from('visits').delete().eq('id', visitId)
    setDeletingId(null)
    if (!error) refetch()
  }

  const filtered = visits.filter(
    (v) =>
      v.username.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase()) ||
      (v.notes ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="bg-paper rounded-xl border border-hairline shadow-sm">
        <SkeletonRows rows={6} />
      </div>
    )
  }

  return (
    <div className="bg-paper rounded-xl border border-hairline shadow-sm overflow-hidden">
      <div className="p-4 border-b border-hairline">
        <input
          type="text"
          placeholder="Hľadať podľa používateľa, mesta alebo textu poznámky..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-hairline bg-paper text-ink px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {error && <div className="px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-ink-muted text-left sticky top-0">
            <tr>
              <th className="px-4 py-3 font-medium">Používateľ</th>
              <th className="px-4 py-3 font-medium">Mesto</th>
              <th className="px-4 py-3 font-medium">Dátum</th>
              <th className="px-4 py-3 font-medium">Poznámka</th>
              <th className="px-4 py-3 font-medium text-center">Foto</th>
              <th className="px-4 py-3 font-medium text-right">Akcia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-paper-dim/50">
                <td className="px-4 py-3 font-medium text-ink">{v.username}</td>
                <td className="px-4 py-3 text-ink-secondary">{v.city}, {v.country}</td>
                <td className="px-4 py-3 text-ink-muted">{format(new Date(v.visit_date), 'd.M.yyyy')}</td>
                <td className="px-4 py-3 text-ink-muted max-w-xs truncate">{v.notes || '—'}</td>
                <td className="px-4 py-3 text-center text-ink-muted">{v.photo_count}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(v.id)}
                    disabled={deletingId === v.id}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 transition"
                  >
                    {deletingId === v.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" /> Zmazať
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-faint">
                  Žiadne záznamy nezodpovedajú hľadaniu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
