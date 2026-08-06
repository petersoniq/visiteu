import type { Badge } from '../../hooks/useBadges'
import { Lock } from 'lucide-react'

interface Props {
  allBadges: Badge[]
  earnedCodes: Set<string>
}

export function BadgeGrid({ allBadges, earnedCodes }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900 mb-3">
        Odznaky ({earnedCodes.size}/{allBadges.length})
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {allBadges.map((badge) => {
          const earned = earnedCodes.has(badge.code)
          return (
            <div
              key={badge.id}
              title={badge.description ?? undefined}
              className={`flex flex-col items-center text-center p-3 rounded-lg border transition ${
                earned ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50 opacity-50'
              }`}
            >
              <div className="text-2xl mb-1">
                {earned ? badge.icon ?? '🏅' : <Lock className="w-5 h-5 text-slate-400" />}
              </div>
              <span className={`text-xs font-medium ${earned ? 'text-emerald-800' : 'text-slate-400'}`}>
                {badge.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
