import { useState } from 'react'
import { format } from 'date-fns'
import { Shield, ShieldOff, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import type { AdminUserRow } from '../../hooks/useAdminUsers'

interface Props {
  users: AdminUserRow[]
  onChanged: () => void
}

export function UserManagementTable({ users, onChanged }: Props) {
  const { user: currentUser } = useAuth()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggleAdmin(targetUser: AdminUserRow) {
    if (targetUser.id === currentUser?.id) {
      setError('Nemôžeš zmeniť admin práva sám sebe.')
      return
    }

    setError(null)
    setUpdatingId(targetUser.id)
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !targetUser.is_admin })
      .eq('id', targetUser.id)

    setUpdatingId(null)
    if (error) {
      setError(error.message)
      return
    }
    onChanged()
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Používateľ</th>
              <th className="px-4 py-3 font-medium">Registrovaný</th>
              <th className="px-4 py-3 font-medium text-center">Miest</th>
              <th className="px-4 py-3 font-medium text-center">Ciest spolu</th>
              <th className="px-4 py-3 font-medium text-center">Rola</th>
              <th className="px-4 py-3 font-medium text-right">Akcie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{u.username}</div>
                  {u.full_name && <div className="text-xs text-slate-500">{u.full_name}</div>}
                </td>
                <td className="px-4 py-3 text-slate-500">{format(new Date(u.created_at), 'd.M.yyyy')}</td>
                <td className="px-4 py-3 text-center text-slate-700">{u.visited_count}/27</td>
                <td className="px-4 py-3 text-center text-slate-700">{u.total_visits}</td>
                <td className="px-4 py-3 text-center">
                  {u.is_admin ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-medium">
                      Člen
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleAdmin(u)}
                    disabled={updatingId === u.id || u.id === currentUser?.id}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    {updatingId === u.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : u.is_admin ? (
                      <>
                        <ShieldOff className="w-3.5 h-3.5" /> Odobrať admina
                      </>
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5" /> Nastaviť ako admina
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
