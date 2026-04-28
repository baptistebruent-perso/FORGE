import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type BodyMetric = Database['public']['Tables']['body_metrics']['Row']

export function useBodyMetrics() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('body_metrics')
        .select('*')
        .order('measured_at', { ascending: true })
      setMetrics(data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refetch() }, [])

  const addMetric = async (m: Omit<BodyMetric, 'id' | 'user_id'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { error } = await supabase.from('body_metrics').insert({ ...m, user_id: user.id })
    if (!error) await refetch()
    return error
  }

  const latestWeight = metrics.length > 0
    ? [...metrics].sort((a, b) => b.measured_at.localeCompare(a.measured_at))[0]?.weight_kg
    : null

  return { metrics, loading, refetch, addMetric, latestWeight }
}
