import { useRef, useState } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { validatePhotoFile, uploadVisitPhoto, deleteVisitPhoto, getPhotoPublicUrl } from '../../lib/storage'
import { supabase } from '../../lib/supabaseClient'
import type { VisitPhoto } from '../../types'

interface Props {
  userId: string
  visitId: string
  photos: VisitPhoto[]
  onPhotosChange: (photos: VisitPhoto[]) => void
}

export function PhotoUpload({ userId, visitId, photos, onPhotosChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)

    const remainingSlots = 10 - photos.length
    if (remainingSlots <= 0) {
      setError('Maximálny počet fotiek na návštevu je 10.')
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    setUploading(true)

    for (const file of filesToUpload) {
      const validationError = validatePhotoFile(file)
      if (validationError) {
        setError(validationError)
        continue
      }

      const { path, error: uploadError } = await uploadVisitPhoto(userId, visitId, file)
      if (uploadError || !path) {
        setError(uploadError ?? 'Nahrávanie zlyhalo.')
        continue
      }

      const { data, error: dbError } = await supabase
        .from('visit_photos')
        .insert({ visit_id: visitId, storage_path: path })
        .select()
        .single()

      if (dbError) {
        setError(dbError.message)
        continue
      }

      onPhotosChange([...photos, data as VisitPhoto])
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(photo: VisitPhoto) {
    const { error: dbError } = await supabase.from('visit_photos').delete().eq('id', photo.id)

    if (dbError) {
      setError(dbError.message)
      return
    }

    await deleteVisitPhoto(photo.storage_path)
    onPhotosChange(photos.filter((p) => p.id !== photo.id))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Fotografie ({photos.length}/10)
      </label>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group aspect-square">
            <img
              src={getPhotoPublicUrl(photo.storage_path)}
              alt={photo.caption ?? 'Fotka z cesty'}
              className="w-full h-full object-cover rounded-lg border border-slate-200"
            />
            <button
              type="button"
              onClick={() => handleDelete(photo)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {photos.length < 10 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="w-5 h-5" />
                <span className="text-xs">Pridať</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      <p className="text-xs text-slate-400 mt-1">JPG, PNG alebo WebP, max. 5 MB na fotku.</p>
    </div>
  )
}
