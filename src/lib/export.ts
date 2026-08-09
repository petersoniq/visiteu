import { supabase } from './supabaseClient'
import { getPhotoPublicUrl } from './storage'

interface RawVisitRow {
  visit_date: string
  transport_mode: string
  duration_nights: number
  notes: string | null
  rating: number | null
  eu_capitals: { city: string; country: string; region: string | null } | null
  visit_photos: { storage_path: string }[] | null
  trips: { name: string } | null
}

interface RawTripRow {
  name: string
  description: string | null
  created_at: string
}

export interface ExportVisit {
  city: string
  country: string
  region: string | null
  visitDate: string
  transportMode: string
  durationNights: number
  rating: number | null
  trip: string | null
  notes: string | null
  photos: string[]
}

export interface ExportTrip {
  name: string
  description: string | null
  createdAt: string
}

export interface ExportPayload {
  exportedAt: string
  username: string
  fullName: string | null
  totalVisits: number
  totalTrips: number
  visits: ExportVisit[]
  trips: ExportTrip[]
}

/**
 * Natiahne KOMPLETNÉ dáta priamo zo Supabase (nie z lokálneho stavu appky),
 * aby záloha vždy obsahovala aktuálne dáta bez ohľadu na to, čo je práve
 * načítané na obrazovke.
 */
export async function fetchExportPayload(
  userId: string,
  username: string,
  fullName: string | null
): Promise<ExportPayload> {
  const [visitsRes, tripsRes] = await Promise.all([
    supabase
      .from('visits')
      .select('visit_date, transport_mode, duration_nights, notes, rating, eu_capitals(city,country,region), visit_photos(storage_path), trips(name)')
      .eq('user_id', userId)
      .order('visit_date', { ascending: true }),
    supabase.from('trips').select('name, description, created_at').eq('user_id', userId).order('created_at', { ascending: true }),
  ])

  if (visitsRes.error) throw new Error(visitsRes.error.message)
  if (tripsRes.error) throw new Error(tripsRes.error.message)

  const rawVisits = (visitsRes.data ?? []) as unknown as RawVisitRow[]
  const rawTrips = (tripsRes.data ?? []) as unknown as RawTripRow[]

  const visits: ExportVisit[] = rawVisits.map((row) => ({
    city: row.eu_capitals?.city ?? '',
    country: row.eu_capitals?.country ?? '',
    region: row.eu_capitals?.region ?? null,
    visitDate: row.visit_date,
    transportMode: row.transport_mode,
    durationNights: row.duration_nights,
    rating: row.rating,
    trip: row.trips?.name ?? null,
    notes: row.notes,
    photos: (row.visit_photos ?? []).map((p) => getPhotoPublicUrl(p.storage_path)),
  }))

  const trips: ExportTrip[] = rawTrips.map((t) => ({
    name: t.name,
    description: t.description,
    createdAt: t.created_at,
  }))

  return {
    exportedAt: new Date().toISOString(),
    username,
    fullName,
    totalVisits: visits.length,
    totalTrips: trips.length,
    visits,
    trips,
  }
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Stiahne kompletnú, štruktúrovanú JSON zálohu - najspoľahlivejší formát pre archiváciu. */
export function downloadJSON(payload: ExportPayload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  triggerDownload(blob, `visiteu-zaloha-${dateStamp()}.json`)
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Stiahne návštevy ako CSV (tabuľkový formát pre Excel/Google Sheets). */
export function downloadCSV(payload: ExportPayload) {
  const headers = [
    'Mesto',
    'Krajina',
    'Región',
    'Dátum návštevy',
    'Doprava',
    'Počet nocí',
    'Hodnotenie',
    'Výlet',
    'Poznámky',
    'Fotky (odkazy)',
  ]

  const rows = payload.visits.map((v) => [
    v.city,
    v.country,
    v.region ?? '',
    v.visitDate,
    v.transportMode,
    String(v.durationNights),
    v.rating ? String(v.rating) : '',
    v.trip ?? '',
    v.notes ?? '',
    v.photos.join(' | '),
  ])

  const csvContent = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
  // BOM na začiatku, aby Excel správne zobrazil diakritiku
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
  triggerDownload(blob, `visiteu-navstevy-${dateStamp()}.csv`)
}
