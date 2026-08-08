import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { registerSchema, type RegisterFormData } from '../../lib/validation'
import { Loader2 } from 'lucide-react'

const inputClass =
  'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500'

export function RegisterForm() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterFormData) {
    setServerError(null)
    const { error } = await signUp(data.email, data.password, data.username)
    if (error) {
      setServerError(error)
      return
    }
    setSuccess(true)
    setTimeout(() => navigate('/login'), 3000)
  }

  if (success) {
    return (
      <div className="w-full max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Skoro hotovo! 🎉</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Poslali sme ti potvrdzovací email. Klikni na odkaz v ňom a potom sa prihlás.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Registrácia</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Začni zaznamenávať svoje cesty po EÚ</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prezývka</label>
          <input type="text" {...register('username')} className={inputClass} placeholder="cestovatel_janko" />
          {errors.username && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
          <input type="email" {...register('email')} className={inputClass} placeholder="tvoj@email.sk" />
          {errors.email && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Heslo</label>
          <input type="password" {...register('password')} className={inputClass} placeholder="••••••••" />
          {errors.password && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Potvrď heslo</label>
          <input type="password" {...register('confirmPassword')} className={inputClass} placeholder="••••••••" />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {serverError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700 transition disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Zaregistrovať sa
        </button>
      </form>

      <p className="text-sm text-slate-500 dark:text-slate-400 mt-6 text-center">
        Už máš účet?{' '}
        <Link to="/login" className="text-emerald-600 dark:text-emerald-500 font-medium hover:underline">
          Prihlás sa
        </Link>
      </p>
    </div>
  )
}
