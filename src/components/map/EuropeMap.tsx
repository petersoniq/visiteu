import { MapContainer, TileLayer } from 'react-leaflet'
import { useMemo, useState } from 'react'
import { CapitalMarker } from './CapitalMarker'
import type { EuCapital, Visit } from '../../types'
import { VisitDetailModal } from '../visits/VisitDetailModal'

const EUROPE_CENTER: [number, number] = [50.5, 14.5]
const DEFAULT_ZOOM = 4

interface Props {
  capitals: EuCapital[]
  visits: Visit[]
  loading: boolean
  /** Zavolá sa po uložení/zmazaní návštevy – rodič si obnoví svoje dáta (návštevy, odznaky...) */
  onDataChanged: () => void
}

export function EuropeMap({ capitals, visits, loading, onDataChanged }: Props) {
  const [selectedCapital, setSelectedCapital] = useState<EuCapital | null>(null)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-slate-50 rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <MapContainer
          center={EUROPE_CENTER}
          zoom={DEFAULT_ZOOM}
          minZoom={3}
          maxZoom={10}
          style={{ height: '600px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> prispievatelia'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {capitals.map((capital) => (
            <CapitalMarker
              key={capital.id}
              capital={capital}
              visits={visitsByCapital.get(capital.id) ?? []}
              onOpenDetail={setSelectedCapital}
            />
          ))}
        </MapContainer>
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur rounded-lg shadow-md px-3 py-2 text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
          <span className="text-slate-700">Navštívené</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
          <span className="text-slate-700">Nenavštívené</span>
        </div>
      </div>

      {selectedCapital && (
        <VisitDetailModal
          capital={selectedCapital}
          existingVisits={visitsByCapital.get(selectedCapital.id) ?? []}
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
