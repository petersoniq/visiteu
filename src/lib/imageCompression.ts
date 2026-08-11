export interface CompressedImage {
  blob: Blob
  extension: string
}

/**
 * Zmenší a skomprimuje obrázok priamo v prehliadači pred nahratím na server -
 * fotky z mobilu bývajú 3-8 MB, na obrazovke z toho reálne treba zlomok.
 * Skúša WebP (najlepší pomer kvalita/veľkosť), pri nepodpore prehliadačom
 * padá na JPEG. Ak kompresia z akéhokoľvek dôvodu zlyhá, volajúci kód má
 * nahrať pôvodný súbor bez zmeny (žiadna strata funkčnosti).
 */
export async function compressImage(
  file: File,
  maxDimension: number,
  quality: number
): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file)

  let { width, height } = bitmap
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas nie je v tomto prehliadači podporovaný.')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const webpBlob = await canvasToBlob(canvas, 'image/webp', quality)
  if (webpBlob) return { blob: webpBlob, extension: 'webp' }

  const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', quality)
  if (jpegBlob) return { blob: jpegBlob, extension: 'jpg' }

  throw new Error('Kompresia fotky zlyhala.')
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}
