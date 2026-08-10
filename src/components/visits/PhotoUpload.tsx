import { useRef, useState } from 'react'
import { ImagePlus, X, Loader2, Pencil, Check, ZoomIn } from 'lucide-react'
import { validatePhotoFile, uploadVisitPhoto, deleteVisitPhoto, getPhotoPublicUrl } from '../../lib/storage'
import { supabase } from '../../lib/supabaseClient'
import { PhotoLightbox } from './PhotoLightbox'
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
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null)
  const [captionDraft, setCaptionDraft] = useState('')
  const [savingCaption, setSavingCaption] = useState(false)
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
    if (editingCaptionId === photo.id) setEditingCaptionId(null)
  }

  function startEditCaption(photo: VisitPhoto) {
    setEditingCaptionId(photo.id)
    setCaptionDraft(photo.caption ?? '')
  }

  async function saveCaption() {
    if (!editingCaptionId) return
    setSavingCaption(true)
    const trimmed = captionDraft.trim() || null

    const { error: dbError } = await supabase
      .from('visit_photos')
      .update({ caption: trimmed })
      .eq('id', editingCaptionId)

    setSavingCaption(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    onPhotosChange(photos.map((p) => (p.id === editingCaptionId ? { ...p, caption: trimmed } : p)))
    setEditingCaptionId(null)
  }

  const editingPhoto = photos.find((p) => p.id === editingCaptionId) ?? null

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Fotografie ({photos.length}/10)
      </label>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
        {photos.map((photo, i) => (
          <div key={photo.id} className="relative group aspect-square">
            <button
              type="button"
              onClick={() => setPreviewIndex(i)}
              className="w-full h-full block"
              title={photo.caption ?? 'Zväčšiť'}
            >
              <img
                src={getPhotoPublicUrl(photo.storage_path)}
                alt={photo.caption ?? 'Fotka z cesty'}
                className="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-700"
              />
              <span className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => startEditCaption(photo)}
              className="absolute bottom-1 left-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
              title="Upraviť popis"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(photo)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
              title="Zmazať fotku"
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
            className="aspect-square flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-accent hover:text-accent-text transition disabled:opacity-50"
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

      {editingPhoto && (
        <div className="mb-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Popis fotky</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value)}
              maxLength={140}
              autoFocus
              placeholder="napr. Výhľad z hradu"
              className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              onKeyDown={(e) => e.key === 'Enter' && saveCaption()}
            />
            <button
              type="button"
              onClick={saveCaption}
              disabled={savingCaption}
              className="text-accent-text hover:text-accent-hover shrink-0"
              title="Uložiť popis"
            >
              {savingCaption ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setEditingCaptionId(null)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
              title="Zrušiť"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">JPG, PNG alebo WebP, max. 5 MB na fotku.</p>

      {previewIndex !== null && (
        <PhotoLightbox
          visitId={visitId}
          title="Fotografie návštevy"
          initialPhotos={photos}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </div>
  )
}
