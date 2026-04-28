import { supabase } from './supabase'

export async function uploadProgressPhoto(
  userId: string,
  file: File,
  viewType: 'front' | 'side' | 'back'
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${Date.now()}-${viewType}.${ext}`
  const { error } = await supabase.storage.from('progress-photos').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  return path
}

export function getPhotoUrl(path: string): string {
  const { data } = supabase.storage.from('progress-photos').getPublicUrl(path)
  return data.publicUrl
}
