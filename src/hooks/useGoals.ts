import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Goal = Database['public']['Tables']['goals']['Row']

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false })
      setGoals(data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refetch() }, [])

  const createGoal = async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { error } = await supabase.from('goals').insert({ ...goal, user_id: user.id })
    if (!error) await refetch()
    return error
  }

  const updateGoal = async (id: string, updates: Database['public']['Tables']['goals']['Update']) => {
    const { error } = await supabase.from('goals').update(updates).eq('id', id)
    if (!error) await refetch()
    return error
  }

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (!error) await refetch()
    return error
  }

  const activeGoals = goals.filter((g) => g.status === 'active')
  const achievedGoals = goals.filter((g) => g.status === 'achieved')

  return { goals, activeGoals, achievedGoals, loading, refetch, createGoal, updateGoal, deleteGoal }
}
