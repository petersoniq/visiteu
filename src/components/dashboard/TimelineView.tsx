import { useMemo, useState } from 'react'
import { format, addDays, parseISO } from 'date-fns'
import { sk } from 'date-fns/locale'
import { Plane, TrainFront, Car, Bus, Bike, Footprints, Sailboat, CircleHelp, Luggage, Images, Users, Search } from 'lucide-react'
import { PhotoLightbox } from '../visits/PhotoLightbox'
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
  const [selectedTransport, setSelectedTransport] = useState<TransportMode | 'all'>('all')
  const [search, setSearch] = useState('')
  const [galleryVisit, setGalleryVisit] = useState<VisitWithDetails | null>(null)

  const filteredVisits = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('sk')
    return visits.filter((v) => {
      if (selectedYear !== 'all' && new Date(v.visit_date).getFullYear() !== selectedYear) return false
      if (selectedTransport !== 'all' && v.transport_mode !== selectedTransport) return false
      if (!query) return true
      return (
        v.capital.city.toLocaleLowerCase('sk').includes(query) ||
        v.capital.country.toLocaleLowerCase('sk').includes(query) ||
        (v.notes ?? '').toLocaleLowerCase('sk').includes(query)
      )
    })
  }, [visits, selectedYear, selectedTransport, search])

  const usedTransportModes = useMemo(() => {
    const set = new Set(visits.map((v) => v.transport_mode))
    return (Object.keys(TRANSPORT_ICONS) as TransportMode[]).filter((mode) => set.has(mode))
  }, [visits])

  if (loading) {
    return (
      <div className="p-6 sm:p-12 animate-pulse space-y-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-paper shadow-sm" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-12">
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-ink shrink-0">Cestovný denník</h3>

          {years.length > 0 && (
            <div className="flex items-center gap-5 overflow-x-auto">
              <button
                onClick={() => setSelectedYear('all')}
                className={`text-sm pb-1 border-b whitespace-nowrap transition-colors ${
                  selectedYear === 'all'
                    ? 'text-ink border-accent font-medium'
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
                      ? 'text-ink border-accent font-medium'
                      : 'text-ink-faint border-transparent hover:text-ink-muted'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>

        {visits.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink-faint absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Hľadať mesto, krajinu alebo poznámku..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-paper text-ink pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            {usedTransportModes.length > 1 && (
              <select
                value={selectedTransport}
                onChange={(e) => setSelectedTransport(e.target.value as TransportMode | 'all')}
                className="rounded-lg border border-hairline bg-paper text-ink px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent shrink-0"
              >
                <option value="all">Všetka doprava</option>
                {usedTransportModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {filteredVisits.length === 0 ? (
        <div className="text-center py-16">
          {visits.length === 0 ? (
            <>
              <p className="text-lg font-medium text-ink-muted">Zatiaľ žiadne spomienky</p>
              <p className="text-sm text-ink-faint mt-2">
                Prvá zaznamenaná návšteva sa tu objaví ako prvá zastávka na tvojej ceste.
              </p>
            </>
          ) : (
            <p className="text-lg font-medium text-ink-muted">Žiadna návšteva nezodpovedá hľadaniu.</p>
          )}
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
                <div className="absolute left-4 md:left-1/2 top-0 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-paper-dim border-2 border-accent flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-accent-text" strokeWidth={1.5} />
                </div>

                {/* Kartička - na mobile vždy vpravo od osi, na desktope strieda strany */}
                <div className={`pl-16 md:pl-0 md:w-1/2 ${onRight ? 'md:ml-auto md:pl-12' : 'md:pr-12'}`}>
                  <article className="group bg-paper rounded-2xl p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg">
                    {visit.coverPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setGalleryVisit(visit)}
                        className="relative block w-full rounded-lg overflow-hidden mb-4 aspect-[4/3] bg-hairline"
                      >
                        <img
                          src={visit.coverPhotoUrl}
                          alt={visit.capital.city}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {visit.photoCount > 1 && (
                          <span className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                            <Images className="w-3 h-3" /> {visit.photoCount}
                          </span>
                        )}
                      </button>
                    )}

                    <h4 className="text-lg font-semibold text-ink leading-tight">{visit.capital.city}</h4>
                    <p className="text-xs uppercase tracking-wide text-ink-faint mt-1">{visit.capital.country}</p>
                    <p className="text-sm text-ink-muted mt-3">{formatVisitDate(visit)}</p>

                    {visit.trip && (
                      <p className="text-xs text-accent-text mt-1.5 flex items-center gap-1">
                        <Luggage className="w-3 h-3" /> {visit.trip.name}
                      </p>
                    )}

                    {visit.companions.length > 0 && (
                      <p className="text-xs text-ink-faint mt-1.5 flex items-center gap-1">
                        <Users className="w-3 h-3 shrink-0" />
                        <span className="truncate">{visit.companions.map((c) => c.name).join(', ')}</span>
                      </p>
                    )}

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

      {galleryVisit && (
        <PhotoLightbox
          visitId={galleryVisit.id}
          title={galleryVisit.capital.city}
          subtitle={formatVisitDate(galleryVisit)}
          onClose={() => setGalleryVisit(null)}
        />
      )}
    </div>
  )
}
