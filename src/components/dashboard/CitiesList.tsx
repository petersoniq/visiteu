import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Plane, TrainFront, Car, Bus, Bike, Footprints, Sailboat, CircleHelp, Search } from 'lucide-react'
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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'visited' | 'unvisited'>('all')

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

  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('sk')
    return rows.filter((row) => {
      if (statusFilter === 'visited' && !row.lastVisit) return false
      if (statusFilter === 'unvisited' && row.lastVisit) return false
      if (!query) return true
      return (
        row.capital.city.toLocaleLowerCase('sk').includes(query) ||
        row.capital.country.toLocaleLowerCase('sk').includes(query)
      )
    })
  }, [rows, search, statusFilter])

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

      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Hľadať mesto alebo krajinu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex gap-1 shrink-0 overflow-x-auto">
          {(
            [
              ['all', 'Všetky'],
              ['visited', 'Navštívené'],
              ['unvisited', 'Nenavštívené'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
                statusFilter === key
                  ? 'bg-accent text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {filteredRows.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Žiadne mesto nezodpovedá hľadaniu.
          </p>
        )}
        {filteredRows.map(({ capital, visitCount, lastVisit }) => {
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
