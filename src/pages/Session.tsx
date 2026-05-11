import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Screen } from '../components/layout/Screen'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { SetInput } from '../components/session/SetInput'
import { RestTimer } from '../components/session/RestTimer'
import { SessionRecap } from '../components/session/SessionRecap'
import { PRCelebration } from '../components/session/PRCelebration'
import { useActiveSessionStore } from '../stores/activeSessionStore'
import { useWakeLock } from '../hooks/useWakeLock'
import { useStopwatch } from '../hooks/useTimer'
import { useHaptic } from '../hooks/useHaptic'
import { supabase } from '../lib/supabase'
import { checkPR, hasAnyPR } from '../lib/pr-calculator'
import { formatDuration } from '../lib/time'
import { playSetConfirm, playTimerEnd } from '../lib/audio'
import type { Database } from '../types/database'

type Exercise = Database['public']['Tables']['exercises_template']['Row']
type SessionSet = Database['public']['Tables']['session_sets']['Row']

interface PRInfo {
  exerciseName: string
  type: string
  value: number
}

interface CurrentRecords {
  maxWeight: number
  maxReps: number
  max1RM: number
}

// Fetch last session's sets for an exercise (for "Last time" comparison)
async function fetchLastSets(exerciseTemplateId: string, currentSessionId: string): Promise<SessionSet[]> {
  const { data } = await supabase
    .from('session_sets')
    .select('*')
    .eq('exercise_template_id', exerciseTemplateId)
    .neq('session_id', currentSessionId)
    .order('created_at', { ascending: false })
    .limit(20)
  return (data ?? []) as SessionSet[]
}

// Fetch current PRs for an exercise
async function fetchCurrentPRs(exerciseName: string, userId: string): Promise<CurrentRecords> {
  const { data } = await supabase
    .from('personal_records')
    .select('type, value')
    .eq('exercise_name', exerciseName)
    .eq('user_id', userId)
  const records: CurrentRecords = { maxWeight: 0, maxReps: 0, max1RM: 0 }
  for (const pr of data ?? []) {
    if (pr.type === 'max_weight') records.maxWeight = Math.max(records.maxWeight, pr.value)
    if (pr.type === 'max_reps') records.maxReps = Math.max(records.maxReps, pr.value)
    if (pr.type === '1rm_estimated') records.max1RM = Math.max(records.max1RM, pr.value)
  }
  return records
}

export default function Session() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const workoutIdParam = searchParams.get('workoutId')
  const { add } = useToast()
  const haptic = useHaptic()

  const store = useActiveSessionStore()
  const elapsed = useStopwatch(store.startedAt)
  useWakeLock(true)

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showRecap, setShowRecap] = useState(false)
  const [sessionPRs, setSessionPRs] = useState<PRInfo[]>([])
  const [currentPR, setCurrentPR] = useState<PRInfo | null>(null)
  const [lastSets, setLastSets] = useState<SessionSet[]>([])
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null)

  const currentExercise = exercises[store.currentExerciseIndex] ?? null
  const setsForCurrentExercise = store.sets.filter(
    (s) => s.exerciseTemplateId === currentExercise?.id
  )

  // Superset: all exercises sharing the same group as currentExercise
  const supersetGroup: Exercise[] = (() => {
    if (!currentExercise || currentExercise.superset_group === null) {
      return currentExercise ? [currentExercise] : []
    }
    return exercises.filter(e => e.superset_group === currentExercise.superset_group)
  })()
  const isSuperset = supersetGroup.length > 1

  // Which exercise within the superset is being logged right now (0 = first)
  const [supersetStep, setSupersetStep] = useState(0)

  // The exercise currently being logged
  const activeExercise = supersetGroup[supersetStep] ?? currentExercise

  // Sets already logged for the active exercise this session
  const setsForActive = store.sets.filter(s => s.exerciseTemplateId === activeExercise?.id)

  // Completed rounds = minimum sets logged across all exercises in the group
  const completedRounds = isSuperset
    ? Math.min(...supersetGroup.map(e => store.sets.filter(s => s.exerciseTemplateId === e.id).length))
    : setsForActive.length

  // All sets done when completed rounds reaches target
  const allSetsDone = activeExercise !== null && currentExercise !== null &&
    completedRounds >= currentExercise.target_sets

  // Initialize or resume session
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      setLoading(true)

      // If there's an active session in the store, just load its exercises
      if (store.sessionId && store.workoutId) {
        const { data: exos } = await supabase
          .from('exercises_template')
          .select('*')
          .eq('workout_id', store.workoutId)
          .order('order_index')
        if (cancelled) return
        setExercises((exos ?? []) as Exercise[])
        setLoading(false)
        return
      }

      // Start a new session
      if (!workoutIdParam) {
        add('Aucune séance sélectionnée', 'error')
        navigate('/')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) { navigate('/'); return }

      // Fetch workout + exercises
      const { data: workout } = await supabase
        .from('workouts')
        .select('*, exercises:exercises_template(*)')
        .eq('id', workoutIdParam)
        .single()

      if (cancelled) return
      if (!workout) {
        add('Séance introuvable', 'error')
        navigate('/')
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawExercises = ((workout as any).exercises ?? []) as Exercise[]
      const sortedExercises = [...rawExercises].sort(
        (a, b) => a.order_index - b.order_index
      )

      // Create session in DB
      const { data: session, error } = await supabase
        .from('sessions')
        .insert({ user_id: user.id, workout_id: workoutIdParam })
        .select()
        .single()

      if (cancelled) return
      if (error || !session) {
        add('Erreur création séance', 'error')
        navigate('/')
        return
      }

      setExercises(sortedExercises)
      store.startSession(session.id, workoutIdParam, workout.name)
      setLoading(false)
    }

    init()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutIdParam])

  // Fetch "last time" data when exercise changes
  useEffect(() => {
    if (!currentExercise || !store.sessionId) return
    fetchLastSets(currentExercise.id, store.sessionId).then(setLastSets)
  }, [currentExercise?.id, store.sessionId])

  useEffect(() => {
    setSupersetStep(0)
  }, [store.currentExerciseIndex])

  // Handle set validation
  const handleValidateSet = async (weight: number, reps: number) => {
    if (!activeExercise || !store.sessionId) return

    const setsForThisExercise = store.sets.filter(s => s.exerciseTemplateId === activeExercise.id)
    const setNumber = setsForThisExercise.length + 1

    store.logSet({
      exerciseTemplateId: activeExercise.id,
      exerciseName: activeExercise.name,
      setNumber,
      reps,
      weight,
      rpe: null,
      completed: true,
    })

    await supabase.from('session_sets').insert({
      session_id: store.sessionId,
      exercise_template_id: activeExercise.id,
      exercise_name: activeExercise.name,
      set_number: setNumber,
      reps,
      weight,
      completed: true,
    })

    // PR check
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const records = await fetchCurrentPRs(activeExercise.name, user.id)
      const result = checkPR(weight, reps, records)
      if (hasAnyPR(result)) {
        const prType = result.isMaxWeight ? 'max_weight' : result.isMaxReps ? 'max_reps' : '1rm_estimated'
        const prValue = result.isMaxWeight ? weight : result.isMaxReps ? reps : result.new1RM
        await supabase.from('personal_records').insert({
          user_id: user.id,
          exercise_name: activeExercise.name,
          type: prType,
          value: prValue,
          reps,
          session_id: store.sessionId,
        })
        const prInfo: PRInfo = { exerciseName: activeExercise.name, type: prType, value: prValue }
        setCurrentPR(prInfo)
        setSessionPRs(prev => [...prev, prInfo])
      } else {
        playSetConfirm()
        haptic.success()
      }
    }

    // Superset: move to next exercise in group without rest
    if (isSuperset && supersetStep < supersetGroup.length - 1) {
      setSupersetStep(prev => prev + 1)
      return
    }

    // Last in group (or solo): reset step and start rest timer
    setSupersetStep(0)
    const restDuration = currentExercise?.target_rest_seconds ?? store.restTimerDuration
    store.startRestTimer(restDuration)
  }

  // Handle rest timer complete
  const handleRestComplete = () => {
    playTimerEnd()
    haptic.heavy()
    store.stopRestTimer()
  }

  // Handle rest dismiss
  const handleRestDismiss = () => {
    store.stopRestTimer()
  }

  // Handle next exercise
  const handleNextExercise = () => {
    const nextIndex = store.currentExerciseIndex + 1
    store.nextExercise()
    if (nextIndex >= exercises.length) {
      setShowRecap(true)
    }
  }

  // Handle finish session
  const handleFinish = async (mood: number, notes: string) => {
    if (!store.sessionId) return

    await supabase.from('sessions').update({
      ended_at: new Date().toISOString(),
      mood,
      notes: notes || null,
    }).eq('id', store.sessionId)

    store.endSession()
    navigate('/')
  }

  // "Last time" summary for current exercise
  const lastTimeText = (() => {
    if (!lastSets.length) return null
    const maxWeightSet = lastSets.reduce((best, s) =>
      (s.weight ?? 0) > (best.weight ?? 0) ? s : best, lastSets[0])
    if (!maxWeightSet.weight || !maxWeightSet.reps) return null
    return `${maxWeightSet.weight}kg × ${maxWeightSet.reps}`
  })()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-accent text-2xl font-black animate-pulse">FORGE</div>
      </div>
    )
  }

  return (
    <>
      <Screen noBottomNav noPadding className="pb-32">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-bg/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-text font-black text-lg">{store.workoutName}</p>
            <p className="text-accent font-bold tabular-nums">{formatDuration(elapsed)}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowRecap(true)}
            className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2 text-sm font-semibold text-text"
          >
            Terminer
          </button>
        </div>

        <div className="px-4 pt-4">
          {/* Exercise list */}
          {exercises.map((exercise, index) => {
            const isActive = index === store.currentExerciseIndex
            const isDone = index < store.currentExerciseIndex
            const sets = store.sets.filter((s) => s.exerciseTemplateId === exercise.id)

            return (
              <motion.div
                key={exercise.id}
                className={`mb-3 rounded-card border transition-all ${
                  isActive
                    ? 'border-accent/50 bg-surface'
                    : isDone
                    ? 'border-success/30 bg-surface/50 opacity-60'
                    : 'border-border bg-surface/30 opacity-40'
                }`}
              >
                {/* Exercise header */}
                <button
                  type="button"
                  onClick={() => setExpandedExercise(expandedExercise === index ? null : index)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isDone ? 'bg-success text-bg' : isActive ? 'bg-accent text-bg' : 'bg-border text-muted'
                    }`}>
                      {isDone ? '✓' : index + 1}
                    </div>
                    <div className="text-left">
                      <p className={`font-bold ${isActive ? 'text-text' : 'text-muted'}`}>{exercise.name}</p>
                      <p className="text-muted text-xs">
                        {exercise.target_sets}×{exercise.target_reps_min}–{exercise.target_reps_max} · {exercise.target_rest_seconds}s
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <span className="text-xs text-accent font-bold">
                        {isSuperset ? completedRounds : sets.length}/{exercise.target_sets}
                      </span>
                    )}
                    {expandedExercise === index ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                  </div>
                </button>

                {/* Active exercise expanded content */}
                {(isActive || expandedExercise === index) && (
                  <div className="px-4 pb-4">
                    {/* Last time */}
                    {isActive && lastTimeText && (
                      <p className="text-muted text-sm mb-3">
                        Dernière fois : <span className="text-text font-bold">{lastTimeText}</span>
                      </p>
                    )}

                    {/* Completed sets summary */}
                    {sets.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {sets.map((s, i) => (
                          <span key={i} className="bg-accent/10 text-accent text-xs font-bold px-2 py-1 rounded-full">
                            {s.weight}kg×{s.reps}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Set input — only for active exercise, only if not all sets done */}
                    {isActive && !allSetsDone && !store.restTimerActive && (
                      <>
                        {isSuperset && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-accent">⚡ SUPERSET</span>
                            <div className="flex gap-1">
                              {supersetGroup.map((e, i) => (
                                <span
                                  key={e.id}
                                  className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                                    i === supersetStep
                                      ? 'bg-accent text-bg'
                                      : 'bg-surface border border-border text-muted'
                                  }`}
                                >
                                  {e.name.length > 10 ? e.name.slice(0, 10) + '…' : e.name}
                                </span>
                              ))}
                            </div>
                            <span className="text-muted text-xs ml-auto">
                              Série {completedRounds + 1}/{currentExercise?.target_sets}
                            </span>
                          </div>
                        )}
                        <SetInput
                          setNumber={setsForActive.length + 1}
                          defaultWeight={setsForActive.length > 0 ? setsForActive[setsForActive.length - 1].weight : (lastSets[0]?.weight ?? null)}
                          defaultReps={setsForActive.length > 0 ? setsForActive[setsForActive.length - 1].reps : (lastSets[0]?.reps ?? null)}
                          onValidate={handleValidateSet}
                        />
                      </>
                    )}

                    {/* All sets done for this exercise */}
                    {isActive && allSetsDone && !store.restTimerActive && (
                      <div className="mt-2">
                        <p className="text-success text-sm font-bold mb-3">
                          ✓ Exercice terminé ({exercise.target_sets} séries)
                        </p>
                        {index < exercises.length - 1 ? (
                          <Button variant="secondary" size="md" onClick={handleNextExercise} className="w-full">
                            Exercice suivant →
                          </Button>
                        ) : (
                          <Button size="lg" onClick={() => setShowRecap(true)} className="w-full">
                            TERMINER LA SÉANCE
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </Screen>

      {/* Rest timer overlay */}
      <AnimatePresence>
        {store.restTimerActive && (
          <RestTimer
            endsAt={store.restTimerEndsAt}
            totalSeconds={store.restTimerDuration}
            onComplete={handleRestComplete}
            onDismiss={handleRestDismiss}
          />
        )}
      </AnimatePresence>

      {/* PR celebration overlay */}
      <PRCelebration
        visible={!!currentPR}
        exerciseName={currentPR?.exerciseName ?? ''}
        prType={currentPR?.type ?? ''}
        value={currentPR?.value ?? 0}
        onDone={() => setCurrentPR(null)}
      />

      {/* Session recap overlay */}
      <AnimatePresence>
        {showRecap && store.startedAt && (
          <SessionRecap
            workoutName={store.workoutName}
            startedAt={store.startedAt}
            sets={store.sets}
            prs={sessionPRs}
            onFinish={handleFinish}
          />
        )}
      </AnimatePresence>
    </>
  )
}
