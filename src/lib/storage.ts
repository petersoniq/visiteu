import { supabase } from './supabaseClient'
import { compressImage } from './imageCompression'

const BUCKET = 'visit-photos'
const MAX_FILE_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Fotky z cesty - väčšie rozlíšenie (galéria/lightbox ich zobrazuje na celú obrazovku)
const VISIT_PHOTO_MAX_DIMENSION = 1600
const VISIT_PHOTO_QUALITY = 0.82

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
  const cleanBaseName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_').replace(/\.[^.]+$/, '')

  let uploadBody: Blob = file
  let extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  let contentType = file.type

  try {
    const compressed = await compressImage(file, VISIT_PHOTO_MAX_DIMENSION, VISIT_PHOTO_QUALITY)
    uploadBody = compressed.blob
    extension = compressed.extension
    contentType = compressed.blob.type
  } catch {
    // Kompresia zlyhala (napr. starší prehliadač) - nahraj pôvodný súbor bez zmeny
  }

  const path = `${userId}/${visitId}/${Date.now()}-${cleanBaseName}.${extension}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, uploadBody, {
    contentType,
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

// Avatar sa nikdy nezobrazuje väčší než malý krúžok v appke - stačí oveľa menšie rozlíšenie
const AVATAR_MAX_DIMENSION = 512
const AVATAR_QUALITY = 0.85

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
  let uploadBody: Blob = file
  let extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  let contentType = file.type

  try {
    const compressed = await compressImage(file, AVATAR_MAX_DIMENSION, AVATAR_QUALITY)
    uploadBody = compressed.blob
    extension = compressed.extension
    contentType = compressed.blob.type
  } catch {
    // Kompresia zlyhala - nahraj pôvodný súbor bez zmeny
  }

  // Vždy rovnaký názov súboru pre daného používateľa -> upsert prepíše starý avatar
  const path = `${userId}/avatar.${extension}`

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, uploadBody, {
    contentType,
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
