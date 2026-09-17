import type { Badge } from '../../hooks/useBadges'
import { Lock } from 'lucide-react'

interface Props {
  allBadges: Badge[]
  earnedCodes: Set<string>
}

export function BadgeGrid({ allBadges, earnedCodes }: Props) {
  return (
    <div className="bg-paper rounded-xl border border-hairline p-5 shadow-sm">
      <h3 className="font-semibold text-ink mb-3">
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
                earned
                  ? 'border-accent/30 bg-accent/10'
                  : 'border-hairline bg-slate-50 dark:bg-slate-800/40 opacity-50'
              }`}
            >
              <div className="text-2xl mb-1">
                {earned ? badge.icon ?? '🏅' : <Lock className="w-5 h-5 text-ink-faint" />}
              </div>
              <span
                className={`text-xs font-medium ${
                  earned ? 'text-accent-text' : 'text-ink-faint'
                }`}
              >
                {badge.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
