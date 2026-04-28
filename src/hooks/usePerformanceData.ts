import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { epley1RM } from '../lib/pr-calculator'

export interface ExerciseDataPoint {
  date: string // "2024-01-15"
  weight: number
  reps: number
  estimated1RM: number
  volume: number // total volume that session for this exercise
}

export interface ExercisePRs {
  maxWeight: number
  maxReps: number
  max1RM: number
  maxWeightDate: string | null
  maxRepsDate: string | null
  max1RMDate: string | null
}

export interface WeeklyVolumePoint {
  week: string // "Jan 15"
  volume: number
}

export function usePerformanceData(exerciseName: string | null) {
  const [dataPoints, setDataPoints] = useState<ExerciseDataPoint[]>([])
  const [prs, setPRs] = useState<ExercisePRs>({ maxWeight: 0, maxReps: 0, max1RM: 0, maxWeightDate: null, maxRepsDate: null, max1RMDate: null })
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolumePoint[]>([])
  const [exerciseNames, setExerciseNames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch all distinct exercise names
  useEffect(() => {
    supabase
      .from('session_sets')
      .select('exercise_name')
      .then(({ data }) => {
        if (data) {
          const names = [...new Set(data.map((d) => d.exercise_name))].sort()
          setExerciseNames(names)
        }
      })
  }, [])

  // Fetch performance data for selected exercise
  useEffect(() => {
    if (!exerciseName) return
    setLoading(true)

    const fetchData = async () => {
      // Get all sets for this exercise across all sessions
      type SetRow = {
        weight: number | null
        reps: number | null
        created_at: string
        session_id: string
        session: { started_at: string } | null
      }
      const { data: rawSets } = await supabase
        .from('session_sets')
        .select('weight, reps, created_at, session_id, session:sessions!inner(started_at)')
        .eq('exercise_name', exerciseName)
        .order('created_at', { ascending: true })

      const sets = rawSets as unknown as SetRow[] | null

      if (!sets) { setLoading(false); return }

      // Group by session, take best set per session
      const sessionMap = new Map<string, { date: string; bestWeight: number; bestReps: number; totalVolume: number }>()
      for (const s of sets) {
        const sessionDate = s.session?.started_at ?? s.created_at
        const date = sessionDate.split('T')[0]
        const w = s.weight ?? 0
        const r = s.reps ?? 0
        const existing = sessionMap.get(s.session_id)
        if (!existing) {
          sessionMap.set(s.session_id, { date, bestWeight: w, bestReps: r, totalVolume: w * r })
        } else {
          existing.totalVolume += w * r
          if (w > existing.bestWeight || (w === existing.bestWeight && r > existing.bestReps)) {
            existing.bestWeight = w
            existing.bestReps = r
          }
        }
      }

      const points: ExerciseDataPoint[] = [...sessionMap.values()].map((s) => ({
        date: s.date,
        weight: s.bestWeight,
        reps: s.bestReps,
        estimated1RM: epley1RM(s.bestWeight, s.bestReps),
        volume: s.totalVolume,
      }))

      setDataPoints(points)

      // Compute PRs
      const prData = { maxWeight: 0, maxReps: 0, max1RM: 0, maxWeightDate: null as string | null, maxRepsDate: null as string | null, max1RMDate: null as string | null }
      for (const p of points) {
        if (p.weight > prData.maxWeight) { prData.maxWeight = p.weight; prData.maxWeightDate = p.date }
        if (p.reps > prData.maxReps) { prData.maxReps = p.reps; prData.maxRepsDate = p.date }
        if (p.estimated1RM > prData.max1RM) { prData.max1RM = p.estimated1RM; prData.max1RMDate = p.date }
      }
      setPRs(prData)
      setLoading(false)
    }

    fetchData()
  }, [exerciseName])

  // Fetch weekly volume for all exercises
  useEffect(() => {
    const fetchWeekly = async () => {
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, started_at')
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(50)

      if (!sessions || sessions.length === 0) return

      const { data: sets } = await supabase
        .from('session_sets')
        .select('weight, reps, session_id')
        .in('session_id', sessions.map((s) => s.id))

      if (!sets) return

      // Build a map: sessionId → week label
      const sessionWeeks = new Map<string, string>()
      for (const s of sessions) {
        const d = new Date(s.started_at)
        const weekLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        sessionWeeks.set(s.id, weekLabel)
      }

      // Group volume by week (using Monday of the week)
      const weekVolumes = new Map<string, number>()
      for (const set of sets) {
        const weekLabel = sessionWeeks.get(set.session_id)
        if (!weekLabel) continue
        const vol = (set.weight ?? 0) * (set.reps ?? 0)
        weekVolumes.set(weekLabel, (weekVolumes.get(weekLabel) ?? 0) + vol)
      }

      // Take last 8 weeks, sorted chronologically (approximate using sessions order)
      const points: WeeklyVolumePoint[] = [...weekVolumes.entries()]
        .slice(-8)
        .map(([week, volume]) => ({ week, volume: Math.round(volume) }))

      setWeeklyVolume(points)
    }

    fetchWeekly()
  }, [])

  return { dataPoints, prs, weeklyVolume, exerciseNames, loading }
}
