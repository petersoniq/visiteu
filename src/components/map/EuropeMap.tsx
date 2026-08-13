import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import { useMemo, useState } from 'react'
import { CapitalMarker } from './CapitalMarker'
import type { EuCapital, Trip, Visit } from '../../types'
import { VisitDetailModal } from '../visits/VisitDetailModal'
import { useTheme } from '../../contexts/ThemeContext'

const EUROPE_CENTER: [number, number] = [50.5, 14.5]
const DEFAULT_ZOOM = 4

const LIGHT_TILES = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> prispievatelia',
}
const DARK_TILES = {
  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> prispievatelia &copy; <a href="https://carto.com/attributions">CARTO</a>',
}

const ALL_ROUTE = 'all'
const NO_ROUTE = 'none'

interface Props {
  capitals: EuCapital[]
  visits: Visit[]
  trips: Trip[]
  /** ID výletu, do ktorého bola naposledy pridaná návšteva - ponúkne sa ako skratka v modáli */
  suggestedTripId?: string | null
  loading: boolean
  /** Zavolá sa po uložení/zmazaní návštevy alebo výletu – rodič si obnoví svoje dáta */
  onDataChanged: () => void
}

export function EuropeMap({ capitals, visits, trips, suggestedTripId, loading, onDataChanged }: Props) {
  const [selectedCapital, setSelectedCapital] = useState<EuCapital | null>(null)
  const [routeSelection, setRouteSelection] = useState<string>(NO_ROUTE)
  const { theme } = useTheme()
  const tiles = theme === 'dark' ? DARK_TILES : LIGHT_TILES

  const visitsByCapital = useMemo(() => {
    const map = new Map<number, Visit[]>()
    for (const visit of visits) {
      const existing = map.get(visit.capital_id) ?? []
      existing.push(visit)
      map.set(visit.capital_id, existing)
    }
    for (const [, list] of map) {
      list.sort((a, b) => b.visit_date.localeCompare(a.visit_date))
    }
    return map
  }, [visits])

  // Trasy, ktoré má zmysel ponúknuť vo výbere - "všetky návštevy" (ak ich je aspoň 2)
  // a každý výlet, ktorý má aspoň 2 priradené mestá.
  const tripsWithEnoughStops = useMemo(() => {
    const countByTrip = new Map<string, number>()
    for (const v of visits) {
      if (!v.trip_id) continue
      countByTrip.set(v.trip_id, (countByTrip.get(v.trip_id) ?? 0) + 1)
    }
    return trips.filter((t) => (countByTrip.get(t.id) ?? 0) >= 2)
  }, [trips, visits])

  const routePositions = useMemo<[number, number][]>(() => {
    if (routeSelection === NO_ROUTE) return []

    const relevant = routeSelection === ALL_ROUTE ? visits : visits.filter((v) => v.trip_id === routeSelection)

    const sorted = [...relevant].sort((a, b) => a.visit_date.localeCompare(b.visit_date))
    const capitalById = new Map(capitals.map((c) => [c.id, c]))

    const positions: [number, number][] = []
    for (const v of sorted) {
      const capital = capitalById.get(v.capital_id)
      if (capital) positions.push([capital.latitude, capital.longitude])
    }
    return positions
  }, [routeSelection, visits, capitals])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-slate-50 dark:bg-slate-900 rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    )
  }

  const showRouteControl = visits.length >= 2

  return (
    <div className="relative">
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <MapContainer
          center={EUROPE_CENTER}
          zoom={DEFAULT_ZOOM}
          minZoom={3}
          maxZoom={10}
          style={{ height: '600px', width: '100%' }}
        >
          {/* key vynúti remount pri zmene témy, aby sa dlaždice korektne prekreslili */}
          <TileLayer key={theme} attribution={tiles.attribution} url={tiles.url} />
          {capitals.map((capital) => (
            <CapitalMarker
              key={capital.id}
              capital={capital}
              visits={visitsByCapital.get(capital.id) ?? []}
              onOpenDetail={setSelectedCapital}
            />
          ))}
          {routePositions.length > 1 && (
            <Polyline
              positions={routePositions}
              pathOptions={{ color: 'var(--color-accent)', weight: 3, opacity: 0.75, dashArray: '2 10' }}
            />
          )}
        </MapContainer>
      </div>

      {showRouteControl && (
        <div className="absolute top-3 right-3 z-[1000]">
          <select
            value={routeSelection}
            onChange={(e) => setRouteSelection(e.target.value)}
            className="text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 shadow-md focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value={NO_ROUTE}>Bez trasy</option>
            <option value={ALL_ROUTE}>Trasa: všetky návštevy</option>
            {tripsWithEnoughStops.map((t) => (
              <option key={t.id} value={t.id}>
                Trasa: {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-lg shadow-md px-3 py-2 text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-accent inline-block" />
          <span className="text-slate-700 dark:text-slate-300">Navštívené</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
          <span className="text-slate-700 dark:text-slate-300">Nenavštívené</span>
        </div>
      </div>

      {selectedCapital && (
        <VisitDetailModal
          capital={selectedCapital}
          existingVisits={visitsByCapital.get(selectedCapital.id) ?? []}
          trips={trips}
          suggestedTripId={suggestedTripId}
          onClose={() => setSelectedCapital(null)}
          onSaved={() => {
            onDataChanged()
            setSelectedCapital(null)
          }}
          onDataChanged={onDataChanged}
        />
      )}
    </div>
  )
}
