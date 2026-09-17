import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Users, ShieldAlert, Megaphone, ArrowLeft, LayoutDashboard } from 'lucide-react'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { useAdminUserOverview } from '../hooks/useAdminUserOverview'
import { UserManagementTable } from '../components/admin/UserManagementTable'
import { UserOverviewTable } from '../components/admin/UserOverviewTable'
import { ContentModeration } from '../components/admin/ContentModeration'
import { AnnouncementManager } from '../components/admin/AnnouncementManager'
import { SkeletonRows, SkeletonStatCards } from '../components/ui/Skeleton'

type Tab = 'overview' | 'users' | 'moderation' | 'announcements'

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const { users, loading, refetch } = useAdminUsers()
  const { rows: overviewRows, loading: overviewLoading, error: overviewError } = useAdminUserOverview()

  const tabs: { key: Tab; label: string; icon: ReactNode }[] = [
    { key: 'overview', label: 'Prehľad', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'users', label: 'Používatelia', icon: <Users className="w-4 h-4" /> },
    { key: 'moderation', label: 'Moderácia obsahu', icon: <ShieldAlert className="w-4 h-4" /> },
    { key: 'announcements', label: 'Oznámenia', icon: <Megaphone className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-accent transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Späť do appky
        </Link>
        <h1 className="text-2xl font-bold text-ink mb-1">Admin panel</h1>
        <p className="text-ink-muted">Správa používateľov a obsahu aplikácie visitEU.</p>
      </div>

      <div className="flex gap-1 border-b border-hairline overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap shrink-0 ${
              tab === t.key
                ? 'border-accent text-accent-text'
                : 'border-transparent text-ink-muted hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' &&
        (overviewLoading ? (
          <div className="space-y-4">
            <SkeletonStatCards />
            <div className="bg-paper rounded-xl border border-hairline shadow-sm">
              <SkeletonRows rows={6} />
            </div>
          </div>
        ) : overviewError ? (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {overviewError}
          </div>
        ) : (
          <UserOverviewTable rows={overviewRows} />
        ))}
      {tab === 'users' &&
        (loading ? (
          <div className="bg-paper rounded-xl border border-hairline shadow-sm">
            <SkeletonRows rows={6} />
          </div>
        ) : (
          <UserManagementTable users={users} onChanged={refetch} />
        ))}
      {tab === 'moderation' && <ContentModeration />}
      {tab === 'announcements' && <AnnouncementManager />}
    </div>
  )
}
