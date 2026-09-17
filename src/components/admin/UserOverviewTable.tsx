import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { sk } from 'date-fns/locale'
import { BadgeCheck, Clock, ImageIcon, Landmark, ShieldCheck, Users2 } from 'lucide-react'
import type { AdminUserOverviewRow } from '../../hooks/useAdminUserOverview'
import { UserDetailModal } from './UserDetailModal'

interface Props {
  rows: AdminUserOverviewRow[]
}

/** Formátuje bajty na čitateľnú jednotku (KB/MB/GB) - jednoduchá, bez závislosti. */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="bg-paper rounded-xl border border-hairline shadow-sm p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent-text flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold text-ink leading-tight truncate">{value}</p>
        <p className="text-xs text-ink-muted truncate">{label}</p>
      </div>
    </div>
  )
}

export function UserOverviewTable({ rows }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const summary = useMemo(() => {
    const totalUsers = rows.length
    const totalConfirmedVisits = rows.reduce((sum, r) => sum + r.total_visits, 0)
    const totalPending = rows.reduce((sum, r) => sum + r.pending_visits_count, 0)
    const totalStorage = rows.reduce((sum, r) => sum + r.storage_bytes, 0)
    const avgVisited = totalUsers > 0 ? rows.reduce((sum, r) => sum + r.visited_count, 0) / totalUsers : 0
    return { totalUsers, totalConfirmedVisits, totalPending, totalStorage, avgVisited }
  }, [rows])

  const selectedUser = rows.find((r) => r.id === selectedUserId) ?? null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={<Users2 className="w-4 h-4" />} label="Používateľov" value={String(summary.totalUsers)} />
        <StatCard icon={<Landmark className="w-4 h-4" />} label="Potvrdených návštev" value={String(summary.totalConfirmedVisits)} />
        <StatCard icon={<Clock className="w-4 h-4" />} label="Čakajúcich pozvánok" value={String(summary.totalPending)} />
        <StatCard icon={<ImageIcon className="w-4 h-4" />} label="Úložisko fotiek" value={formatBytes(summary.totalStorage)} />
        <StatCard icon={<BadgeCheck className="w-4 h-4" />} label="Priem. miest / os." value={summary.avgVisited.toFixed(1)} />
      </div>

      <div className="bg-paper rounded-xl border border-hairline shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-dim text-ink-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Používateľ</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Registrovaný</th>
                <th className="px-4 py-3 font-medium">Posledné prihlásenie</th>
                <th className="px-4 py-3 font-medium text-center">Miest</th>
                <th className="px-4 py-3 font-medium text-center">Čaká</th>
                <th className="px-4 py-3 font-medium text-center">Odznaky</th>
                <th className="px-4 py-3 font-medium text-center">Fotky</th>
                <th className="px-4 py-3 font-medium text-center">Výlety</th>
                <th className="px-4 py-3 font-medium text-center">Spolu-cest.</th>
                <th className="px-4 py-3 font-medium text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-paper-dim/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{u.username}</span>
                      {u.is_admin && (
                        <span
                          title="Administrátor"
                          className="inline-flex items-center rounded-full bg-accent/15 text-accent-text p-1"
                        >
                          <ShieldCheck className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    {u.full_name && <div className="text-xs text-ink-muted">{u.full_name}</div>}
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">
                    {u.email ?? <span className="text-ink-faint italic">neznámy</span>}
                    {!u.email_confirmed_at && (
                      <span className="ml-1.5 text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400">
                        nepotvrdený
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                    {format(new Date(u.created_at), 'd.M.yyyy')}
                  </td>
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                    {u.last_sign_in_at ? (
                      formatDistanceToNow(new Date(u.last_sign_in_at), { addSuffix: true, locale: sk })
                    ) : (
                      <span className="italic">nikdy</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-ink-secondary">{u.visited_count}/27</td>
                  <td className="px-4 py-3 text-center">
                    {u.pending_visits_count > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-xs font-medium">
                        {u.pending_visits_count}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-ink-secondary">{u.badges_earned}/11</td>
                  <td className="px-4 py-3 text-center text-ink-secondary">
                    {u.photos_count}
                    {u.storage_bytes > 0 && (
                      <div className="text-[11px] text-ink-faint">{formatBytes(u.storage_bytes)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-ink-secondary">{u.trips_count}</td>
                  <td className="px-4 py-3 text-center text-ink-secondary">{u.companions_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedUserId(u.id)}
                      className="text-xs font-medium text-accent-text hover:underline"
                    >
                      Zobraziť
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUserId(null)} />}
    </div>
  )
}
