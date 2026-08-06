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
        <div key={a.id} className="flex items-start gap-3 rounded-lg bg-sky-50 border border-sky-200 px-4 py-3">
          <Megaphone className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-sky-900">{a.title}</p>
            <p className="text-sm text-sky-700">{a.content}</p>
          </div>
          <button
            onClick={() => setDismissed((prev) => new Set(prev).add(a.id))}
            className="text-sky-400 hover:text-sky-600 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
