import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Users, ShieldAlert, Megaphone, ArrowLeft } from 'lucide-react'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { UserManagementTable } from '../components/admin/UserManagementTable'
import { ContentModeration } from '../components/admin/ContentModeration'
import { AnnouncementManager } from '../components/admin/AnnouncementManager'

type Tab = 'users' | 'moderation' | 'announcements'

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('users')
  const { users, loading, refetch } = useAdminUsers()

  const tabs: { key: Tab; label: string; icon: ReactNode }[] = [
    { key: 'users', label: 'Používatelia', icon: <Users className="w-4 h-4" /> },
    { key: 'moderation', label: 'Moderácia obsahu', icon: <ShieldAlert className="w-4 h-4" /> },
    { key: 'announcements', label: 'Oznámenia', icon: <Megaphone className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-accent transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Späť do appky
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Admin panel</h1>
        <p className="text-slate-500 dark:text-slate-400">Správa používateľov a obsahu aplikácie visitEU.</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === t.key
                ? 'border-accent text-accent-text'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' &&
        (loading ? (
          <div className="text-slate-400 dark:text-slate-500 text-sm py-8 text-center">Načítavam...</div>
        ) : (
          <UserManagementTable users={users} onChanged={refetch} />
        ))}
      {tab === 'moderation' && <ContentModeration />}
      {tab === 'announcements' && <AnnouncementManager />}
    </div>
  )
}
