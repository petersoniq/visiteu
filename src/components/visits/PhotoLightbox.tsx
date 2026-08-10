import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Loader2, ImageOff } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { getPhotoPublicUrl } from '../../lib/storage'
import type { VisitPhoto } from '../../types'

interface Props {
  visitId: string
  title: string
  subtitle?: string
  /** Ak už fotky poznáme (napr. z PhotoUpload), netreba ich znova fetchovať */
  initialPhotos?: VisitPhoto[]
  initialIndex?: number
  onClose: () => void
}

export function PhotoLightbox({ visitId, title, subtitle, initialPhotos, initialIndex = 0, onClose }: Props) {
  const [photos, setPhotos] = useState<VisitPhoto[]>(initialPhotos ?? [])
  const [loading, setLoading] = useState(!initialPhotos)
  const [index, setIndex] = useState(initialIndex)

  useEffect(() => {
    if (initialPhotos) return

    let active = true
    async function load() {
      const { data } = await supabase
        .from('visit_photos')
        .select('*')
        .eq('visit_id', visitId)
        .order('created_at', { ascending: true })
      if (!active) return
      setPhotos((data as VisitPhoto[]) ?? [])
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(photos.length - 1, i + 1))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [photos.length, onClose])

  const current = photos[index]

  return (
    <div className="fixed inset-0 z-[3000] bg-black/90 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 text-white shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0">
          <p className="font-medium truncate">{title}</p>
          <p className="text-xs text-white/60">
            {subtitle ? `${subtitle} · ` : ''}
            {photos.length > 0 ? `${index + 1} / ${photos.length}` : null}
          </p>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white shrink-0 ml-3" aria-label="Zavrieť galériu">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative px-3 sm:px-6 pb-4 min-h-0" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
        ) : photos.length === 0 ? (
          <div className="text-center text-white/60">
            <ImageOff className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">K tejto návšteve zatiaľ nie sú žiadne fotky.</p>
          </div>
        ) : (
          <>
            {index > 0 && (
              <button
                onClick={() => setIndex((i) => i - 1)}
                className="absolute left-1 sm:left-3 text-white/70 hover:text-white p-2"
                aria-label="Predchádzajúca fotka"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            <div className="max-w-full max-h-full flex flex-col items-center gap-3">
              <img
                src={getPhotoPublicUrl(current.storage_path)}
                alt={current.caption ?? title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
              {current.caption && <p className="text-white/80 text-sm text-center max-w-md">{current.caption}</p>}
            </div>
            {index < photos.length - 1 && (
              <button
                onClick={() => setIndex((i) => i + 1)}
                className="absolute right-1 sm:right-3 text-white/70 hover:text-white p-2"
                aria-label="Ďalšia fotka"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto shrink-0" onClick={(e) => e.stopPropagation()}>
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setIndex(i)}
              className={`shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition ${
                i === index ? 'border-white' : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <img src={getPhotoPublicUrl(p.storage_path)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
