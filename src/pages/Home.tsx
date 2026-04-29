import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Flame } from 'lucide-react'

import { Screen } from '../components/layout/Screen'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { CoachMessage } from '../components/coach/CoachMessage'
import { useAuth } from '../contexts/AuthContext'
import { useBodyMetrics } from '../hooks/useBodyMetrics'
import { useActiveSessionStore } from '../stores/activeSessionStore'
import { buildCoachContext, getCoachMessage } from '../lib/coach'
import type { CoachContext } from '../lib/coach'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

// ── Types ────────────────────────────────────────────────────────────────────

type WorkoutRow = Database['public']['Tables']['workouts']['Row']
type SessionRow = Database['public']['Tables']['sessions']['Row']
type SessionSetRow = Database['public']['Tables']['session_sets']['Row']

interface WorkoutWithCount extends WorkoutRow {
  exerciseCount: number
}

interface HomeData {
  coachCtx: CoachContext | null
  coachMessage: string | null
  workouts: WorkoutWithCount[]
  todaySession: SessionRow | null
  todaySets: SessionSetRow[]
  weekSessions: number
  streak: number
  loading: boolean
}

// ── useHomeData hook ─────────────────────────────────────────────────────────

function useHomeData(): HomeData {
  const { user } = useAuth()
  const [data, setData] = useState<HomeData>({
    coachCtx: null,
    coachMessage: null,
    workouts: [],
    todaySession: null,
    todaySets: [],
    weekSessions: 0,
    streak: 0,
    loading: true,
  })

  useEffect(() => {
    if (!user) return

    const userId = user.id

    async function load() {
      try {
        // 1. Coach context
        const coachCtx = await buildCoachContext(userId)
        const coachMessage = getCoachMessage(coachCtx)

        // 2. All workouts ordered by name, with exercise count via subquery
        const { data: rawWorkouts } = await supabase
          .from('workouts')
          .select('*, exercises:exercises_template(count)')
          .eq('user_id', userId)
          .order('name', { ascending: true })

        const workouts: WorkoutWithCount[] = (rawWorkouts ?? []).map((w) => {
          // exercises comes back as [{ count: N }] from the aggregate
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const countArr = (w as any).exercises as Array<{ count: number }> | null
          const exerciseCount = countArr?.[0]?.count ?? 0
          return {
            id: w.id,
            user_id: w.user_id,
            name: w.name,
            day_of_week: w.day_of_week,
            order_index: w.order_index,
            notes: w.notes,
            created_at: w.created_at,
            exerciseCount,
          }
        })

        // 3. Today's session
        const todayMidnight = new Date()
        todayMidnight.setHours(0, 0, 0, 0)

        const { data: todaySessions } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', userId)
          .gte('started_at', todayMidnight.toISOString())
          .order('started_at', { ascending: false })
          .limit(1)

        const todaySession: SessionRow | null = todaySessions?.[0] ?? null

        // 4. Today's sets (for volume + set count)
        let todaySets: SessionSetRow[] = []
        if (todaySession) {
          const { data: setsData } = await supabase
            .from('session_sets')
            .select('*')
            .eq('session_id', todaySession.id)
          todaySets = setsData ?? []
        }

        // 5. Sessions this week (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
        const { data: weekData } = await supabase
          .from('sessions')
          .select('id')
          .eq('user_id', userId)
          .gte('started_at', sevenDaysAgo.toISOString())
        const weekSessions = (weekData ?? []).length

        // 6. Streak: consecutive days with a session (last 30 rows)
        const { data: recentSessions } = await supabase
          .from('sessions')
          .select('started_at')
          .eq('user_id', userId)
          .not('ended_at', 'is', null)
          .order('started_at', { ascending: false })
          .limit(30)

        let streak = 0
        if (recentSessions && recentSessions.length > 0) {
          const sessionDays = new Set(
            recentSessions.map((s) => new Date(s.started_at).toDateString())
          )
          let checkDate = new Date()
          while (sessionDays.has(checkDate.toDateString())) {
            streak++
            checkDate = new Date(checkDate.getTime() - 86400000)
          }
        }

        setData({
          coachCtx,
          coachMessage,
          workouts,
          todaySession,
          todaySets,
          weekSessions,
          streak,
          loading: false,
        })
      } catch {
        setData((prev) => ({ ...prev, loading: false }))
      }
    }

    void load()
  }, [user])

  return data
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract first name from email: part before '@', first letter capitalised, digits removed */
function firstNameFromEmail(email: string | undefined): string {
  if (!email) return 'Coach'
  const raw = email.split('@')[0].replace(/[0-9]/g, '')
  if (!raw) return 'Coach'
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

/** Format elapsed time between two ISO strings as "1h 23min" or "45 min" */
function formatDuration(startedAt: string, endedAt: string): string {
  const diffMs = new Date(endedAt).getTime() - new Date(startedAt).getTime()
  const totalMin = Math.round(diffMs / 60000)
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }
  return `${totalMin} min`
}

/** Compute total volume in kg from a set of session_sets */
function computeVolume(sets: Array<{ weight: number | null; reps: number | null }>): number {
  return sets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0)
}

/** Pick next workout: rotate from last session's workout_id if found */
function pickNextWorkout(
  workouts: WorkoutWithCount[],
  lastWorkoutId: string | null | undefined
): WorkoutWithCount | null {
  if (workouts.length === 0) return null
  if (!lastWorkoutId) return workouts[0]
  const lastIdx = workouts.findIndex((w) => w.id === lastWorkoutId)
  if (lastIdx === -1) return workouts[0]
  return workouts[(lastIdx + 1) % workouts.length]
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface WorkoutCardNotTrainedProps {
  workout: WorkoutWithCount
  onStart: () => void
}

function WorkoutCardNotTrained({ workout, onStart }: WorkoutCardNotTrainedProps) {
  return (
    <div className="bg-surface border border-border rounded-card p-4 space-y-4">
      <div className="space-y-1">
        <p className="text-xs text-muted uppercase tracking-widest font-semibold">Prochain entraînement</p>
        <h2 className="text-xl font-extrabold text-text">{workout.name}</h2>
        <p className="text-sm text-muted">
          {workout.exerciseCount} exercice{workout.exerciseCount !== 1 ? 's' : ''}
        </p>
      </div>
      <Button size="lg" onClick={onStart}>
        COMMENCER
      </Button>
    </div>
  )
}

interface WorkoutCardTrainedProps {
  session: Database['public']['Tables']['sessions']['Row']
  sets: Array<{ weight: number | null; reps: number | null }>
}

function WorkoutCardTrained({ session, sets }: WorkoutCardTrainedProps) {
  const volume = computeVolume(sets)
  const durationLabel = session.ended_at
    ? formatDuration(session.started_at, session.ended_at)
    : 'En cours...'

  return (
    <div className="bg-surface border border-accent/30 rounded-card p-4 space-y-3">
      <h2 className="text-lg font-extrabold text-accent">Séance terminée 💪</h2>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-base font-extrabold text-text">{Math.round(volume)} kg</p>
          <p className="text-xs text-muted">soulevés</p>
        </div>
        <div>
          <p className="text-base font-extrabold text-text">{durationLabel}</p>
          <p className="text-xs text-muted">durée</p>
        </div>
        <div>
          <p className="text-base font-extrabold text-text">{sets.length}</p>
          <p className="text-xs text-muted">séries</p>
        </div>
      </div>
    </div>
  )
}

interface StatsRowProps {
  latestWeight: number | null | undefined
  weekSessions: number
  streak: number
}

function StatsRow({ latestWeight, weekSessions, streak }: StatsRowProps) {
  const weightLabel = latestWeight != null ? `${latestWeight} kg` : '—'

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Weight */}
      <div className="bg-surface border border-border rounded-card p-3 text-center">
        <p className="text-base font-extrabold text-text">{weightLabel}</p>
        <p className="text-xs text-muted mt-0.5">Poids</p>
      </div>
      {/* Sessions this week */}
      <div className="bg-surface border border-border rounded-card p-3 text-center">
        <p className="text-base font-extrabold text-text">{weekSessions}</p>
        <p className="text-xs text-muted mt-0.5">Cette semaine</p>
      </div>
      {/* Streak */}
      <div className="bg-surface border border-border rounded-card p-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <p className="text-base font-extrabold text-text">{streak}</p>
          <Flame size={14} className="text-accent" />
        </div>
        <p className="text-xs text-muted mt-0.5">Jours</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { latestWeight } = useBodyMetrics()
  const hasActiveSession = useActiveSessionStore((s) => s.hasActiveSession())
  const activeWorkoutId = useActiveSessionStore((s) => s.workoutId)

  const {
    coachMessage,
    workouts,
    todaySession,
    todaySets,
    weekSessions,
    streak,
    loading,
  } = useHomeData()

  const firstName = firstNameFromEmail(user?.email)
  const todayLabel = format(new Date(), 'EEEE d MMMM', { locale: fr })
  // Capitalise first letter of day (date-fns fr locale gives lowercase)
  const todayFormatted = todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)

  // Pick next workout (rotation based on active session workout or last session)
  const nextWorkout = pickNextWorkout(workouts, activeWorkoutId ?? null)

  const handleStartWorkout = (workoutId: string) => {
    navigate('/session?workoutId=' + workoutId)
  }

  return (
    <Screen>
      {/* 1. Greeting header */}
      <PageHeader
        title={`Bonjour, ${firstName}`}
        subtitle={todayFormatted}
      />

      <div className="space-y-4">
        {/* 2. Coach message */}
        {coachMessage && <CoachMessage message={coachMessage} />}

        {/* 3. Today's workout card */}
        {loading ? (
          <div className="bg-surface border border-border rounded-card p-4 animate-pulse h-32" />
        ) : todaySession ? (
          <WorkoutCardTrained session={todaySession} sets={todaySets} />
        ) : nextWorkout ? (
          <WorkoutCardNotTrained
            workout={nextWorkout}
            onStart={() => handleStartWorkout(nextWorkout.id)}
          />
        ) : (
          <div className="bg-surface border border-border rounded-card p-4 text-center text-muted text-sm">
            Aucun entraînement configuré. Crée-en un dans Programmes.
          </div>
        )}

        {/* 4. Stats row */}
        <StatsRow
          latestWeight={latestWeight}
          weekSessions={weekSessions}
          streak={streak}
        />
      </div>

      {/* 5. Active session resume banner */}
      {hasActiveSession && (
        <button
          onClick={() => navigate('/session')}
          className="fixed bottom-24 inset-x-4 z-20 bg-accent text-bg font-black text-center py-4 rounded-card animate-pulse"
        >
          SESSION EN COURS → REPRENDRE
        </button>
      )}
    </Screen>
  )
}
