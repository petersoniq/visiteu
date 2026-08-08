import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Loader2, KeyRound, User as UserIcon } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import {
  profileSchema,
  type ProfileFormData,
  passwordChangeSchema,
  type PasswordChangeFormData,
} from '../lib/validation'
import { validateAvatarFile, uploadAvatar, getAvatarPublicUrl } from '../lib/storage'

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
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

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Môj profil</h1>
        <p className="text-slate-500 dark:text-slate-400">Uprav si osobné údaje, profilovú fotku a heslo.</p>
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
              className="absolute -bottom-1 -right-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-1.5 shadow-sm transition disabled:opacity-60"
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
              className="text-sm font-medium text-emerald-700 dark:text-emerald-500 hover:underline disabled:opacity-60"
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
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              Uložené ✓
            </div>
          )}

          <button
            type="submit"
            disabled={profileSubmitting}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-60"
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
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              Heslo bolo zmenené ✓
            </div>
          )}

          <button
            type="submit"
            disabled={passwordSubmitting}
            className="flex items-center gap-2 rounded-lg bg-slate-800 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 dark:hover:bg-slate-600 transition disabled:opacity-60"
          >
            {passwordSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Zmeniť heslo
          </button>
        </form>
      </div>
    </div>
  )
}
