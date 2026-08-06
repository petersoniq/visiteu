interface Props {
  visited: number
  total: number
  percentage: number
}

export function ProgressBar({ visited, total, percentage }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-semibold text-slate-900">Tvoj pokrok</h3>
        <span className="text-2xl font-bold text-emerald-600">{percentage}%</span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-slate-500 mt-2">
        Navštívil si <span className="font-medium text-slate-700">{visited} z {total}</span> hlavných miest EÚ
      </p>
    </div>
  )
}
