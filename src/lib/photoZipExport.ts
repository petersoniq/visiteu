import { downloadZip } from 'client-zip'
import { supabase } from './supabaseClient'
import { getPhotoPublicUrl } from './storage'

interface RawRow {
  visit_date: string
  eu_capitals: { city: string } | null
  visit_photos: { storage_path: string }[] | null
}

function safeFolderName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_')
}

/**
 * Stiahne VŠETKY fotky používateľa (naprieč všetkými návštevami) ako jeden ZIP súbor,
 * zoradený do priečinkov podľa dátumu a mesta. Fotky sú už skomprimované pri nahrávaní,
 * takže sa balia bez ďalšej kompresie (rýchlejšie, žiadna strata kvality navyše).
 *
 * Dopĺňa JSON/CSV export (ktorý obsahuje len odkazy na fotky v Supabase Storage) -
 * toto je jediný spôsob, ako mať fotky skutočne stiahnuté a nezávislé od appky.
 */
export async function downloadAllPhotosAsZip(userId: string): Promise<{ error: string | null; photoCount: number }> {
  const { data, error } = await supabase
    .from('visits')
    .select('visit_date, eu_capitals(city), visit_photos(storage_path)')
    .eq('user_id', userId)
    .order('visit_date', { ascending: true })

  if (error) return { error: error.message, photoCount: 0 }

  const rows = (data ?? []) as unknown as RawRow[]

  const entries: { folder: string; storagePath: string }[] = []
  for (const row of rows) {
    const city = row.eu_capitals?.city ?? 'Neznáme mesto'
    const folder = safeFolderName(`${row.visit_date}-${city}`)
    for (const photo of row.visit_photos ?? []) {
      entries.push({ folder, storagePath: photo.storage_path })
    }
  }

  if (entries.length === 0) {
    return { error: null, photoCount: 0 }
  }

  const nameCounters = new Map<string, number>()
  const fileMetas = entries.map((entry) => {
    const n = (nameCounters.get(entry.folder) ?? 0) + 1
    nameCounters.set(entry.folder, n)
    const extension = entry.storagePath.split('.').pop() || 'jpg'
    return { name: `${entry.folder}/foto-${n}.${extension}`, storagePath: entry.storagePath }
  })

  const files = await Promise.all(
    fileMetas.map(async (meta) => ({
      name: meta.name,
      input: await fetch(getPhotoPublicUrl(meta.storagePath)),
    }))
  )

  const blob = await downloadZip(files).blob()

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `visiteu-fotky-${new Date().toISOString().slice(0, 10)}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return { error: null, photoCount: entries.length }
}
