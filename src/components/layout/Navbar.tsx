import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Map, ShieldCheck, User as UserIcon, Download, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { getAvatarPublicUrl } from '../../lib/storage'

export function Navbar() {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const { canInstall, promptInstall } = useInstallPrompt()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
          <Map className="w-5 h-5 text-emerald-600 dark:text-emerald-500" /> visitEU
          <span className="text-xs font-normal text-slate-400 dark:text-slate-500">v{__APP_VERSION__}</span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
            title={theme === 'dark' ? 'Prepnúť na svetlý režim' : 'Prepnúť na tmavý režim'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {canInstall && (
            <button
              onClick={promptInstall}
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-400 transition"
              title="Nainštalovať visitEU ako appku"
            >
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Inštalovať</span>
            </button>
          )}
          {profile?.is_admin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-500"
            >
              <ShieldCheck className="w-4 h-4" /> Admin
            </Link>
          )}
          <Link
            to="/profile"
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-500 transition"
          >
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <img src={getAvatarPublicUrl(profile.avatar_url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <span className="hidden sm:inline">{profile?.username}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Odhlásiť</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
