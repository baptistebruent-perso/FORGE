import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'
import { useProgressPhotos } from '../../hooks/useProgressPhotos'
import { uploadProgressPhoto, getPhotoUrl } from '../../lib/storage'
import { useAuth } from '../../contexts/AuthContext'

type ViewFilter = 'all' | 'front' | 'side' | 'back'

export function PhotoTimeline() {
  const { user } = useAuth()
  const { photos, loading, addPhoto, deletePhoto } = useProgressPhotos()
  const [filter, setFilter] = useState<ViewFilter>('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [viewType, setViewType] = useState<'front' | 'side' | 'back'>('front')
  const [uploading, setUploading] = useState(false)
  const [fullscreen, setFullscreen] = useState<string | null>(null)
  const { add } = useToast()

  const filtered = filter === 'all' ? photos : photos.filter((p) => p.view_type === filter)

  const handleUpload = async () => {
    if (!selectedFile || !user) return
    setUploading(true)
    try {
      const path = await uploadProgressPhoto(user.id, selectedFile, viewType)
      const error = await addPhoto(path, viewType)
      if (error) {
        add(error.message, 'error')
      } else {
        add('Photo ajoutée', 'success')
        setUploadOpen(false)
        setSelectedFile(null)
      }
    } catch (err: unknown) {
      add(err instanceof Error ? err.message : 'Erreur upload', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, storagePath: string) => {
    const error = await deletePhoto(id, storagePath)
    if (error) add(error.message, 'error')
  }

  const viewLabels: Record<ViewFilter, string> = {
    all: 'Tout', front: 'Face', side: 'Côté', back: 'Dos'
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(['all', 'front', 'side', 'back'] as ViewFilter[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(v)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              filter === v ? 'bg-accent text-bg' : 'bg-surface border border-border text-muted'
            }`}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="aspect-square bg-surface rounded-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted text-sm">Aucune photo. Commence à tracker ta progression.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {filtered.map((photo) => (
            <div key={photo.id} className="relative aspect-square group">
              <img
                src={getPhotoUrl(photo.storage_path)}
                alt={photo.view_type ?? ''}
                className="w-full h-full object-cover rounded-card cursor-pointer"
                onClick={() => setFullscreen(getPhotoUrl(photo.storage_path))}
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => handleDelete(photo.id, photo.storage_path)}
                className="absolute top-1 right-1 bg-bg/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} className="text-error" />
              </button>
              {photo.view_type && (
                <span className="absolute bottom-1 left-1 bg-bg/70 text-xs text-white px-1.5 py-0.5 rounded-full capitalize">
                  {photo.view_type}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <Button size="lg" onClick={() => setUploadOpen(true)}>
        <Plus size={16} className="mr-2" /> Ajouter une photo
      </Button>

      {/* Upload modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Ajouter une photo">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-muted text-sm block mb-2">Vue</label>
            <div className="flex gap-2">
              {(['front', 'side', 'back'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setViewType(v)}
                  className={`flex-1 py-2 rounded-card border text-sm font-semibold transition-colors ${
                    viewType === v ? 'bg-accent text-bg border-accent' : 'border-border text-muted'
                  }`}
                >
                  {viewLabels[v]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-muted text-sm block mb-2">Photo</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="w-full text-text text-sm"
            />
          </div>
          {selectedFile && (
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="preview"
              className="w-full rounded-card object-cover max-h-48"
            />
          )}
          <Button size="lg" onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? 'Envoi...' : 'Enregistrer'}
          </Button>
        </div>
      </Modal>

      {/* Fullscreen view */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setFullscreen(null)}
          >
            <button type="button" className="absolute top-4 right-4 text-white z-10">
              <X size={24} />
            </button>
            <img src={fullscreen} alt="fullscreen" className="max-w-full max-h-full object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
