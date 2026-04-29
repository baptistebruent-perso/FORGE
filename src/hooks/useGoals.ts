import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Goal = Database['public']['Tables']['goals']['Row']

async function syncCurrentValue(goal: Goal, userId: string): Promise<number | null> {
  switch (goal.type) {
    case 'pr': {
      const { data } = await supabase
        .from('personal_records')
        .select('value')
        .eq('user_id', userId)
        .eq('exercise_name', goal.exercise_name ?? '')
        .order('value', { ascending: false })
        .limit(1)
      return data?.[0]?.value ?? null
    }
    case 'bodyweight': {
      const { data } = await supabase
        .from('body_metrics')
        .select('weight_kg')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(1)
      return data?.[0]?.weight_kg ?? null
    }
    case 'frequency': {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('started_at', since)
      return count ?? 0
    }
    default:
      return null
  }
}

async function syncGoalValues(activeGoals: Goal[], userId: string, setGoals: React.Dispatch<React.SetStateAction<Goal[]>>) {
  const updates: { id: string; current_value: number }[] = []

  for (const goal of activeGoals) {
    const newValue = await syncCurrentValue(goal, userId)
    if (newValue !== null && newValue !== goal.current_value) {
      await supabase.from('goals').update({ current_value: newValue }).eq('id', goal.id)
      updates.push({ id: goal.id, current_value: newValue })
    }
  }

  if (updates.length > 0) {
    setGoals((prev) =>
      prev.map((g) => {
        const update = updates.find((u) => u.id === g.id)
        return update ? { ...g, current_value: update.current_value } : g
      })
    )
  }
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false })
      const loadedGoals = data ?? []
      setGoals(loadedGoals)

      if (user) {
        const active = loadedGoals.filter((g) => g.status === 'active')
        await syncGoalValues(active, user.id, setGoals)
      }
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
