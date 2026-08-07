import { supabase } from './supabaseClient'

const BUCKET = 'visit-photos'
const MAX_FILE_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validatePhotoFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Povolené sú len JPG, PNG alebo WebP obrázky.'
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `Súbor je príliš veľký (max. ${MAX_FILE_SIZE_MB} MB).`
  }
  return null
}

export async function uploadVisitPhoto(
  userId: string,
  visitId: string,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const path = `${userId}/${visitId}/${Date.now()}-${cleanName}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) return { path: null, error: error.message }
  return { path, error: null }
}

export function getPhotoPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteVisitPhoto(path: string): Promise<{ error: string | null }> {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  return { error: error?.message ?? null }
}

// =========================================================
// AVATAR (profilová fotka) – samostatný bucket 'avatars'
// =========================================================
const AVATAR_BUCKET = 'avatars'
const MAX_AVATAR_SIZE_MB = 3

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Povolené sú len JPG, PNG alebo WebP obrázky.'
  }
  if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
    return `Súbor je príliš veľký (max. ${MAX_AVATAR_SIZE_MB} MB).`
  }
  return null
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  // Vždy rovnaký názov súboru pre daného používateľa -> upsert prepíše starý avatar
  const path = `${userId}/avatar.${ext}`

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })

  if (error) return { path: null, error: error.message }
  return { path, error: null }
}

export function getAvatarPublicUrl(path: string): string {
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  // cache-busting query param, aby prehliadač po zmene avatara nezobrazoval starú verziu z cache
  return `${data.publicUrl}?t=${Date.now()}`
}
