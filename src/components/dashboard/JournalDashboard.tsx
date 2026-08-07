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
 * Spája StatsInfographic (vizuálne štatistiky) a TimelineView (chronologický
 * feed spomienok) do jednej ucelenej, pokojnej sekcie s vlastným dizajnovým
 * jazykom (papierový podklad, serif typografia, tlmené farby).
 *
 * Dáta dostáva ako props z DashboardPage (jediný zdroj pravdy pre
 * visits/capitals v celej appke) – nefetchuje si nič vlastné.
 */
export function JournalDashboard({ visits, stats, loading }: Props) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center px-4">
        <p className="font-serif text-2xl text-ink">Tvoja cesta po Európe</p>
        <p className="text-sm text-ink-muted mt-1">
          Osobná kronika miest, ktoré si spoznal – bez rebríčkov, len tvoje spomienky.
        </p>
      </div>

      <StatsInfographic stats={stats} loading={loading} />
      <TimelineView visits={visits} loading={loading} />
    </div>
  )
}
