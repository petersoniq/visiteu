import { useCallback } from 'react'
import { EuropeMap } from '../components/map/EuropeMap'
import { ProgressBar } from '../components/stats/ProgressBar'
import { RegionBreakdown } from '../components/stats/RegionBreakdown'
import { BadgeGrid } from '../components/stats/BadgeGrid'
import { QuickStats } from '../components/stats/QuickStats'
import { AnnouncementBanner } from '../components/layout/AnnouncementBanner'
import { useAuth } from '../contexts/AuthContext'
import { useCapitals } from '../hooks/useCapitals'
import { useVisits } from '../hooks/useVisits'
import { useBadges } from '../hooks/useBadges'
import { useStats } from '../hooks/useStats'

export function DashboardPage() {
  const { profile, user } = useAuth()
  const { capitals, loading: capitalsLoading } = useCapitals()
  const { visits, loading: visitsLoading, refetch: refetchVisits } = useVisits()
  const { allBadges, earnedCodes, refetch: refetchBadges } = useBadges(user?.id)
  const stats = useStats(capitals, visits)

  // Jediné miesto, ktoré sa volá po uložení/zmazaní návštevy kdekoľvek v appke.
  // Obnoví návštevy AJ odznaky (tie sa prideľujú DB triggerom hneď pri uložení návštevy).
  const handleDataChanged = useCallback(() => {
    refetchVisits()
    refetchBadges()
  }, [refetchVisits, refetchBadges])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Ahoj, {profile?.username} 👋</h1>
        <p className="text-slate-500">Tu je tvoj prehľad cestovania po EÚ.</p>
      </div>

      <AnnouncementBanner />

      <QuickStats
        totalNights={stats.totalNights}
        totalVisits={stats.totalVisits}
        favoriteTransport={stats.favoriteTransport}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProgressBar visited={stats.visitedCount} total={stats.totalCapitals} percentage={stats.percentage} />
          <EuropeMap
            capitals={capitals}
            visits={visits}
            loading={capitalsLoading || visitsLoading}
            onDataChanged={handleDataChanged}
          />
        </div>

        <div className="space-y-6">
          <RegionBreakdown regionStats={stats.regionStats} />
          <BadgeGrid allBadges={allBadges} earnedCodes={earnedCodes} />
        </div>
      </div>
    </div>
  )
}
