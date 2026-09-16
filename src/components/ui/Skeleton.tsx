interface SkeletonProps {
  className?: string
}

/** Základný "kosť" pre skeleton loading - pulzujúci obdĺžnik nahradzujúci obsah, kým sa načítava. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-slate-100 dark:bg-slate-800 rounded ${className}`} />
}

interface SkeletonListProps {
  /** Počet riadkov skeletonu. */
  rows?: number
  className?: string
}

/**
 * Skeleton pre zoznam/tabuľku riadkov (napr. používatelia, oznámenia, moderovaný obsah) -
 * nahrádza predchádzajúci text "Načítavam..." vizuálnym náznakom obsahu, ktorý sa chystá načítať.
 */
export function SkeletonRows({ rows = 6, className = '' }: SkeletonListProps) {
  return (
    <div className={`divide-y divide-slate-100 dark:divide-slate-800 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3.5 flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Skeleton pre súhrnné štatistické karty (napr. admin Prehľad). */
export function SkeletonStatCards({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3"
        >
          <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
