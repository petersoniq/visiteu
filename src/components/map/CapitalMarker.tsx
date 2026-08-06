import { Marker, Popup } from 'react-leaflet'
import type { EuCapital, Visit } from '../../types'
import { visitedIcon, unvisitedIcon } from './mapIcons'
import { format } from 'date-fns'

interface Props {
  capital: EuCapital
  visits: Visit[]
  onOpenDetail: (capital: EuCapital) => void
}

const TRANSPORT_LABELS: Record<string, string> = {
  lietadlo: '✈️ Lietadlo',
  vlak: '🚆 Vlak',
  auto: '🚗 Auto',
  autobus: '🚌 Autobus',
  bicykel: '🚲 Bicykel',
  pešo: '🚶 Pešo',
  loď: '⛴️ Loď',
  iné: '❓ Iné',
}

export function CapitalMarker({ capital, visits, onOpenDetail }: Props) {
  const isVisited = visits.length > 0
  const latestVisit = visits[0]

  return (
    <Marker
      position={[capital.latitude, capital.longitude]}
      icon={isVisited ? visitedIcon : unvisitedIcon}
    >
      <Popup>
        <div className="min-w-[180px]">
          <h3 className="font-bold text-slate-900">{capital.city}</h3>
          <p className="text-xs text-slate-500 mb-2">{capital.country}</p>

          {isVisited ? (
            <>
              <p className="text-sm text-emerald-700 font-medium mb-1">
                ✓ Navštívené {visits.length > 1 ? `(${visits.length}×)` : ''}
              </p>
              <p className="text-xs text-slate-600">
                Posledná návšteva: {format(new Date(latestVisit.visit_date), 'd. MMMM yyyy')}
              </p>
              <p className="text-xs text-slate-600">
                {TRANSPORT_LABELS[latestVisit.transport_mode]} · {latestVisit.duration_nights} nocí
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Zatiaľ nenavštívené</p>
          )}

          <button
            onClick={() => onOpenDetail(capital)}
            className="mt-2 w-full text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md px-2 py-1.5 transition"
          >
            {isVisited ? 'Zobraziť detail / pridať ďalšiu' : 'Zaznamenať návštevu'}
          </button>
        </div>
      </Popup>
    </Marker>
  )
}
