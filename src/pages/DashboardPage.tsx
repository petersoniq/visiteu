import { useCallback, useState } from 'react'
import { BookOpen, Map as MapIcon } from 'lucide-react'
import { EuropeMap } from '../components/map/EuropeMap'
import { BadgeGrid } from '../components/stats/BadgeGrid'
import { AnnouncementBanner } from '../components/layout/AnnouncementBanner'
import { JournalDashboard } from '../components/dashboard/JournalDashboard'
import { useAuth } from '../contexts/AuthContext'
import { useCapitals } from '../hooks/useCapitals'
import { useVisitsWithDetails } from '../hooks/useVisitsWithDetails'
import { useBadges } from '../hooks/useBadges'
import { useStats } from '../hooks/useStats'

type Tab = 'journal' | 'map'

export function DashboardPage() {
  const { profile, user } = useAuth()
  const [tab, setTab] = useState<Tab>('journal')

  // Jediný zdroj pravdy pre celú stránku (mapu aj denník) - rieši to, že po
  // uložení návštevy sa musia obnoviť štatistiky VŠADE, nie len tam, kde bola uložená.
  const { capitals, loading: capitalsLoading } = useCapitals()
  const { visits, loading: visitsLoading, refetch: refetchVisits } = useVisitsWithDetails(user?.id)
  const { allBadges, earnedCodes, refetch: refetchBadges } = useBadges(user?.id)
  const stats = useStats(capitals, visits)
  const loading = capitalsLoading || visitsLoading

  const handleDataChanged = useCallback(() => {
    refetchVisits()
    refetchBadges()
  }, [refetchVisits, refetchBadges])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Ahoj, {profile?.username} 👋</h1>
          <p className="text-slate-500 dark:text-slate-400">Tu je tvoj prehľad cestovania po EÚ.</p>
        </div>

        <div className="flex gap-1 border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-white dark:bg-slate-900 self-start">
          <button
            onClick={() => setTab('journal')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              tab === 'journal'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Denník
          </button>
          <button
            onClick={() => setTab('map')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              tab === 'map'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <MapIcon className="w-4 h-4" /> Mapa
          </button>
        </div>
      </div>

      <AnnouncementBanner />

      {tab === 'journal' && <JournalDashboard visits={visits} stats={stats} loading={loading} />}

      {tab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <EuropeMap capitals={capitals} visits={visits} loading={loading} onDataChanged={handleDataChanged} />
          </div>
          <div className="space-y-6">
            <BadgeGrid allBadges={allBadges} earnedCodes={earnedCodes} />
          </div>
        </div>
      )}
    </div>
  )
}
