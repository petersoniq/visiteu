import { useMemo } from 'react'
import { format } from 'date-fns'
import { Plane, TrainFront, Car, Bus, Bike, Footprints, Sailboat, CircleHelp } from 'lucide-react'
import type { EuCapital, TransportMode, Visit } from '../../types'

interface Props {
  capitals: EuCapital[]
  visits: Visit[]
  loading: boolean
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

interface CityRow {
  capital: EuCapital
  visitCount: number
  lastVisit: Visit | null
}

export function CitiesList({ capitals, visits, loading }: Props) {
  const rows = useMemo<CityRow[]>(() => {
    const visitsByCapital = new Map<number, Visit[]>()
    for (const v of visits) {
      const list = visitsByCapital.get(v.capital_id) ?? []
      list.push(v)
      visitsByCapital.set(v.capital_id, list)
    }

    return [...capitals]
      .sort((a, b) => a.city.localeCompare(b.city, 'sk'))
      .map((capital) => {
        const capitalVisits = (visitsByCapital.get(capital.id) ?? []).sort((a, b) =>
          b.visit_date.localeCompare(a.visit_date)
        )
        return {
          capital,
          visitCount: capitalVisits.length,
          lastVisit: capitalVisits[0] ?? null,
        }
      })
  }, [capitals, visits])

  const visitedCount = rows.filter((r) => r.lastVisit).length

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 animate-pulse space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Hlavné mestá EÚ</h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {visitedCount} / {rows.length} navštívených
        </span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map(({ capital, visitCount, lastVisit }) => {
          const Icon = lastVisit ? TRANSPORT_ICONS[lastVisit.transport_mode] : null
          return (
            <div key={capital.id} className="flex items-center gap-4 px-4 py-3">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  lastVisit ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-hidden
              />

              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{capital.city}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{capital.country}</p>
              </div>

              <div className="text-right shrink-0">
                {lastVisit ? (
                  <>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {format(new Date(lastVisit.visit_date), 'd. M. yyyy')}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                      {Icon && <Icon className="w-3 h-3" strokeWidth={1.5} />}
                      {visitCount > 1 ? `${visitCount}× navštívené` : `${lastVisit.duration_nights} nocí`}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">Zatiaľ nenavštívené</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
