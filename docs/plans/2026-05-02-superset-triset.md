# Superset / Triset Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow exercises in a workout to be grouped as supersets or trisets, and handle them correctly during an active session (A → B → C → rest).

**Architecture:** Add a `superset_group` integer column to `exercises_template`. Exercises sharing the same `superset_group` value within a workout form a group. The Program page gets a toggle between consecutive exercises. The Session page detects groups and cycles through all exercises before starting the rest timer.

**Tech Stack:** Supabase (SQL migration), TypeScript (database types), React (Program + Session pages), Zustand (no changes needed to store).

---

## Task 1: Database migration

**Files:**
- No file to create — run SQL directly in Supabase SQL Editor

**Step 1: Run this SQL in Supabase → SQL Editor → New query**

```sql
ALTER TABLE exercises_template ADD COLUMN superset_group int;
```

Expected: "Success. No rows returned."

**Step 2: Verify**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'exercises_template' AND column_name = 'superset_group';
```

Expected: one row returned with `superset_group` / `integer`.

---

## Task 2: Update TypeScript types

**Files:**
- Modify: `src/types/database.ts`

**Step 1: Read the file**

Find the `exercises_template` entry. Add `superset_group: number | null` to Row, Insert, and Update.

Before (Row):
```ts
Row: { id: string; workout_id: string; name: string; order_index: number; target_sets: number; target_reps_min: number; target_reps_max: number; target_rest_seconds: number; rest_after_exercise_seconds: number; notes: string | null }
```

After (Row):
```ts
Row: { id: string; workout_id: string; name: string; order_index: number; target_sets: number; target_reps_min: number; target_reps_max: number; target_rest_seconds: number; rest_after_exercise_seconds: number; notes: string | null; superset_group: number | null }
```

Same change for Insert and Update (add `superset_group?: number | null`).

**Step 2: Verify TypeScript compiles**

```bash
cd /Users/baptiste/Documents/SuperAgent/CoachSport
npx tsc --noEmit
```

Expected: zero errors.

**Step 3: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: add superset_group column to exercises_template type"
```

---

## Task 3: Program page — superset toggle

**Files:**
- Modify: `src/pages/Program.tsx`

**Context:** The Program page shows a list of exercises per workout. Each exercise has an edit button that opens `ExerciseModal`. Between consecutive exercises, we add a toggle "Superset avec le suivant".

**Step 1: Read `src/pages/Program.tsx` in full**

Find where exercises are rendered (look for `exercise.map` or similar). Also find `ExerciseModal` (the form to create/edit an exercise).

**Step 2: Add `toggleSuperset` function**

Add this function inside the `WorkoutCard` component (where exercises are rendered):

```ts
const toggleSuperset = async (exerciseA: Exercise, exerciseB: Exercise, enable: boolean) => {
  if (enable) {
    // Find a free group number (max existing + 1 in this workout)
    const existingGroups = exercises
      .map(e => e.superset_group)
      .filter((g): g is number => g !== null)
    const newGroup = existingGroups.length > 0 ? Math.max(...existingGroups) + 1 : 1
    await updateExercise(exerciseA.id, { superset_group: newGroup })
    await updateExercise(exerciseB.id, { superset_group: newGroup })
  } else {
    // Only clear if both are in the same group
    await updateExercise(exerciseA.id, { superset_group: null })
    await updateExercise(exerciseB.id, { superset_group: null })
  }
}
```

Note: `exercises` here is `workout.exercises` (the sorted array for that workout). `updateExercise` comes from `useWorkouts()`.

**Step 3: Add superset toggle between exercises**

In the exercises list render, after each exercise card (except the last), insert:

```tsx
{index < workout.exercises.length - 1 && (() => {
  const next = workout.exercises[index + 1]
  const isSuperset = exercise.superset_group !== null && exercise.superset_group === next.superset_group
  return (
    <button
      type="button"
      onClick={() => toggleSuperset(exercise, next, !isSuperset)}
      className={`mx-auto flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
        isSuperset
          ? 'border-accent text-accent bg-accent/10'
          : 'border-border text-muted bg-transparent'
      }`}
    >
      {isSuperset ? '⚡ SUPERSET' : '+ superset'}
    </button>
  )
})()}
```

Place this between exercise cards, using the exercise index.

**Step 4: Show superset badge on exercise card**

On the exercise name line, if `exercise.superset_group !== null`, add a small badge:

```tsx
{exercise.superset_group !== null && (
  <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full ml-2">
    SS
  </span>
)}
```

**Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

**Step 6: Commit**

```bash
git add src/pages/Program.tsx
git commit -m "feat: superset toggle between exercises in program page"
```

---

## Task 4: Session page — superset flow

**Files:**
- Modify: `src/pages/Session.tsx`

**Context:** The Session page currently handles one exercise at a time. We need to detect when the current exercise is part of a superset group and cycle through all exercises in the group before starting the rest timer.

**Step 1: Read `src/pages/Session.tsx` in full**

**Step 2: Add superset helper and state**

At the top of the `Session` component, after `const currentExercise = ...`, add:

```ts
// Get all exercises in the same superset group as the current exercise
const supersetGroup: Exercise[] = currentExercise?.superset_group !== null && currentExercise !== null
  ? exercises.filter(e => e.superset_group === currentExercise.superset_group)
  : currentExercise ? [currentExercise] : []

const isSuperset = supersetGroup.length > 1

// Which exercise within the group is currently being logged (0-indexed)
const [supersetStep, setSupersetStep] = useState(0)

// The actual exercise to log right now
const activeExercise = isSuperset ? supersetGroup[supersetStep] : currentExercise

// Sets for the active exercise
const setsForActive = store.sets.filter(s => s.exerciseTemplateId === activeExercise?.id)

// How many complete ROUNDS have been done for this superset
// A round = one set logged for each exercise in the group
const completedRounds = isSuperset
  ? Math.min(...supersetGroup.map(e => store.sets.filter(s => s.exerciseTemplateId === e.id).length))
  : setsForActive.length

const allSetsDone = activeExercise !== null && completedRounds >= (currentExercise?.target_sets ?? 0)
```

**Step 3: Reset supersetStep when exercise changes**

Add this effect:

```ts
useEffect(() => {
  setSupersetStep(0)
}, [store.currentExerciseIndex])
```

**Step 4: Update `handleValidateSet`**

Replace the current `handleValidateSet` with this superset-aware version:

```ts
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

  // PR check (same as before)
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

  // Superset: move to next exercise in group (no rest)
  if (isSuperset && supersetStep < supersetGroup.length - 1) {
    setSupersetStep(supersetStep + 1)
    return // no rest timer yet
  }

  // Last exercise in group (or solo exercise): reset step + start rest
  setSupersetStep(0)
  const restDuration = currentExercise?.target_rest_seconds ?? store.restTimerDuration
  store.startRestTimer(restDuration)
}
```

**Step 5: Update the exercise card render to show superset UI**

In the exercise list, for the active exercise card, update the expanded content:

- Show a superset indicator when `isSuperset`: 
  ```tsx
  {isActive && isSuperset && (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-accent text-xs font-bold">⚡ SUPERSET</span>
      <div className="flex gap-1">
        {supersetGroup.map((e, i) => (
          <span key={e.id} className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            i === supersetStep ? 'bg-accent text-bg' : 'bg-surface text-muted border border-border'
          }`}>
            {e.name.slice(0, 8)}
          </span>
        ))}
      </div>
    </div>
  )}
  ```

- Replace `SetInput` to use `activeExercise` instead of `currentExercise`:
  ```tsx
  {isActive && !allSetsDone && !store.restTimerActive && (
    <SetInput
      setNumber={setsForActive.length + 1}
      defaultWeight={...}
      defaultReps={...}
      onValidate={handleValidateSet}
    />
  )}
  ```

- Show round progress for supersets:
  ```tsx
  {isActive && isSuperset && (
    <p className="text-muted text-xs mb-2">
      Série {completedRounds + 1}/{currentExercise?.target_sets} · Exercice {supersetStep + 1}/{supersetGroup.length}
    </p>
  )}
  ```

**Step 6: Update `allSetsForCurrentExerciseDone` usage**

Replace `allSetsForCurrentExerciseDone` with `allSetsDone` throughout the component (it's the same concept but now superset-aware).

**Step 7: Verify TypeScript**

```bash
npx tsc --noEmit
```

Fix any errors. Expected: zero errors.

**Step 8: Commit**

```bash
git add src/pages/Session.tsx
git commit -m "feat: superset/triset session flow — cycle exercises before rest timer"
```

---

## Task 5: Deploy

**Step 1: Push to GitHub**

```bash
git push origin main
```

Vercel redéploiera automatiquement en ~1 minute.

**Step 2: Verify**

- Ouvre l'appli sur [https://forge-seven-kappa.vercel.app/](https://forge-seven-kappa.vercel.app/)
- Crée un workout avec 2 exercices
- Active le superset entre eux
- Lance une séance — vérifie que l'exercice A s'enchaîne avec B sans timer de repos entre eux
