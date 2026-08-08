import { useMemo, useState } from 'react'
import { format, addDays, parseISO } from 'date-fns'
import { sk } from 'date-fns/locale'
import { Plane, TrainFront, Car, Bus, Bike, Footprints, Sailboat, CircleHelp } from 'lucide-react'
import type { TransportMode, VisitWithDetails } from '../../types'

interface Props {
  visits: VisitWithDetails[]
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

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatVisitDate(visit: VisitWithDetails): string {
  const start = parseISO(visit.visit_date)
  if (visit.duration_nights > 0) {
    const end = addDays(start, visit.duration_nights)
    return `${format(start, 'd. M.')} – ${format(end, 'd. M. yyyy')}`
  }
  return capitalize(format(start, 'LLLL yyyy', { locale: sk }))
}

export function TimelineView({ visits, loading }: Props) {
  const years = useMemo(() => {
    const set = new Set(visits.map((v) => new Date(v.visit_date).getFullYear()))
    return [...set].sort((a, b) => b - a)
  }, [visits])

  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')

  const filteredVisits = useMemo(() => {
    if (selectedYear === 'all') return visits
    return visits.filter((v) => new Date(v.visit_date).getFullYear() === selectedYear)
  }, [visits, selectedYear])

  if (loading) {
    return (
      <div className="p-6 sm:p-12 animate-pulse space-y-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-paper-dim" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-12">
      <div className="flex items-center justify-between mb-10">
        <h3 className="text-base font-semibold text-ink">Cestovný denník</h3>

        {years.length > 0 && (
          <div className="flex items-center gap-5 overflow-x-auto">
            <button
              onClick={() => setSelectedYear('all')}
              className={`text-sm pb-1 border-b whitespace-nowrap transition-colors ${
                selectedYear === 'all'
                  ? 'text-ink border-ochre font-medium'
                  : 'text-ink-faint border-transparent hover:text-ink-muted'
              }`}
            >
              Všetky
            </button>
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`text-sm pb-1 border-b whitespace-nowrap transition-colors ${
                  selectedYear === year
                    ? 'text-ink border-ochre font-medium'
                    : 'text-ink-faint border-transparent hover:text-ink-muted'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredVisits.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-ink-muted">Zatiaľ žiadne spomienky</p>
          <p className="text-sm text-ink-faint mt-2">
            Prvá zaznamenaná návšteva sa tu objaví ako prvá zastávka na tvojej ceste.
          </p>
        </div>
      ) : (
        <ol className="relative">
          {/* Centrálna os: v strede na desktope, vľavo na mobile */}
          <div className="absolute left-4 md:left-1/2 top-2 bottom-2 w-px bg-hairline md:-translate-x-1/2" />

          {filteredVisits.map((visit, index) => {
            const Icon = TRANSPORT_ICONS[visit.transport_mode]
            const onRight = index % 2 === 0

            return (
              <li key={visit.id} className="relative mb-10 last:mb-0">
                {/* Bod na osi s ikonkou dopravy */}
                <div className="absolute left-4 md:left-1/2 top-0 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-paper border border-ochre flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-ochre" strokeWidth={1.5} />
                </div>

                {/* Kartička - na mobile vždy vpravo od osi, na desktope strieda strany */}
                <div className={`pl-16 md:pl-0 md:w-1/2 ${onRight ? 'md:ml-auto md:pl-12' : 'md:pr-12'}`}>
                  <article className="group bg-paper-dim rounded-lg border border-hairline p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md">
                    {visit.coverPhotoUrl && (
                      <div className="rounded-lg overflow-hidden mb-4 aspect-[4/3] bg-hairline">
                        <img
                          src={visit.coverPhotoUrl}
                          alt={visit.capital.city}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <h4 className="text-lg font-semibold text-ink leading-tight">{visit.capital.city}</h4>
                    <p className="text-xs uppercase tracking-wide text-ink-faint mt-1">{visit.capital.country}</p>
                    <p className="text-sm text-ink-muted mt-3">{formatVisitDate(visit)}</p>

                    {visit.notes && (
                      <p className="text-sm text-ink-muted mt-3 leading-relaxed line-clamp-3">{visit.notes}</p>
                    )}
                  </article>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
