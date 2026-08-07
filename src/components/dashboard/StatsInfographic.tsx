import { Plane, TrainFront, Car, Bus, Bike, Footprints, Sailboat, CircleHelp, Moon, Award } from 'lucide-react'
import type { TransportMode } from '../../types'
import type { useStats } from '../../hooks/useStats'

type Stats = ReturnType<typeof useStats>

interface Props {
  stats: Stats
  loading: boolean
}

const TRANSPORT_LABELS: Record<TransportMode, string> = {
  lietadlo: 'Lietadlom',
  vlak: 'Vlakom',
  auto: 'Autom',
  autobus: 'Autobusom',
  bicykel: 'Bicyklom',
  pešo: 'Pešo',
  loď: 'Loďou',
  iné: 'Inak',
}

const TRANSPORT_ICONS: Record<TransportMode, typeof Plane> = {
  lietadlo: Plane,
  vlak: TrainFront,
  auto: Car,
  autobus: Bus,
  bicykel: Bike,
  pešo: Footprints,
  loď: Sailboat,
  iné: CircleHelp,
}

/** Kompaktný kruhový progress ring – signature prvok infografiky. */
function HeroRing({ visited, total, percentage }: { visited: number; total: number; percentage: number }) {
  const size = 116
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percentage / 100)

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-hairline" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-ochre"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold text-ink tabular-nums leading-none">
          {visited}
          <span className="text-ink-faint text-xs font-normal">/{total}</span>
        </span>
      </div>
    </div>
  )
}

/** Malý donut graf pre mieru preskúmania jedného regiónu. */
function MiniDonut({ visited, total }: { visited: number; total: number }) {
  const size = 36
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = total > 0 ? visited / total : 0
  const offset = circumference * (1 - pct)

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-hairline" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-sage"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <span className="absolute text-[9px] font-medium text-ink tabular-nums">
        {visited}/{total}
      </span>
    </div>
  )
}

function ColumnLabel({ children }: { children: string }) {
  return <h3 className="text-[11px] font-medium uppercase tracking-wide text-ink-faint mb-3">{children}</h3>
}

export function StatsInfographic({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-paper rounded-2xl border border-hairline p-5 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-paper-dim shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-2/3 rounded-full bg-paper-dim" />
            <div className="h-2.5 w-1/2 rounded-full bg-paper-dim" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-paper rounded-2xl border border-hairline p-5 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 lg:divide-x lg:divide-hairline">
        {/* Hlavné počítadlo */}
        <div className="flex items-center gap-4 lg:pr-5">
          <HeroRing visited={stats.visitedCount} total={stats.totalCapitals} percentage={stats.percentage} />
          <p className="text-xs leading-snug text-ink-muted">hlavných miest Európy prebádaných</p>
        </div>

        {/* Moja mobilita */}
        <div className="lg:px-5">
          <ColumnLabel>Moja mobilita</ColumnLabel>
          {stats.transportBreakdown.length > 0 ? (
            <div className="space-y-2">
              {stats.transportBreakdown.map((entry) => {
                const Icon = TRANSPORT_ICONS[entry.mode]
                return (
                  <div key={entry.mode} className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-ink-muted shrink-0" strokeWidth={1.5} />
                    <span className="text-xs text-ink-muted w-16 shrink-0 truncate">{TRANSPORT_LABELS[entry.mode]}</span>
                    <div className="flex-1 h-[2px] rounded-full bg-hairline relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-sage transition-all duration-700 ease-out"
                        style={{ width: `${entry.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink tabular-nums w-8 text-right shrink-0">{entry.percentage}%</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-ink-faint italic">Zatiaľ žiadne dáta</p>
          )}
        </div>

        {/* Cestovateľské tempo */}
        <div className="lg:px-5">
          <ColumnLabel>Cestovateľské tempo</ColumnLabel>
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Moon className="w-3.5 h-3.5 text-dusk shrink-0" strokeWidth={1.5} />
              <p className="text-xs text-ink-muted">
                <span className="text-ink font-semibold tabular-nums">{stats.totalNights}</span> dní na cestách
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Award className="w-3.5 h-3.5 text-ochre shrink-0" strokeWidth={1.5} />
              {stats.longestStay ? (
                <p className="text-xs text-ink-muted">
                  Najdlhšie: <span className="text-ink font-semibold tabular-nums">{stats.longestStay.nights}</span>{' '}
                  dní · {stats.longestStay.city}
                </p>
              ) : (
                <p className="text-xs text-ink-faint italic">Zatiaľ žiadne záznamy</p>
              )}
            </div>
          </div>
        </div>

        {/* Geografický prehľad */}
        <div className="lg:pl-5">
          <ColumnLabel>Regióny</ColumnLabel>
          {stats.regionStats.length > 0 ? (
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {stats.regionStats.map((r) => (
                <div key={r.region} className="flex items-center gap-2">
                  <MiniDonut visited={r.visited} total={r.total} />
                  <span className="text-[11px] leading-tight text-ink-muted max-w-[64px]">{r.region}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-faint italic">Zatiaľ žiadne dáta</p>
          )}
        </div>
      </div>
    </div>
  )
}
