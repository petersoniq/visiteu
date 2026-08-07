import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Map, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
          <Map className="w-5 h-5 text-emerald-600" /> visitEU
          <span className="text-xs font-normal text-slate-400">v{__APP_VERSION__}</span>
        </Link>

        <div className="flex items-center gap-4">
          {profile?.is_admin && (
            <Link to="/admin" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-emerald-700">
              <ShieldCheck className="w-4 h-4" /> Admin
            </Link>
          )}
          <span className="text-sm text-slate-500 hidden sm:inline">{profile?.username}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 transition"
          >
            <LogOut className="w-4 h-4" /> Odhlásiť
          </button>
        </div>
      </div>
    </nav>
  )
}
