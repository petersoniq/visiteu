import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Loader2, KeyRound, User as UserIcon, Palette, Check, DatabaseBackup, FileJson, FileSpreadsheet } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useAccent } from '../contexts/AccentContext'
import { ACCENT_PALETTES } from '../lib/accentPalettes'
import { fetchExportPayload, downloadJSON, downloadCSV } from '../lib/export'
import {
  profileSchema,
  type ProfileFormData,
  passwordChangeSchema,
  type PasswordChangeFormData,
} from '../lib/validation'
import { validateAvatarFile, uploadAvatar, getAvatarPublicUrl } from '../lib/storage'

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { accent, setAccent } = useAccent()
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile?.avatar_url ? getAvatarPublicUrl(profile.avatar_url) : null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Formulár na základné údaje (prezývka, meno) ---
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username ?? '',
      full_name: profile?.full_name ?? '',
    },
  })
  const [profileServerError, setProfileServerError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)

  async function onProfileSubmit(data: ProfileFormData) {
    if (!user) return
    setProfileServerError(null)
    setProfileSuccess(false)

    const { error } = await supabase
      .from('profiles')
      .update({
        username: data.username,
        full_name: data.full_name || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      setProfileServerError(
        error.message.includes('duplicate') || error.message.includes('unique')
          ? 'Táto prezývka je už obsadená.'
          : error.message
      )
      return
    }

    await refreshProfile()
    setProfileSuccess(true)
    setTimeout(() => setProfileSuccess(false), 3000)
  }

  // --- Avatar upload ---
  async function handleAvatarChange(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || !user) return
    const file = fileList[0]
    setAvatarError(null)

    const validationError = validateAvatarFile(file)
    if (validationError) {
      setAvatarError(validationError)
      return
    }

    setAvatarUploading(true)
    const { path, error } = await uploadAvatar(user.id, file)
    if (error || !path) {
      setAvatarError(error ?? 'Nahrávanie zlyhalo.')
      setAvatarUploading(false)
      return
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .update({ avatar_url: path, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    setAvatarUploading(false)

    if (dbError) {
      setAvatarError(dbError.message)
      return
    }

    setAvatarPreview(getAvatarPublicUrl(path))
    await refreshProfile()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // --- Formulár na zmenu hesla ---
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordChangeFormData>({ resolver: zodResolver(passwordChangeSchema) })
  const [passwordServerError, setPasswordServerError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  async function onPasswordSubmit(data: PasswordChangeFormData) {
    setPasswordServerError(null)
    setPasswordSuccess(false)

    const { error } = await supabase.auth.updateUser({ password: data.newPassword })

    if (error) {
      setPasswordServerError(error.message)
      return
    }

    resetPasswordForm()
    setPasswordSuccess(true)
    setTimeout(() => setPasswordSuccess(false), 3000)
  }

  // --- Export dát (záloha denníka) ---
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  async function handleExport(format: 'json' | 'csv') {
    if (!user || !profile) return
    setExporting(format)
    setExportError(null)

    try {
      const payload = await fetchExportPayload(user.id, profile.username, profile.full_name)
      if (payload.totalVisits === 0) {
        setExportError('Zatiaľ nemáš žiadne návštevy na export.')
        return
      }
      if (format === 'json') {
        downloadJSON(payload)
      } else {
        downloadCSV(payload)
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export zlyhal.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Môj profil</h1>
        <p className="text-slate-500 dark:text-slate-400">Uprav si osobné údaje, profilovú fotku a heslo.</p>
      </div>

      {/* Vzhľad */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4" /> Vzhľad
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Tmavý režim</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Prepni medzi svetlým a tmavým vzhľadom appky.</p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            role="switch"
            aria-checked={theme === 'dark'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
              theme === 'dark' ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Farba zvýraznenia</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-y-5">
            {Object.values(ACCENT_PALETTES).map((palette) => (
              <button
                key={palette.id}
                type="button"
                onClick={() => setAccent(palette.id)}
                className="flex flex-col items-center gap-2"
                title={palette.label}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ${
                    accent === palette.id ? 'ring-2 ring-slate-400 dark:ring-slate-500' : ''
                  }`}
                  style={{ backgroundColor: palette.swatch }}
                >
                  {accent === palette.id && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-tight px-0.5">
                  {palette.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Avatar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Profilová fotka</h3>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 bg-accent hover:bg-accent-hover text-white rounded-full p-1.5 shadow-sm transition disabled:opacity-60"
              title="Zmeniť profilovú fotku"
            >
              {avatarUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="flex-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="text-sm font-medium text-accent-text hover:underline disabled:opacity-60"
            >
              Nahrať novú fotku
            </button>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">JPG, PNG alebo WebP, max. 3 MB.</p>
            {avatarError && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{avatarError}</p>}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleAvatarChange(e.target.files)}
        />
      </div>

      {/* Základné údaje */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Základné údaje</h3>
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prezývka</label>
            <input
              type="text"
              {...registerProfile('username')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {profileErrors.username && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{profileErrors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Celé meno (voliteľné)</label>
            <input
              type="text"
              {...registerProfile('full_name')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Ako ťa majú vidieť ostatní"
            />
            {profileErrors.full_name && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{profileErrors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Email nie je možné zmeniť.</p>
          </div>

          {profileServerError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-400">
              {profileServerError}
            </div>
          )}
          {profileSuccess && (
            <div className="rounded-lg bg-accent/10 border border-accent/30 px-3 py-2 text-sm text-accent-text">
              Uložené ✓
            </div>
          )}

          <button
            type="submit"
            disabled={profileSubmitting}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition disabled:opacity-60"
          >
            {profileSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Uložiť zmeny
          </button>
        </form>
      </div>

      {/* Zmena hesla */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <KeyRound className="w-4 h-4" /> Zmena hesla
        </h3>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nové heslo</label>
            <input
              type="password"
              {...registerPassword('newPassword')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="••••••••"
            />
            {passwordErrors.newPassword && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{passwordErrors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Potvrď nové heslo</label>
            <input
              type="password"
              {...registerPassword('confirmPassword')}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="••••••••"
            />
            {passwordErrors.confirmPassword && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{passwordErrors.confirmPassword.message}</p>
            )}
          </div>

          {passwordServerError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-400">
              {passwordServerError}
            </div>
          )}
          {passwordSuccess && (
            <div className="rounded-lg bg-accent/10 border border-accent/30 px-3 py-2 text-sm text-accent-text">
              Heslo bolo zmenené ✓
            </div>
          )}

          <button
            type="submit"
            disabled={passwordSubmitting}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition disabled:opacity-60"
          >
            {passwordSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Zmeniť heslo
          </button>
        </form>
      </div>

      {/* Moje dáta - záloha/export denníka */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <DatabaseBackup className="w-4 h-4" /> Moje dáta
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          Stiahni si zálohu celého cestovateľského denníka - všetky návštevy, výlety, poznámky
          a odkazy na fotky. Odporúčame si dáta občas zálohovať, nech tvoje spomienky nezávisia
          len od tejto appky.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => handleExport('json')}
            disabled={exporting !== null}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-60"
          >
            {exporting === 'json' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
            Stiahnuť JSON zálohu
          </button>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={exporting !== null}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-60"
          >
            {exporting === 'csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Stiahnuť CSV (Excel/Sheets)
          </button>
        </div>

        {exportError && <p className="text-sm text-red-600 dark:text-red-400 mt-3">{exportError}</p>}

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
          JSON obsahuje kompletnú štruktúru dát (odporúčané pre archiváciu). CSV je vhodné na
          otvorenie v tabuľkovom editore. Fotky samotné zostávajú v Supabase Storage - export
          obsahuje len ich verejné odkazy.
        </p>
      </div>
    </div>
  )
}
