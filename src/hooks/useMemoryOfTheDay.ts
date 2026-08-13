import { useMemo } from 'react'
import type { VisitWithDetails } from '../types'

export interface Memory {
  visit: VisitWithDetails
  yearsAgo: number
}

/**
 * Nájde návštevy, ktoré sa presne dnešným dňom (mesiac + deň) zhodujú
 * s nejakým predchádzajúcim rokom - "presne pred rokom si bol v..."
 */
export function useMemoryOfTheDay(visits: VisitWithDetails[]): Memory[] {
  return useMemo(() => {
    const today = new Date()
    const month = today.getMonth()
    const day = today.getDate()
    const currentYear = today.getFullYear()

    return visits
      .filter((v) => {
        const d = new Date(v.visit_date)
        return d.getMonth() === month && d.getDate() === day && d.getFullYear() < currentYear
      })
      .map((v) => ({ visit: v, yearsAgo: currentYear - new Date(v.visit_date).getFullYear() }))
      .sort((a, b) => a.yearsAgo - b.yearsAgo)
  }, [visits])
}
