import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { BookOpen, Map as MapIcon, Landmark, Luggage } from 'lucide-react'
import { BadgeGrid } from '../components/stats/BadgeGrid'
import { AnnouncementBanner } from '../components/layout/AnnouncementBanner'
import { JournalDashboard } from '../components/dashboard/JournalDashboard'
import { useAuth } from '../contexts/AuthContext'
import { useCapitals } from '../hooks/useCapitals'
import { useVisitsWithDetails } from '../hooks/useVisitsWithDetails'
import { useBadges } from '../hooks/useBadges'
import { useTrips } from '../hooks/useTrips'
import { useStats } from '../hooks/useStats'

// Denník je predvolená záložka, preto ostáva eager. Mapa (ťahá za sebou celý
// Leaflet), Mestá a Výlety sa načítajú (code-split) až pri prvom otvorení
// danej záložky - zmenšuje to úvodný JS bundle appky.
const EuropeMap = lazy(() => import('../components/map/EuropeMap').then((m) => ({ default: m.EuropeMap })))
const CitiesList = lazy(() => import('../components/dashboard/CitiesList').then((m) => ({ default: m.CitiesList })))
const TripsOverview = lazy(() =>
  import('../components/dashboard/TripsOverview').then((m) => ({ default: m.TripsOverview }))
)

type Tab = 'journal' | 'map' | 'cities' | 'trips'

/** Ako dávno musela byť návšteva pridaná k výletu, aby sme ho ešte ponúkli ako "rozostavaný" (v dňoch). */
const RECENT_TRIP_WINDOW_DAYS = 30

function TabFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
    </div>
  )
}

export function DashboardPage() {
  const { profile, user } = useAuth()
  const [tab, setTab] = useState<Tab>('journal')

  // Jediný zdroj pravdy pre celú stránku (mapu, denník, mestá aj výlety) - rieši to,
  // že po uložení návštevy sa musia obnoviť štatistiky VŠADE, nie len tam, kde bola uložená.
  const { capitals, loading: capitalsLoading } = useCapitals()
  const { visits, loading: visitsLoading, refetch: refetchVisits } = useVisitsWithDetails(user?.id)
  const { allBadges, earnedCodes, refetch: refetchBadges } = useBadges(user?.id)
  const { trips, loading: tripsLoading, createTrip, updateTrip, deleteTrip, refetch: refetchTrips } = useTrips(
    user?.id
  )
  const stats = useStats(capitals, visits)
  const loading = capitalsLoading || visitsLoading

  // Výlet, do ktorého bola naposledy pridaná návšteva (ak to nebolo príliš dávno) -
  // ponúkne sa ako rýchla skratka "Pridať do X?" pri zaznamenávaní ďalšieho mesta.
  const suggestedTripId = useMemo(() => {
    const withTrip = visits
      .filter((v) => v.trip_id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
    const mostRecent = withTrip[0]
    if (!mostRecent) return null

    const ageDays = (Date.now() - new Date(mostRecent.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (ageDays > RECENT_TRIP_WINDOW_DAYS) return null

    return mostRecent.trip_id
  }, [visits])

  const handleDataChanged = useCallback(() => {
    refetchVisits()
    refetchBadges()
    refetchTrips()
  }, [refetchVisits, refetchBadges, refetchTrips])

  const tabs: { key: Tab; label: string; icon: ReactNode }[] = [
    { key: 'journal', label: 'Denník', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'map', label: 'Mapa', icon: <MapIcon className="w-4 h-4" /> },
    { key: 'cities', label: 'Mestá', icon: <Landmark className="w-4 h-4" /> },
    { key: 'trips', label: 'Výlety', icon: <Luggage className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Ahoj, {profile?.username} 👋</h1>
          <p className="text-slate-500 dark:text-slate-400">Tu je tvoj prehľad cestovania po EÚ.</p>
        </div>

        <div className="flex gap-1 border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-white dark:bg-slate-900 self-start overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition whitespace-nowrap ${
                tab === t.key
                  ? 'bg-accent text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnnouncementBanner />

      {tab === 'journal' && <JournalDashboard visits={visits} stats={stats} loading={loading} />}

      {tab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<TabFallback />}>
              <EuropeMap
                capitals={capitals}
                visits={visits}
                trips={trips}
                suggestedTripId={suggestedTripId}
                loading={loading}
                onDataChanged={handleDataChanged}
              />
            </Suspense>
          </div>
          <div className="space-y-6">
            <BadgeGrid allBadges={allBadges} earnedCodes={earnedCodes} />
          </div>
        </div>
      )}

      {tab === 'cities' && (
        <div className="max-w-2xl mx-auto">
          <Suspense fallback={<TabFallback />}>
            <CitiesList capitals={capitals} visits={visits} loading={loading} />
          </Suspense>
        </div>
      )}

      {tab === 'trips' && (
        <div className="max-w-2xl mx-auto">
          <Suspense fallback={<TabFallback />}>
            <TripsOverview
              trips={trips}
              visits={visits}
              loading={tripsLoading}
              onCreateTrip={createTrip}
              onUpdateTrip={updateTrip}
              onDeleteTrip={deleteTrip}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}
