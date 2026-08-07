import { StatsInfographic } from './StatsInfographic'
import { TimelineView } from './TimelineView'
import type { useStats } from '../../hooks/useStats'
import type { VisitWithDetails } from '../../types'

interface Props {
  visits: VisitWithDetails[]
  stats: ReturnType<typeof useStats>
  loading: boolean
}

/**
 * "Cestovný denník" – osobná, nesúťaživá kronika ciest.
 * Spája StatsInfographic (kompaktné vizuálne štatistiky) a TimelineView
 * (chronologický feed spomienok) do jednej pokojnej sekcie s vlastným
 * jazykom (papierový podklad, tlmené farby), ale rovnakým písmom ako
 * zvyšok appky.
 *
 * Dáta dostáva ako props z DashboardPage (jediný zdroj pravdy pre
 * visits/capitals v celej appke) – nefetchuje si nič vlastné.
 */
export function JournalDashboard({ visits, stats, loading }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center px-4">
        <p className="text-xl font-semibold text-ink">Tvoja cesta po Európe</p>
        <p className="text-sm text-ink-muted mt-1">
          Osobná kronika miest, ktoré si spoznal – bez rebríčkov, len tvoje spomienky.
        </p>
      </div>

      <StatsInfographic stats={stats} loading={loading} />

      <div className="max-w-3xl mx-auto">
        <TimelineView visits={visits} loading={loading} />
      </div>
    </div>
  )
}
