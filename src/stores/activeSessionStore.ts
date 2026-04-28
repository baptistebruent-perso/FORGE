import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SetLog {
  id: string // local UUID for tracking
  exerciseTemplateId: string | null
  exerciseName: string
  setNumber: number
  reps: number | null
  weight: number | null
  rpe: number | null
  completed: boolean
  loggedAt: string // ISO timestamp
}

export interface ActiveSessionStore {
  sessionId: string | null
  workoutId: string | null
  workoutName: string
  startedAt: string | null
  currentExerciseIndex: number
  sets: SetLog[]
  restTimerActive: boolean
  restTimerEndsAt: number | null // Date.now() timestamp
  restTimerDuration: number // seconds

  // Actions
  startSession: (sessionId: string, workoutId: string, workoutName: string) => void
  logSet: (set: Omit<SetLog, 'id' | 'loggedAt'>) => void
  nextExercise: () => void
  startRestTimer: (durationSeconds: number) => void
  stopRestTimer: () => void
  endSession: () => void
  hasActiveSession: () => boolean
}

export const useActiveSessionStore = create<ActiveSessionStore>()(
  persist(
    (set, get) => ({
      sessionId: null,
      workoutId: null,
      workoutName: '',
      startedAt: null,
      currentExerciseIndex: 0,
      sets: [],
      restTimerActive: false,
      restTimerEndsAt: null,
      restTimerDuration: 90,

      startSession: (sessionId, workoutId, workoutName) =>
        set({
          sessionId,
          workoutId,
          workoutName,
          startedAt: new Date().toISOString(),
          currentExerciseIndex: 0,
          sets: [],
          restTimerActive: false,
          restTimerEndsAt: null,
        }),

      logSet: (setData) =>
        set((s) => ({
          sets: [
            ...s.sets,
            {
              ...setData,
              id: crypto.randomUUID(),
              loggedAt: new Date().toISOString(),
            },
          ],
        })),

      nextExercise: () =>
        set((s) => ({
          currentExerciseIndex: s.currentExerciseIndex + 1,
          restTimerActive: false,
          restTimerEndsAt: null,
        })),

      startRestTimer: (durationSeconds) =>
        set({
          restTimerActive: true,
          restTimerEndsAt: Date.now() + durationSeconds * 1000,
          restTimerDuration: durationSeconds,
        }),

      stopRestTimer: () =>
        set({ restTimerActive: false, restTimerEndsAt: null }),

      endSession: () =>
        set({
          sessionId: null,
          workoutId: null,
          workoutName: '',
          startedAt: null,
          currentExerciseIndex: 0,
          sets: [],
          restTimerActive: false,
          restTimerEndsAt: null,
        }),

      hasActiveSession: () => get().sessionId !== null,
    }),
    {
      name: 'forge-active-session',
      // Only persist the data fields, not functions
      partialize: (state) => ({
        sessionId: state.sessionId,
        workoutId: state.workoutId,
        workoutName: state.workoutName,
        startedAt: state.startedAt,
        currentExerciseIndex: state.currentExerciseIndex,
        sets: state.sets,
        restTimerActive: state.restTimerActive,
        restTimerEndsAt: state.restTimerEndsAt,
        restTimerDuration: state.restTimerDuration,
      }),
    }
  )
)
