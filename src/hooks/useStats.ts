import { useMemo } from 'react'
import type { EuCapital, Visit } from '../types'

export interface RegionStats {
  region: string
  total: number
  visited: number
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

    const transportCounts = new Map<string, number>()
    for (const v of visits) {
      transportCounts.set(v.transport_mode, (transportCounts.get(v.transport_mode) ?? 0) + 1)
    }
    const favoriteTransport = [...transportCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    const totalNights = visits.reduce((sum, v) => sum + v.duration_nights, 0)

    return {
      totalCapitals,
      visitedCount,
      percentage,
      regionStats: [...regionMap.values()].sort((a, b) => b.visited / b.total - a.visited / a.total),
      favoriteTransport,
      totalNights,
      totalVisits: visits.length,
    }
  }, [capitals, visits])
}
