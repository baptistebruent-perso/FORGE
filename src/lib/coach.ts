import { differenceInDays, startOfWeek, endOfWeek } from 'date-fns'
import { supabase } from './supabase'

export interface CoachContext {
  lastSessionDate?: Date | null
  streak?: number
  weeklyVolumeCurrent?: number
  weeklyVolumePrevious?: number
  plateauExercises?: string[]
  todayWorkoutName?: string | null
  lastTimeData?: { exerciseName: string; weight: number; reps: number } | null
  recentMoods?: number[]
}

const templates = {
  pr: (exercise: string, kg: number) =>
    `🔥 +${kg}kg sur le ${exercise}. T'as fait sauter le plateau.`,
  plateau: (exercise: string) =>
    `Tu stagnes sur le ${exercise} depuis 3 séances. Cette semaine, +2.5kg sur la dernière série.`,
  streak: (days: number) =>
    `${days} jours d'affilée. Le momentum est là, garde-le.`,
  comeBack: () =>
    `4 jours sans séance. La routine c'est 80%. On y retourne ?`,
  volumeUp: () =>
    `Volume en hausse cette semaine. Le corps suit.`,
  presession: (workoutName: string, exercise: string, lastWeight: number, lastReps: number) =>
    `Aujourd'hui : ${workoutName}. Last time ${lastReps}×${lastWeight}kg au ${exercise}. Cible : ${lastReps + 1} ou +2.5kg.`,
  deload: () =>
    `Mood bas + plateau. C'est le moment d'une semaine léger. Deload, pas abandon.`,
}

export function getCoachMessage(ctx: CoachContext): string | null {
  const daysSinceLast = ctx.lastSessionDate
    ? differenceInDays(new Date(), ctx.lastSessionDate)
    : null

  if (daysSinceLast !== null && daysSinceLast >= 4) return templates.comeBack()

  if (
    ctx.recentMoods &&
    ctx.recentMoods.length >= 2 &&
    ctx.recentMoods.every((m) => m <= 2) &&
    (ctx.plateauExercises?.length ?? 0) > 0
  ) return templates.deload()

  if (ctx.plateauExercises && ctx.plateauExercises.length > 0)
    return templates.plateau(ctx.plateauExercises[0])

  if (ctx.streak && ctx.streak >= 5) return templates.streak(ctx.streak)

  if (
    ctx.weeklyVolumeCurrent !== undefined &&
    ctx.weeklyVolumePrevious !== undefined &&
    ctx.weeklyVolumePrevious > 0 &&
    ctx.weeklyVolumeCurrent > ctx.weeklyVolumePrevious * 1.05
  ) return templates.volumeUp()

  if (ctx.todayWorkoutName && ctx.lastTimeData)
    return templates.presession(
      ctx.todayWorkoutName,
      ctx.lastTimeData.exerciseName,
      ctx.lastTimeData.weight,
      ctx.lastTimeData.reps
    )

  return null
}

export const prMessage = templates.pr

/** Build coach context from Supabase data for the Home page */
export async function buildCoachContext(userId: string): Promise<CoachContext> {
  const now = new Date()

  // --- Last session date ---
  const { data: lastSessions } = await supabase
    .from('sessions')
    .select('started_at, ended_at, mood, workout_id')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(10)

  const lastSession = lastSessions?.[0]
  const lastSessionDate = lastSession ? new Date(lastSession.started_at) : null

  // --- Streak: count consecutive days with a completed session ---
  let streak = 0
  if (lastSessions && lastSessions.length > 0) {
    const sessionDays = new Set(
      lastSessions.map((s) => new Date(s.started_at).toDateString())
    )
    let checkDate = new Date()
    while (sessionDays.has(checkDate.toDateString())) {
      streak++
      checkDate = new Date(checkDate.getTime() - 86400000)
    }
  }

  // --- Weekly volume ---
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 })
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86400000)
  const lastWeekEnd = new Date(thisWeekEnd.getTime() - 7 * 86400000)

  const { data: thisSessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId)
    .gte('started_at', thisWeekStart.toISOString())
    .lte('started_at', thisWeekEnd.toISOString())

  const { data: lastWeekSessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId)
    .gte('started_at', lastWeekStart.toISOString())
    .lte('started_at', lastWeekEnd.toISOString())

  const sessionIds = (thisSessions ?? []).map((s) => s.id)
  const lastWeekIds = (lastWeekSessions ?? []).map((s) => s.id)

  let weeklyVolumeCurrent = 0
  let weeklyVolumePrevious = 0

  if (sessionIds.length > 0) {
    const { data: sets } = await supabase
      .from('session_sets')
      .select('weight, reps')
      .in('session_id', sessionIds)
    weeklyVolumeCurrent = (sets ?? []).reduce(
      (sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0
    )
  }
  if (lastWeekIds.length > 0) {
    const { data: sets } = await supabase
      .from('session_sets')
      .select('weight, reps')
      .in('session_id', lastWeekIds)
    weeklyVolumePrevious = (sets ?? []).reduce(
      (sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0
    )
  }

  // --- Plateau detection: same weight AND same reps on same exercise for last 3 sessions ---
  const plateauExercises: string[] = []
  if (lastSessions && lastSessions.length >= 3) {
    const { data: sessions3 } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(3)

    if (sessions3 && sessions3.length === 3) {
      const ids = sessions3.map((s) => s.id)
      const { data: setData } = await supabase
        .from('session_sets')
        .select('exercise_name, weight, reps, session_id')
        .in('session_id', ids)

      if (setData) {
        const byExercise = new Map<string, Map<string, { weight: number; reps: number }>>()
        for (const s of setData) {
          if (!byExercise.has(s.exercise_name))
            byExercise.set(s.exercise_name, new Map())
          // Keep best set per session
          const existing = byExercise.get(s.exercise_name)!.get(s.session_id)
          if (!existing || (s.weight ?? 0) > existing.weight)
            byExercise.get(s.exercise_name)!.set(s.session_id, {
              weight: s.weight ?? 0,
              reps: s.reps ?? 0,
            })
        }
        for (const [exName, sessionMap] of byExercise) {
          if (sessionMap.size === 3) {
            const vals = [...sessionMap.values()]
            const allSame = vals.every(
              (v) => v.weight === vals[0].weight && v.reps === vals[0].reps
            )
            if (allSame) plateauExercises.push(exName)
          }
        }
      }
    }
  }

  // --- Recent moods ---
  const recentMoods = (lastSessions ?? [])
    .slice(0, 3)
    .map((s) => s.mood)
    .filter((m): m is number => m !== null)

  // --- Today's workout + last time data ---
  const todayDayOfWeek = (now.getDay() + 6) % 7 // Convert JS Sunday=0 to Mon=0 format
  const { data: todayWorkout } = await supabase
    .from('workouts')
    .select('name, id, exercises:exercises_template(name, id)')
    .eq('user_id', userId)
    .eq('day_of_week', todayDayOfWeek)
    .limit(1)
    .single()

  let todayWorkoutName: string | null = null
  let lastTimeData: CoachContext['lastTimeData'] = null

  if (todayWorkout) {
    todayWorkoutName = todayWorkout.name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exercises = (todayWorkout as any).exercises as Array<{ name: string; id: string }>
    if (exercises && exercises.length > 0) {
      const firstExo = exercises[0]
      const { data: lastSetForExo } = await supabase
        .from('session_sets')
        .select('weight, reps, exercise_name')
        .eq('exercise_template_id', firstExo.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (lastSetForExo?.weight && lastSetForExo.reps) {
        lastTimeData = {
          exerciseName: firstExo.name,
          weight: lastSetForExo.weight,
          reps: lastSetForExo.reps,
        }
      }
    }
  }

  return {
    lastSessionDate,
    streak,
    weeklyVolumeCurrent,
    weeklyVolumePrevious,
    plateauExercises,
    todayWorkoutName,
    lastTimeData,
    recentMoods,
  }
}
