import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Map, ShieldCheck, User as UserIcon, Download } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { getAvatarPublicUrl } from '../../lib/storage'

export function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { canInstall, promptInstall } = useInstallPrompt()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="border-b border-hairline bg-paper transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-ink">
          <Map className="w-5 h-5 text-accent-text" /> visitEU
          <span className="text-xs font-normal text-ink-faint">v{__APP_VERSION__}</span>
        </Link>

        <div className="flex items-center gap-4">
          {canInstall && (
            <button
              onClick={promptInstall}
              className="flex items-center gap-1.5 text-sm font-medium text-accent-text hover:text-accent-hover transition"
              title="Nainštalovať visitEU ako appku"
            >
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Inštalovať</span>
            </button>
          )}
          {profile?.is_admin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-accent"
            >
              <ShieldCheck className="w-4 h-4" /> Admin
            </Link>
          )}
          <Link
            to="/profile"
            className="flex items-center gap-2 text-sm text-ink-secondary hover:text-accent transition"
          >
            <div className="w-6 h-6 rounded-full bg-paper-dim border border-hairline overflow-hidden flex items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <img src={getAvatarPublicUrl(profile.avatar_url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-ink-faint" />
              )}
            </div>
            <span className="hidden sm:inline">{profile?.username}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-red-600 dark:hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Odhlásiť</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
