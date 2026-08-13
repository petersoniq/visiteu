import { StatsInfographic } from './StatsInfographic'
import { TimelineView } from './TimelineView'
import { MemoryBanner } from './MemoryBanner'
import { useMemoryOfTheDay } from '../../hooks/useMemoryOfTheDay'
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
 * (chronologický feed spomienok) do JEDNÉHO spoločného panela (jednotné
 * pozadie, jeden rám). Vizuálny jazyk je zámerne rovnaký ako ostatné karty
 * v appke (biely povrch, jemný tieň, slate hairline) namiesto pôvodného
 * sépiového "papiera", ktorý pôsobil cudzo voči zvyšku appky.
 *
 * Nad panelom je MemoryBanner ("presne pred rokom si bol v...") - má
 * zámerne odlišný, accent-tónovaný štýl, aby pôsobil ako osobitý
 * kontextový výstrih, nie súčasť samotného denníka.
 *
 * Timeline sekcia má jemne odlíšený tonálny podklad (--color-paper-dim)
 * namiesto ostrej deliacej čiary - Material-štýl "vrstvenia" farbou, nie
 * hrubým orámovaním.
 *
 * Farby sú CSS premenné (--color-paper, --color-ink...) definované
 * v index.css a automaticky sa prefarbia v tmavom režime.
 *
 * Dáta dostáva ako props z DashboardPage (jediný zdroj pravdy pre
 * visits/capitals v celej appke) – nefetchuje si nič vlastné.
 */
export function JournalDashboard({ visits, stats, loading }: Props) {
  const memories = useMemoryOfTheDay(visits)

  return (
    <div>
      <MemoryBanner memories={memories} />

      <div className="bg-paper rounded-3xl border border-hairline shadow-sm overflow-hidden">
        <div className="text-center px-4 pt-8 pb-1">
          <p className="text-xl font-semibold text-ink">Tvoja cesta po Európe</p>
          <p className="text-sm text-ink-muted mt-1">
            Osobná kronika miest, ktoré si spoznal – bez rebríčkov, len tvoje spomienky.
          </p>
        </div>

        <StatsInfographic stats={stats} loading={loading} />

        <div className="bg-paper-dim">
          <div className="max-w-3xl mx-auto">
            <TimelineView visits={visits} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  )
}
