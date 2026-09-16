import { format } from 'date-fns'
import {
  X,
  Loader2,
  ShieldCheck,
  Mail,
  MailX,
  Calendar,
  Clock,
  Camera,
  Luggage,
  Users2,
} from 'lucide-react'
import { useAdminUserDetail } from '../../hooks/useAdminUserDetail'
import type { AdminUserOverviewRow } from '../../hooks/useAdminUserOverview'

interface Props {
  user: AdminUserOverviewRow
  onClose: () => void
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Potvrdená',
  pending: 'Čaká na potvrdenie',
  declined: 'Odmietnutá',
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`
}

export function UserDetailModal({ user, onClose }: Props) {
  const { detail, loading, error } = useAdminUserDetail(user.id)

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {user.username}
              {user.is_admin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 text-accent-text px-2 py-0.5 text-xs font-medium">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              )}
            </h2>
            {user.full_name && <p className="text-sm text-slate-500 dark:text-slate-400">{user.full_name}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {detail && !loading && (
            <>
              {/* Základné údaje */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  {detail.profile.email_confirmed_at ? (
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <MailX className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span className="truncate">{detail.profile.email ?? 'neznámy email'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  Registrovaný {format(new Date(detail.profile.created_at), 'd. M. yyyy')}
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  {detail.profile.last_sign_in_at
                    ? `Naposledy prihlásený ${format(new Date(detail.profile.last_sign_in_at), 'd. M. yyyy HH:mm')}`
                    : 'Ešte sa neprihlásil(a)'}
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Camera className="w-4 h-4 text-slate-400 shrink-0" />
                  {formatBytes(detail.storage_bytes)} fotiek v úložisku
                </div>
              </div>

              {/* Návštevy */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Návštevy ({detail.visits.length})
                </h3>
                {detail.visits.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">Zatiaľ žiadne návštevy.</p>
                ) : (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                    {detail.visits.map((v) => (
                      <div key={v.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{v.city}</span>
                          <span className="text-slate-400 dark:text-slate-500"> · {v.country}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                          <span>{format(new Date(v.visit_date), 'd.M.yyyy')}</span>
                          {v.photo_count > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <Camera className="w-3 h-3" /> {v.photo_count}
                            </span>
                          )}
                          <span
                            className={`rounded-full px-1.5 py-0.5 ${
                              v.participant_status === 'confirmed'
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                                : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {STATUS_LABEL[v.participant_status] ?? v.participant_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Odznaky */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Odznaky ({detail.badges.length}/11)
                </h3>
                {detail.badges.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">Zatiaľ žiadne odznaky.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {detail.badges.map((b) => (
                      <span
                        key={b.code}
                        title={format(new Date(b.earned_at), 'd. M. yyyy')}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <span>{b.icon}</span> {b.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Výlety a spolucestujúci */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                    <Luggage className="w-4 h-4 text-slate-400" /> Výlety ({detail.trips.length})
                  </h3>
                  {detail.trips.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">Žiadne.</p>
                  ) : (
                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                      {detail.trips.map((t) => (
                        <li key={t.id}>
                          {t.name}{' '}
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            ({t.role === 'owner' ? 'vlastník' : 'člen'})
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                    <Users2 className="w-4 h-4 text-slate-400" /> Spolucestujúci ({detail.companions.length})
                  </h3>
                  {detail.companions.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">Žiadni.</p>
                  ) : (
                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                      {detail.companions.map((c, i) => (
                        <li key={i}>
                          {c.name}
                          {c.matched_user_id && (
                            <span className="text-xs text-accent-text ml-1">(má účet)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
