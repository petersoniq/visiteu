import type { RegionStats } from '../../hooks/useStats'

export function RegionBreakdown({ regionStats }: { regionStats: RegionStats[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900 mb-3">Podľa regiónu</h3>
      <div className="space-y-3">
        {regionStats.map((r) => (
          <div key={r.region}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-700">{r.region}</span>
              <span className="text-slate-500">{r.visited}/{r.total}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-700"
                style={{ width: `${r.total > 0 ? (r.visited / r.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
