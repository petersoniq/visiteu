interface Props {
  totalNights: number
  totalVisits: number
  favoriteTransport: string | null
}

const TRANSPORT_LABELS: Record<string, string> = {
  lietadlo: '✈️ Lietadlom',
  vlak: '🚆 Vlakom',
  auto: '🚗 Autom',
  autobus: '🚌 Autobusom',
  bicykel: '🚲 Bicyklom',
  pešo: '🚶 Pešo',
  loď: '⛴️ Loďou',
  iné: '❓ Iným spôsobom',
}

export function QuickStats({ totalNights, totalVisits, favoriteTransport }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
        <p className="text-2xl font-bold text-slate-900">{totalVisits}</p>
        <p className="text-xs text-slate-500 mt-1">Zaznamenaných ciest</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
        <p className="text-2xl font-bold text-slate-900">{totalNights}</p>
        <p className="text-xs text-slate-500 mt-1">Nocí na cestách</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-900">
          {favoriteTransport ? TRANSPORT_LABELS[favoriteTransport] : '—'}
        </p>
        <p className="text-xs text-slate-500 mt-1">Najčastejšia doprava</p>
      </div>
    </div>
  )
}
