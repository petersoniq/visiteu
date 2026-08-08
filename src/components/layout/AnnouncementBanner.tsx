import { useState } from 'react'
import { Megaphone, X } from 'lucide-react'
import { useAnnouncements } from '../../hooks/useAnnouncements'

export function AnnouncementBanner() {
  const { announcements } = useAnnouncements(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = announcements.filter((a) => !dismissed.has(a.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {visible.map((a) => (
        <div key={a.id} className="flex items-start gap-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 px-4 py-3">
          <Megaphone className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-sky-900 dark:text-sky-200">{a.title}</p>
            <p className="text-sm text-sky-700 dark:text-sky-400">{a.content}</p>
          </div>
          <button
            onClick={() => setDismissed((prev) => new Set(prev).add(a.id))}
            className="text-sky-400 dark:text-sky-500 hover:text-sky-600 dark:hover:text-sky-300 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
