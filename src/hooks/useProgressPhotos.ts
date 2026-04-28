import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type ProgressPhoto = Database['public']['Tables']['progress_photos']['Row']

export function useProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('progress_photos')
        .select('*')
        .order('taken_at', { ascending: false })
      setPhotos(data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refetch() }, [])

  const addPhoto = async (storagePath: string, viewType: 'front' | 'side' | 'back', notes?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { error } = await supabase.from('progress_photos').insert({
      user_id: user.id,
      storage_path: storagePath,
      view_type: viewType,
      taken_at: new Date().toISOString().split('T')[0],
      notes: notes ?? null,
    })
    if (!error) await refetch()
    return error
  }

  const deletePhoto = async (id: string, storagePath: string) => {
    await supabase.storage.from('progress-photos').remove([storagePath])
    const { error } = await supabase.from('progress_photos').delete().eq('id', id)
    if (!error) await refetch()
    return error
  }

  return { photos, loading, refetch, addPhoto, deletePhoto }
}
