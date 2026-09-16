import { useState } from 'react'
import { format } from 'date-fns'
import { UserRoundPlus, Check, X, Loader2 } from 'lucide-react'
import { useVisitParticipation } from '../../hooks/useVisitParticipation'
import type { PendingVisit } from '../../hooks/useVisitsWithDetails'

interface Props {
  pendingVisits: PendingVisit[]
  onResolved: () => void
}

/**
 * Banner s návštevami, ktoré niekto pridal a označil ťa ako spolucestujúceho.
 * Kým ich nepotvrdíš, nezapočítavajú sa do štatistík, mapy ani odznakov.
 * Zobrazuje sa naprieč všetkými záložkami dashboardu.
 */
export function PendingVisitsBanner({ pendingVisits, onResolved }: Props) {
  const { processingId, confirmVisit, declineVisit, error } = useVisitParticipation()
  const [dismissedError, setDismissedError] = useState(false)

  if (pendingVisits.length === 0) return null

  async function handle(visitId: string, action: 'confirm' | 'decline') {
    setDismissedError(false)
    const ok = action === 'confirm' ? await confirmVisit(visitId) : await declineVisit(visitId)
    if (ok) onResolved()
  }

  return (
    <div className="space-y-2 mb-6">
      {error && !dismissedError && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3">
          <p className="flex-1 text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={() => setDismissedError(true)}
            className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {pendingVisits.map((visit) => {
        const isProcessing = processingId === visit.id
        return (
          <div
            key={visit.id}
            className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-4 py-3"
          >
            <UserRoundPlus className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                {visit.invitedByUsername ?? 'Niekto'} ťa pridal(a) ako spolucestujúceho
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {visit.capital.city}, {visit.capital.country} · {format(new Date(visit.visit_date), 'd. M. yyyy')}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handle(visit.id, 'decline')}
                disabled={isProcessing}
                className="inline-flex items-center gap-1 rounded-md border border-amber-300 dark:border-amber-800 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Odmietnuť
              </button>
              <button
                onClick={() => handle(visit.id, 'confirm')}
                disabled={isProcessing}
                className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Potvrdiť
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
