import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import type { Memory } from '../../hooks/useMemoryOfTheDay'

interface Props {
  memories: Memory[]
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function yearsAgoLabel(n: number): string {
  return n === 1 ? 'pred rokom' : `pred ${n} rokmi`
}

export function MemoryBanner({ memories }: Props) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('visiteu-memory-dismissed') === todayKey()
  })

  if (memories.length === 0 || dismissed) return null

  const primary = memories[0]

  function handleDismiss() {
    window.localStorage.setItem('visiteu-memory-dismissed', todayKey())
    setDismissed(true)
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 mb-6">
      {primary.visit.coverPhotoUrl ? (
        <img
          src={primary.visit.coverPhotoUrl}
          alt={primary.visit.capital.city}
          className="w-14 h-14 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-accent-text" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
          <Sparkles className="w-3.5 h-3.5 text-accent-text shrink-0" />
          Presne {yearsAgoLabel(primary.yearsAgo)} si bol v{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">{primary.visit.capital.city}</span>
        </p>
        {memories.length > 1 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            +{memories.length - 1} {memories.length - 1 === 1 ? 'ďalšia spomienka' : 'ďalšie spomienky'} z tohto dňa
          </p>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
        aria-label="Zavrieť pripomienku"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
