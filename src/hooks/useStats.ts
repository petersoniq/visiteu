import { useMemo } from 'react'
import type { EuCapital, TransportMode, Visit } from '../types'

export interface RegionStats {
  region: string
  total: number
  visited: number
}

export interface TransportBreakdownEntry {
  mode: TransportMode
  count: number
  percentage: number
}

export interface LongestStay {
  city: string
  country: string
  nights: number
}

export interface MostActiveYear {
  year: number
  cityCount: number
}

export function useStats(capitals: EuCapital[], visits: Visit[]) {
  return useMemo(() => {
    const visitedIds = new Set(visits.map((v) => v.capital_id))
    const totalCapitals = capitals.length
    const visitedCount = visitedIds.size
    const percentage = totalCapitals > 0 ? Math.round((visitedCount / totalCapitals) * 100) : 0

    const regionMap = new Map<string, RegionStats>()
    for (const capital of capitals) {
      const region = capital.region ?? 'Iné'
      const existing = regionMap.get(region) ?? { region, total: 0, visited: 0 }
      existing.total += 1
      if (visitedIds.has(capital.id)) existing.visited += 1
      regionMap.set(region, existing)
    }

    const transportCounts = new Map<TransportMode, number>()
    for (const v of visits) {
      transportCounts.set(v.transport_mode, (transportCounts.get(v.transport_mode) ?? 0) + 1)
    }
    const favoriteTransport = [...transportCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    const transportBreakdown: TransportBreakdownEntry[] = [...transportCounts.entries()]
      .map(([mode, count]) => ({
        mode,
        count,
        percentage: visits.length > 0 ? Math.round((count / visits.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    const totalNights = visits.reduce((sum, v) => sum + v.duration_nights, 0)

    const capitalById = new Map(capitals.map((c) => [c.id, c]))
    let longestStay: LongestStay | null = null
    for (const v of visits) {
      if (!longestStay || v.duration_nights > longestStay.nights) {
        const capital = capitalById.get(v.capital_id)
        if (capital) {
          longestStay = { city: capital.city, country: capital.country, nights: v.duration_nights }
        }
      }
    }

    // Rok, v ktorom si spoznal najviac NOVÝCH miest (nie len počet zápisov v denníku)
    const citiesByYear = new Map<number, Set<number>>()
    for (const v of visits) {
      const year = new Date(v.visit_date).getFullYear()
      const set = citiesByYear.get(year) ?? new Set<number>()
      set.add(v.capital_id)
      citiesByYear.set(year, set)
    }
    let mostActiveYear: MostActiveYear | null = null
    for (const [year, cities] of citiesByYear) {
      if (!mostActiveYear || cities.size > mostActiveYear.cityCount) {
        mostActiveYear = { year, cityCount: cities.size }
      }
    }

    return {
      totalCapitals,
      visitedCount,
      percentage,
      regionStats: [...regionMap.values()].sort((a, b) => b.visited / b.total - a.visited / a.total),
      favoriteTransport,
      transportBreakdown,
      totalNights,
      totalVisits: visits.length,
      longestStay,
      mostActiveYear,
    }
  }, [capitals, visits])
}
