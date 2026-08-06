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
  const { capitals } = useCapitals()
  const { visits } = useVisits()
  const { allBadges, earnedCodes } = useBadges(user?.id)
  const stats = useStats(capitals, visits)

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
          <EuropeMap />
        </div>

        <div className="space-y-6">
          <RegionBreakdown regionStats={stats.regionStats} />
          <BadgeGrid allBadges={allBadges} earnedCodes={earnedCodes} />
        </div>
      </div>
    </div>
  )
}
