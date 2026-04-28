import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Workout = Database['public']['Tables']['workouts']['Row']
type Exercise = Database['public']['Tables']['exercises_template']['Row']
export type WorkoutWithExercises = Workout & { exercises: Exercise[] }

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('workouts')
      .select('*, exercises:exercises_template(*)')
      .order('order_index')
    if (data) {
      setWorkouts(
        data.map((w) => ({
          ...w,
          exercises: [...(w.exercises ?? [])].sort((a, b) => a.order_index - b.order_index),
        }))
      )
    }
    setLoading(false)
  }

  useEffect(() => { refetch() }, [])

  const createWorkout = async (name: string, dayOfWeek?: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { error } = await supabase.from('workouts').insert({
      user_id: user.id,
      name,
      day_of_week: dayOfWeek ?? null,
      order_index: workouts.length,
    })
    if (!error) await refetch()
    return error
  }

  const updateWorkout = async (id: string, updates: Database['public']['Tables']['workouts']['Update']) => {
    const { error } = await supabase.from('workouts').update(updates).eq('id', id)
    if (!error) await refetch()
    return error
  }

  const deleteWorkout = async (id: string) => {
    const { error } = await supabase.from('workouts').delete().eq('id', id)
    if (!error) await refetch()
    return error
  }

  const createExercise = async (workoutId: string, data: {
    name: string
    target_sets?: number
    target_reps_min?: number
    target_reps_max?: number
    target_rest_seconds?: number
    rest_after_exercise_seconds?: number
    notes?: string
  }) => {
    const workout = workouts.find((w) => w.id === workoutId)
    const { error } = await supabase.from('exercises_template').insert({
      workout_id: workoutId,
      name: data.name,
      order_index: workout?.exercises.length ?? 0,
      target_sets: data.target_sets ?? 3,
      target_reps_min: data.target_reps_min ?? 8,
      target_reps_max: data.target_reps_max ?? 12,
      target_rest_seconds: data.target_rest_seconds ?? 90,
      rest_after_exercise_seconds: data.rest_after_exercise_seconds ?? 120,
      notes: data.notes,
    })
    if (!error) await refetch()
    return error
  }

  const updateExercise = async (id: string, updates: Database['public']['Tables']['exercises_template']['Update']) => {
    const { error } = await supabase.from('exercises_template').update(updates).eq('id', id)
    if (!error) await refetch()
    return error
  }

  const deleteExercise = async (id: string) => {
    const { error } = await supabase.from('exercises_template').delete().eq('id', id)
    if (!error) await refetch()
    return error
  }

  return {
    workouts,
    loading,
    refetch,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    createExercise,
    updateExercise,
    deleteExercise,
  }
}
