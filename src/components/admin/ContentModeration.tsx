import { useState } from 'react'
import { format } from 'date-fns'
import { Trash2, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAdminVisits } from '../../hooks/useAdminVisits'

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
    return <div className="text-slate-400 dark:text-slate-500 text-sm py-8 text-center">Načítavam...</div>
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <input
          type="text"
          placeholder="Hľadať podľa používateľa, mesta alebo textu poznámky..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {error && <div className="px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-left sticky top-0">
            <tr>
              <th className="px-4 py-3 font-medium">Používateľ</th>
              <th className="px-4 py-3 font-medium">Mesto</th>
              <th className="px-4 py-3 font-medium">Dátum</th>
              <th className="px-4 py-3 font-medium">Poznámka</th>
              <th className="px-4 py-3 font-medium text-center">Foto</th>
              <th className="px-4 py-3 font-medium text-right">Akcia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{v.username}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{v.city}, {v.country}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{format(new Date(v.visit_date), 'd.M.yyyy')}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">{v.notes || '—'}</td>
                <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">{v.photo_count}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(v.id)}
                    disabled={deletingId === v.id}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40 transition"
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
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
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
