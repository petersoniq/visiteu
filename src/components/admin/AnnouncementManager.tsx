import { useState } from 'react'
import { Loader2, Megaphone, Trash2, EyeOff, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useAnnouncements } from '../../hooks/useAnnouncements'
import { format } from 'date-fns'

export function AnnouncementManager() {
  const { user } = useAuth()
  const { announcements, loading, refetch } = useAnnouncements()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !title.trim() || !content.trim()) return

    setSubmitting(true)
    setError(null)
    const { error } = await supabase.from('announcements').insert({
      title: title.trim(),
      content: content.trim(),
      created_by: user.id,
    })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }
    setTitle('')
    setContent('')
    refetch()
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('announcements').update({ is_active: !current }).eq('id', id)
    refetch()
  }

  async function handleDelete(id: string) {
    if (!confirm('Zmazať toto oznámenie?')) return
    await supabase.from('announcements').delete().eq('id', id)
    refetch()
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Megaphone className="w-4 h-4" /> Nové oznámenie
        </h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="text"
            placeholder="Nadpis"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <textarea
            placeholder="Text oznámenia..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Publikovať
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        {loading && <div className="p-4 text-sm text-slate-400 dark:text-slate-500">Načítavam...</div>}
        {!loading && announcements.length === 0 && (
          <div className="p-4 text-sm text-slate-400 dark:text-slate-500">Zatiaľ žiadne oznámenia.</div>
        )}
        {announcements.map((a) => (
          <div key={a.id} className="p-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">{a.title}</h4>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    a.is_active ? 'bg-accent/15 text-accent-text' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {a.is_active ? 'Aktívne' : 'Skryté'}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{a.content}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{format(new Date(a.created_at), 'd.M.yyyy HH:mm')}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => toggleActive(a.id, a.is_active)}
                className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                title={a.is_active ? 'Skryť' : 'Zverejniť'}
              >
                {a.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleDelete(a.id)}
                className="p-1.5 rounded-md text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                title="Zmazať"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
