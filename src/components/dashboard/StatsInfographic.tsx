import type { ReactNode } from 'react'
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

/** Hlavný kruhový "pasový" progress ring – signature prvok infografiky. */
function HeroRing({ visited, total, percentage }: { visited: number; total: number; percentage: number }) {
  const size = 224
  const strokeWidth = 2.5
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
        <span className="font-serif text-5xl text-ink tabular-nums leading-none">
          {visited}
          <span className="text-ink-faint text-2xl">/{total}</span>
        </span>
      </div>
    </div>
  )
}

/** Malý donut graf pre mieru preskúmania jedného regiónu. */
function MiniDonut({ visited, total }: { visited: number; total: number }) {
  const size = 60
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = total > 0 ? visited / total : 0
  const offset = circumference * (1 - pct)

  return (
    <div className="relative inline-flex items-center justify-center">
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
      <span className="absolute font-serif text-xs text-ink tabular-nums">
        {visited}/{total}
      </span>
    </div>
  )
}

/** Sekcia s hairline oddeľovačom hore (okrem prvej) – nahrádza karty s tieňmi. */
function Section({ children, first = false }: { children: ReactNode; first?: boolean }) {
  return <div className={first ? 'pt-0' : 'pt-10 mt-10 border-t border-hairline'}>{children}</div>
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <h3 className="font-serif text-lg text-ink mb-6">{children}</h3>
}

export function StatsInfographic({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-paper rounded-3xl border border-hairline p-8 sm:p-12 animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="w-56 h-56 rounded-full bg-paper-dim" />
          <div className="h-3 w-48 rounded-full bg-paper-dim" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-paper rounded-3xl border border-hairline p-8 sm:p-12">
      {/* Hero: hlavné počítadlo */}
      <Section first>
        <div className="flex flex-col items-center text-center">
          <HeroRing visited={stats.visitedCount} total={stats.totalCapitals} percentage={stats.percentage} />
          <p className="mt-6 text-sm tracking-wide uppercase text-ink-muted font-light">
            hlavných miest Európy prebádaných
          </p>
        </div>
      </Section>

      {/* Moja mobilita */}
      {stats.transportBreakdown.length > 0 && (
        <Section>
          <SectionLabel>Moja mobilita</SectionLabel>
          <div className="space-y-5 max-w-md mx-auto">
            {stats.transportBreakdown.map((entry) => {
              const Icon = TRANSPORT_ICONS[entry.mode]
              return (
                <div key={entry.mode} className="flex items-center gap-4">
                  <Icon className="w-4 h-4 text-ink-muted shrink-0" strokeWidth={1.5} />
                  <span className="text-sm text-ink-muted w-24 shrink-0">{TRANSPORT_LABELS[entry.mode]}</span>
                  <div className="flex-1 h-[2px] rounded-full bg-hairline relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-sage transition-all duration-700 ease-out"
                      style={{ width: `${entry.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-serif text-ink tabular-nums w-10 text-right">{entry.percentage}%</span>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Cestovateľské tempo */}
      <Section>
        <SectionLabel>Cestovateľské tempo</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <Moon className="w-4 h-4 text-dusk mt-1.5 shrink-0" strokeWidth={1.5} />
            <div>
              <p className="font-serif text-3xl text-ink tabular-nums leading-none">{stats.totalNights}</p>
              <p className="text-xs uppercase tracking-wide text-ink-faint mt-2">celkovo dní na cestách</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Award className="w-4 h-4 text-ochre mt-1.5 shrink-0" strokeWidth={1.5} />
            <div>
              {stats.longestStay ? (
                <>
                  <p className="font-serif text-3xl text-ink tabular-nums leading-none">{stats.longestStay.nights}</p>
                  <p className="text-xs uppercase tracking-wide text-ink-faint mt-2">
                    najdlhší pobyt · {stats.longestStay.city}
                  </p>
                </>
              ) : (
                <p className="text-sm text-ink-faint italic">Zatiaľ žiadne záznamy</p>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Geografický prehľad */}
      {stats.regionStats.length > 0 && (
        <Section>
          <SectionLabel>Geografický prehľad</SectionLabel>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-6">
            {stats.regionStats.map((r) => (
              <div key={r.region} className="flex flex-col items-center text-center gap-2">
                <MiniDonut visited={r.visited} total={r.total} />
                <span className="text-[11px] leading-tight text-ink-muted">{r.region}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
